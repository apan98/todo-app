import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'orange';
    case 'low': return 'green';
    default: return 'lightgrey';
  }
};

const Task = ({ task, index }) => {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          style={{
            border: `2px solid ${getPriorityColor(task.priority)}`,
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: 'white',
            ...provided.draggableProps.style,
          }}
        >
          <h4>{task.title}</h4>
          <p>{task.description}</p>
        </div>
      )}
    </Draggable>
  );
};

export default Task;
