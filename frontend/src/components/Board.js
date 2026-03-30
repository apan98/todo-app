import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Column from './Column';

const Board = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { 'x-auth-token': token },
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const statuses = ['todo', 'in-progress', 'done'];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      {statuses.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={tasks.filter((task) => task.status === status)}
          fetchTasks={fetchTasks}
        />
      ))}
    </div>
  );
};

export default Board;