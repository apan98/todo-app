import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";

const Board = () => {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Fetch categories and tasks from the backend
    axios.get("http://localhost:5000/api/categories").then((res) => {
      setCategories(res.data);
    });
    axios.get("http://localhost:5000/api/tasks").then((res) => {
      setTasks(res.data);
    });
  }, []);

  const onDragEnd = (result) => {
    // Handle drag and drop logic
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {categories.map((category) => (
          <Droppable droppableId={category.id.toString()} key={category.id}>
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
                {tasks
                  .filter((task) => task.categoryId === category.id)
                  .map((task, index) => (
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
        ))}
      </div>
    </DragDropContext>
  );
};

export default Board;
