import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";

const initialData = {
  tasks: {},
  categories: {},
  categoryOrder: [],
};

const Board = () => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const fetchData = async () => {
      const categoriesRes = await axios.get("http://localhost:5000/api/categories");
      const tasksRes = await axios.get("http://localhost:5000/api/tasks");

      const tasks = {};
      tasksRes.data.forEach(task => (tasks[task.id] = task));

      const categories = {};
      categoriesRes.data.forEach(category => (categories[category.id] = { ...category, taskIds: [] }));

      tasksRes.data.forEach(task => {
        if (categories[task.categoryId]) {
          categories[task.categoryId].taskIds.push(task.id);
        }
      });

      const categoryOrder = categoriesRes.data.map(category => category.id);

      setData({
        tasks,
        categories,
        categoryOrder,
      });
    };
    fetchData();
  }, []);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = data.categories[source.droppableId];
    const end = data.categories[destination.droppableId];

    if (start === end) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newCategory = {
        ...start,
        taskIds: newTaskIds,
      };

      const newData = {
        ...data,
        categories: {
          ...data.categories,
          [newCategory.id]: newCategory,
        },
      };

      setData(newData);
      return;
    }

    // Moving from one list to another
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...start,
      taskIds: startTaskIds,
    };

    const endTaskIds = Array.from(end.taskIds);
    endTaskIds.splice(destination.index, 0, draggableId);
    const newEnd = {
      ...end,
      taskIds: endTaskIds,
    };

    const newData = {
      ...data,
      categories: {
        ...data.categories,
        [newStart.id]: newStart,
        [newEnd.id]: newEnd,
      },
    };
    setData(newData);

    axios.put(`http://localhost:5000/api/tasks/${draggableId}`, {
        categoryId: end.id
    })
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {data.categoryOrder.map((categoryId) => {
          const category = data.categories[categoryId];
          const tasks = category.taskIds.map((taskId) => data.tasks[taskId]);

          return (
            <Droppable droppableId={categoryId.toString()} key={categoryId}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    background: "lightgrey",
                    padding: 4,
                    width: 250,
                    minHeight: 500,
                  }}
                >
                  <h2>{category.title}</h2>
                  {tasks.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            userSelect: "none",
                            padding: 16,
                            margin: "0 0 8px 0",
                            minHeight: "50px",
                            backgroundColor: "#fff",
                            ...provided.draggableProps.style,
                          }}
                        >
                          {task.title}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default Board;
