import React from 'react';
import Task from './Task';

const Column = ({ status, tasks, fetchTasks }) => {
  return (
    <div style={{ border: '1px solid black', padding: '10px', margin: '10px', minWidth: '300px' }}>
      <h3>{status.toUpperCase()}</h3>
      {tasks.map((task) => (
        <Task key={task._id} task={task} fetchTasks={fetchTasks} />
      ))}
    </div>
  );
};

export default Column;