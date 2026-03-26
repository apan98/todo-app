import React, { useState, useEffect } from "react";
import api from "../api";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./Board.css";

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
          api.get("/tasks"),
          api.get("/categories"),
        ]);
        setTasks(tasksRes.data.tasks); // tasks are nested under 'tasks' key
        setCategories(categoriesRes.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data. You might need to log in.");
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

    const sourceCategoryId = parseInt(source.droppableId);
    const destCategoryId = parseInt(destination.droppableId);
    
    // Create a deep copy for optimistic update
    const originalTasks = JSON.parse(JSON.stringify(tasks));
    
    // Find the task being moved
    const taskToMove = tasks.find(t => t.id === parseInt(draggableId));
    if (!taskToMove) return;

    // Remove task from its original position
    let tasksInSourceCol = tasks.filter(t => t.CategoryId === sourceCategoryId);
    tasksInSourceCol.splice(source.index, 1);

    // Add task to its new position
    let tasksInDestCol = (sourceCategoryId === destCategoryId) 
        ? tasksInSourceCol 
        : tasks.filter(t => t.CategoryId === destCategoryId);
    tasksInDestCol.splice(destination.index, 0, taskToMove);

    // Update positions for all affected tasks
    const updatePositions = (taskArray, categoryId) => {
        return taskArray.map((task, index) => ({
            ...task,
            position: index,
            CategoryId: categoryId
        }));
    };
    
    const updatedSourceCol = updatePositions(tasksInSourceCol, sourceCategoryId);
    let finalTasks = tasks.filter(t => t.CategoryId !== sourceCategoryId && t.CategoryId !== destCategoryId);
    
    if (sourceCategoryId === destCategoryId) {
        finalTasks.push(...updatedSourceCol);
    } else {
        const updatedDestCol = updatePositions(tasksInDestCol, destCategoryId);
        finalTasks.push(...updatedSourceCol, ...updatedDestCol);
    }

    setTasks(finalTasks); // Optimistic UI update

    // Prepare data for the backend
    const tasksToUpdate = (sourceCategoryId === destCategoryId) 
        ? updatedSourceCol 
        : [...updatedSourceCol, ...updatedDestCol];
    
    if (tasksToUpdate.length === 0) return;

    try {
        await api.put("/tasks/order", { tasks: tasksToUpdate });
    } catch (err) {
        setError("Failed to update task order. Reverting changes.");
        setTasks(originalTasks); // Revert on error
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

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
                          {task.dueDate && <small>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </small>}
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
