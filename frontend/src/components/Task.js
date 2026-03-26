import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const Task = ({ task, index }) => {
  const isOverdue = (() => {
    if (!task.deadline || task.categoryName === 'Done') {
      return false;
    }
    // Get today's date at midnight in the local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // The deadline from the server is a string like "2023-10-27".
    // new Date("2023-10-27") will create a date at midnight in the local timezone.
    const deadlineDate = new Date(task.deadline);

    return deadlineDate < today;
  })();

  const getDeadlineString = (deadline) => {
    if (!deadline) return 'No deadline';
    // Display the date using the user's locale, but interpret the date as UTC.
    return new Date(deadline).toLocaleDateString(undefined, { timeZone: 'UTC' });
  };

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
          <small>Due: {getDeadlineString(task.deadline)}</small>
        </div>
      )}
    </Draggable>
  );
};

export default Task;
