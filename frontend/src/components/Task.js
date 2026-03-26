import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const Task = ({ task, index }) => {
  const isOverdue = (() => {
    if (!task.deadline || task.categoryName === 'Done') {
      return false;
    }
    // The deadline from the server is a UTC timestamp, e.g., "2023-10-27T00:00:00.000Z"
    // We need to compare dates only, ignoring time and timezones.
    const deadlineDate = new Date(task.deadline);
    // Extracts the date part in UTC
    const deadlineDay = new Date(Date.UTC(deadlineDate.getUTCFullYear(), deadlineDate.getUTCMonth(), deadlineDate.getUTCDate()));

    const today = new Date();
    // Extracts today's date part in UTC
    const todayDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    return deadlineDay < todayDay;
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
