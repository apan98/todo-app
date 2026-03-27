
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getTasks, getCategories, updateTask } from '../api';

const Board = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: tasksData } = await getTasks();
      const { data: categoriesData } = await getCategories();
      setTasks(tasksData);
      setCategories(categoriesData);
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

    const task = tasks.find((t) => t.id === parseInt(draggableId));
    const newTasks = tasks.filter((t) => t.id !== parseInt(draggableId));
    task.categoryId = parseInt(destination.droppableId);
    newTasks.splice(destination.index, 0, task);
    setTasks(newTasks);

    await updateTask(draggableId, { categoryId: parseInt(destination.droppableId) });
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
                style={{ margin: '8px', border: '1px solid lightgrey', borderRadius: '2px', width: '220px' }}
              >
                <h3>{category.name}</h3>
                {tasks
                  .filter((task) => task.categoryId === category.id)
                  .map((task, index) => (
                    <Draggable draggableId={task.id.toString()} index={index} key={task.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            userSelect: 'none',
                            padding: '16px',
                            margin: '0 0 8px 0',
                            backgroundColor: 'white',
                            border: '1px solid lightgrey',
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
