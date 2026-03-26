import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import api from "../services/api";

const Board = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await api.get("/categories");
      const categories = {};
      const tasks = {};
      const categoryOrder = result.data.map(c => c.id);

      result.data.forEach(category => {
        categories[category.id] = { ...category, taskIds: category.tasks.map(t => t.id) };
        category.tasks.forEach(task => {
          tasks[task.id] = task;
        });
      });

      setData({ tasks, categories, categoryOrder });
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

    const newData = { ...data };

    if (start === end) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newCategory = {
        ...start,
        taskIds: newTaskIds,
      };

      newData.categories[newCategory.id] = newCategory;
    } else {
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

      newData.categories[newStart.id] = newStart;
      newData.categories[newEnd.id] = newEnd;
    }

    setData(newData);

    api.put(`/tasks/position`, {
      source,
      destination,
      draggableId
    }).catch(err => {
        // revert state on error
        // simplified for brevity
        console.error("Failed to update task position", err);
    });
  };

  if (!data) {
    return <div>Loading...</div>;
  }

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

