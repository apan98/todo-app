import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./Board.css";

const API_URL = "http://localhost:5000/api";

const Board = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [tasksRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/categories`),
        ]);
        setTasks(tasksRes.data);
        setCategories(categoriesRes.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data");
        setLoading(false);
      }
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

    const updatedTasks = Array.from(tasks);
    const task = updatedTasks.find((t) => t.id === parseInt(draggableId));
    task.CategoryId = parseInt(destination.droppableId);

    setTasks(updatedTasks);

    const token = localStorage.getItem("token");
    axios.put(`${API_URL}/tasks/${draggableId}`, task, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board">
        {categories.map((category) => (
          <Droppable key={category.id} droppableId={category.id.toString()}>
            {(provided) => (
              <div
                className="column"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2>{category.name}</h2>
                {tasks
                  .filter((task) => task.CategoryId === category.id)
                  .map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className={`task ${task.priority}`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <h4>{task.title}</h4>
                          <p>{task.description}</p>
                          <small>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </small>
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
