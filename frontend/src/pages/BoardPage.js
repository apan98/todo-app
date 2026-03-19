import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from '../components/Column';

const BoardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const result = await axios.get('/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
      const categories = await axios.get('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
      
      const tasks = result.data.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
      }, {});
      
      const columns = categories.data.reduce((acc, category) => {
        acc[category.id] = {
          id: category.id,
          title: category.name,
          taskIds: result.data.filter(task => task.categoryId === category.id).map(task => task.id)
        };
        return acc;
      }, {});

      const columnOrder = categories.data.map(category => category.id);
      
      setData({ tasks, columns, columnOrder });
    };
    fetchData();
  }, []);

  const onDragEnd = (result) => {
    // TODO: handle drag and drop
  };
  
  if (!data) return <div>Loading...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {data.columnOrder.map(columnId => {
        const column = data.columns[columnId];
        const tasks = column.taskIds.map(taskId => data.tasks[taskId]);
        return <Column key={column.id} column={column} tasks={tasks} />;
      })}
    </DragDropContext>
  );
};

export default BoardPage;