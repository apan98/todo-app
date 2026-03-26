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

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    const originalData = JSON.parse(JSON.stringify(data));
    
    const newData = { ...data };
    delete newData.tasks[taskId];
    Object.values(newData.categories).forEach(category => {
      category.taskIds = category.taskIds.filter(id => id !== taskId);
    });
    setData(newData);

    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      console.error("Failed to delete task", err);
      setData(originalData); // Revert on failure
    }
  };

  const onDragEnd = async (result) => {
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
    const originalData = JSON.parse(JSON.stringify(data));

    const newData = { ...data };

    if (start === end) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, parseInt(draggableId));

      const newCategory = {
        ...start,
        taskIds: newTaskIds,
      };

      newData.categories[newCategory.id] = newCategory;
    } else {
      const startTaskIds = Array.from(start.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStart = {
        ...start,
        taskIds: startTaskIds,
      };

      const endTaskIds = Array.from(end.taskIds);
      endTaskIds.splice(destination.index, 0, parseInt(draggableId));
      const newEnd = {
        ...end,
        taskIds: endTaskIds,
      };

      newData.categories[newStart.id] = newStart;
      newData.categories[newEnd.id] = newEnd;
    }

    setData(newData);

    try {
      await api.put(`/tasks/position`, {
        source,
        destination,
        draggableId
      });
    } catch (err) {
      setData(originalData);
      console.error("Failed to update task position", err);
    }
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {data.categoryOrder.map((categoryId) => {
          const category = data.categories[categoryId];
          const tasks = category.taskIds.map((taskId) => data.tasks[taskId]).filter(Boolean);

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
                            position: 'relative'
                          }}
                        >
                          {task.title}
                          <button 
                            onClick={() => deleteTask(task.id)}
                            style={{ position: 'absolute', top: 5, right: 5, cursor: 'pointer', border: 'none', background: 'transparent' }}
                           >
                            &times;
                          </button>
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
