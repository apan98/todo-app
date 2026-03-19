import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const Task = ({ task, index }) => {
  const isOverdue = new Date(task.dueDate) < new Date();

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            border: `2px solid ${
              isOverdue ? "red" : "transparent"
            }`,
            backgroundColor: snapshot.isDragging ? 'lightgreen' : 'white',
            padding: 8,
            marginBottom: 8,
          }}
        >
          <h4>{task.title}</h4>
          <p>{task.description}</p>
          <small>Priority: {task.priority}</small>
          <br />
          <small>Due: {new Date(task.dueDate).toLocaleDateString()}</small>
        </div>
      )}
    </Draggable>
  );
};

export default Task;
