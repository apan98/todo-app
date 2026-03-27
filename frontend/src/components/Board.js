import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from './Column';

const Board = () => {
  const [data, setData] = useState({ tasks: {}, columns: {}, columnOrder: [] });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const categoriesRes = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tasksRes = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const tasks = {};
      tasksRes.data.forEach(task => (tasks[task.id] = task));

      const columns = {};
      categoriesRes.data.forEach(category => {
        columns[category.id] = {
          id: category.id,
          title: category.name,
          taskIds: []
        };
      });

      tasksRes.data.forEach(task => {
        if (columns[task.categoryId]) {
          columns[task.categoryId].taskIds.push(task.id);
        }
      });

      const columnOrder = categoriesRes.data.map(c => c.id);

      setData({ tasks, columns, columnOrder });
    };
    fetchData();
  }, []);

  const onDragEnd = result => {
    // ...
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex' }}>
        {data.columnOrder.map(columnId => {
          const column = data.columns[columnId];
          const tasks = column.taskIds.map(taskId => data.tasks[taskId]);
          return <Column key={column.id} column={column} tasks={tasks} />;
        })}
      </div>
    </DragDropContext>
  );
};

export default Board;
