
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api/tasks';

const priorityColors = {
  low: 'green',
  medium: 'orange',
  high: 'red',
};

function App() {
  const [columns, setColumns] = useState({
    '1': { id: '1', title: 'Сделать', tasks: [] },
    '2': { id: '2', title: 'В процессе', tasks: [] },
    '3': { id: '3', title: 'Готово', tasks: [] },
  });
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [priorityFilter, searchQuery]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL, {
        params: { priority: priorityFilter, search: searchQuery },
      });
      const tasks = response.data;
      const newColumns = {
        '1': { id: '1', title: 'Сделать', tasks: [] },
        '2': { id: '2', title: 'В процессе', tasks: [] },
        '3': { id: '3', title: 'Готово', tasks: [] },
      };
      tasks.forEach(task => {
        if (newColumns[task.categoryId]) {
          newColumns[task.categoryId].tasks.push(task);
        }
      });
      setColumns(newColumns);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceTasks = [...sourceColumn.tasks];
      const destTasks = [...destColumn.tasks];
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, tasks: sourceTasks },
        [destination.droppableId]: { ...destColumn, tasks: destTasks },
      });

      try {
        await axios.put(`${API_URL}/${draggableId}`, { categoryId: destination.droppableId });
      } catch (error) {
        console.error('Error updating task category:', error);
      }
    }
  };

  return (
    <div className="App">
      <h1>Kanban Board</h1>
      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {Object.values(columns).map(column => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="column"
                >
                  <h2>{column.title}</h2>
                  {column.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="task"
                          style={{
                            ...provided.draggableProps.style,
                            borderLeft: `5px solid ${priorityColors[task.priority]}`,
                          }}
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
}

export default App;
