import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from '../components/Column';
import Logout from '../components/Logout';

// Set credentials to true to allow cookies to be sent
axios.defaults.withCredentials = true;

const BoardPage = () => {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ priority: 'all', search: '' });

    const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
        const params = {
            search: filters.search,
            priority: filters.priority,
        };
        const tasksResult = await axios.get('/api/tasks', { params });
        const categoriesResult = await axios.get('/api/categories');

        const tasks = tasksResult.data.tasks.reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
        }, {});

        const columns = categoriesResult.data.reduce((acc, category) => {
            acc[category.id] = {
                id: String(category.id),
                title: category.name,
                taskIds: tasksResult.data.tasks
                    .filter(task => task.CategoryId === category.id)
                    .sort((a, b) => a.position - b.position)
                    .map(task => task.id),
            };
            return acc;
        }, {});

        const columnOrder = categoriesResult.data.map(category => String(category.id));

        setData({ tasks, columns, columnOrder });
        setError(null); // Clear previous errors
    } catch (error) {
        console.error("Error fetching data", error);
        setError("Failed to fetch board data. Please try again later.");
    }
}, [filters]);

useEffect(() => {
    fetchData();
}, [fetchData]);

const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
    ) {
        return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];
    const movingTaskId = parseInt(draggableId);

    // Create a deep copy of the state for optimistic update and potential rollback
    const originalState = JSON.parse(JSON.stringify(data));

    // Optimistically update UI
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...startColumn, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, movingTaskId);
    const newFinish = { ...finishColumn, taskIds: finishTaskIds };

    const newState = {
        ...data,
        columns: {
            ...data.columns,
            [newStart.id]: newStart,
            [newFinish.id]: newFinish,
        },
    };
    setData(newState);

    try {
        await axios.put(`/api/tasks/${movingTaskId}`, {
            categoryId: parseInt(destination.droppableId),
            order: destination.index,
        });
        // Optionally, refetch data to ensure consistency
        // await fetchData(); 
    } catch (err) {
        console.error("Failed to update task position", err);
        // If the API call fails, revert the UI to the original state
        setData(originalState);
        // Optionally, show an error message to the user
        alert("Failed to move the task. Please try again.");
    }
};
  
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div>
        <Logout />
        {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}
        <div style={{ padding: '10px', display: 'flex', gap: '20px' }}>
            <input 
                type="text"
                name="search"
                placeholder="Search by title..."
                value={filters.search}
                onChange={handleFilterChange}
            />
            <select name="priority" value={filters.priority} onChange={handleFilterChange}>
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex' }}>
            {data.columnOrder.map(columnId => {
                const column = data.columns[columnId];
                const tasks = column.taskIds
                    .map(taskId => data.tasks[taskId])
                    .filter(Boolean); // Filter out undefined tasks
                return <Column key={column.id} column={column} tasks={tasks} />;
            })}
        </div>
        </DragDropContext>
    </div>
  );
};

export default BoardPage;
