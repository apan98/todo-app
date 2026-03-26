import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const Task = ({ task, index }) => {
  const isOverdue = task.deadline && new Date(task.deadline).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) && task.categoryName !== 'Done';

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
          <small>Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</small>
        </div>
      )}
    </Draggable>
  );
};

export default Task;
