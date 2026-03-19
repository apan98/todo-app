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
        setLoading(true);
        const [tasksRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/tasks`, { withCredentials: true }),
          axios.get(`${API_URL}/categories`, { withCredentials: true }),
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

    const tasksInDestination = updatedTasks.filter(
      (t) => t.CategoryId === parseInt(destination.droppableId)
    );
    tasksInDestination.splice(source.index, 1);
    tasksInDestination.splice(destination.index, 0, task);

    const updatedPositions = tasksInDestination.map((t, index) => ({
      ...t,
      position: index,
    }));

    const otherTasks = updatedTasks.filter(
      (t) => t.CategoryId !== parseInt(destination.droppableId)
    );
    const newTasks = [...otherTasks, ...updatedPositions];
    const originalTasks = tasks;
    setTasks(newTasks);

    try {
      await axios.put(
        `${API_URL}/tasks/${draggableId}`,
        { CategoryId: parseInt(destination.droppableId) },
        { withCredentials: true }
      );
      // The position update is more complex and might need a separate endpoint
      // For now, we are just updating the category
    } catch (error) {
      setError("Failed to update task. Please try again.");
      setTasks(originalTasks); // Revert on error
    }
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
                  .sort((a, b) => a.position - b.position)
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
