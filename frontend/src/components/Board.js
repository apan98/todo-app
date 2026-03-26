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

    const originalTasks = [...tasks];
    
    const movedTask = originalTasks.find(t => t.id === parseInt(draggableId));
    
    // Optimistically update the state
    const sourceColumnTasks = Array.from(originalTasks.filter(t => t.CategoryId === parseInt(source.droppableId)));
    const [removed] = sourceColumnTasks.splice(source.index, 1);
    
    let newTasks = [...originalTasks];

    if (source.droppableId === destination.droppableId) {
        sourceColumnTasks.splice(destination.index, 0, removed);
        const otherTasks = originalTasks.filter(t => t.CategoryId !== parseInt(source.droppableId));
        newTasks = [...otherTasks, ...sourceColumnTasks.map((t, index) => ({...t, position: index}))];
    } else {
        const destinationColumnTasks = Array.from(originalTasks.filter(t => t.CategoryId === parseInt(destination.droppableId)));
        destinationColumnTasks.splice(destination.index, 0, removed);
        
        const otherTasks = originalTasks.filter(t => t.CategoryId !== parseInt(source.droppableId) && t.CategoryId !== parseInt(destination.droppableId));
        
        newTasks = [
            ...otherTasks, 
            ...sourceColumnTasks.map((t, index) => ({...t, position: index})),
            ...destinationColumnTasks.map((t, index) => ({...t, CategoryId: parseInt(destination.droppableId), position: index}))
        ];
    }
    
    setTasks(newTasks);

    try {
      await axios.put(
        `${API_URL}/tasks/${draggableId}`,
        { 
            CategoryId: parseInt(destination.droppableId),
            position: destination.index
        },
        { withCredentials: true }
      );
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
