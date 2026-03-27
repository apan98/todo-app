import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const Board = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const { data: tasksData } = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: categoriesData } = await axios.get('/api/categories');
      setTasks(tasksData.tasks);
      setCategories(categoriesData.categories);
    };
    fetchData();
  }, []);

  const onDragEnd = (result) => {
    // TODO: implement drag and drop
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex' }}>
        {categories.map((category) => (
          <Droppable droppableId={category.id.toString()} key={category.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  margin: '8px',
                  border: '1px solid lightgrey',
                  borderRadius: '2px',
                  width: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h2>{category.name}</h2>
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
                            userSelect: 'none',
                            padding: '16px',
                            margin: '0 0 8px 0',
                            minHeight: '50px',
                            backgroundColor: '#fff',
                            color: '#333',
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
