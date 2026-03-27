import React, { useState, useEffect, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { AuthContext } from '../context/AuthContext';
import './KanbanBoard.css';

const KanbanBoard = () => {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const { api } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      const categoriesRes = await api.get('/categories');
      const tasksRes = await api.get('/tasks');
      setCategories(categoriesRes.data);
      setTasks(tasksRes.data);
    };
    fetchData();
  }, [api]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) {
      return;
    }
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    const movedTask = tasks.find(task => task.id.toString() === draggableId);
    const updatedTask = { ...movedTask, CategoryId: parseInt(destination.droppableId) };
    api.put(`/tasks/${draggableId}`, updatedTask);
    const newTasks = tasks.map(task =>
      task.id.toString() === draggableId ? updatedTask : task
    );
    setTasks(newTasks);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (priorityFilter ? task.priority === priorityFilter : true)
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search tasks"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {categories.map(category => (
            <Droppable key={category.id} droppableId={category.id.toString()}>
              {(provided) => (
                <div
                  className="category"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h2>{category.name}</h2>
                  {filteredTasks
                    .filter(task => task.CategoryId === category.id)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            className={`task ${task.priority}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h4>{task.title}</h4>
                            <p>{task.description}</p>
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
    </div>
  );
};

export default KanbanBoard;
