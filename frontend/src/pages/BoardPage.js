import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from '../components/Column';

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

    // Store the original state
    const originalState = JSON.parse(JSON.stringify(data));

    // Optimistic UI update
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...startColumn, taskIds: startTaskIds };

    let newFinish;
    if (startColumn === finishColumn) {
        const newTaskIds = Array.from(startColumn.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, movingTaskId);
        newFinish = { ...startColumn, taskIds: newTaskIds };
    } else {
        const finishTaskIds = Array.from(finishColumn.taskIds);
        finishTaskIds.splice(destination.index, 0, movingTaskId);
        newFinish = { ...finishColumn, taskIds: finishTaskIds };
    }

    const newState = {
        ...data,
        columns: {
            ...data.columns,
            [newStart.id]: newStart,
            [newFinish.id]: newFinish,
        },
    };
    setData(newState);
    setError(null); // Clear previous errors on new action

    try {
        const taskToUpdate = data.tasks[movingTaskId];
        if (!taskToUpdate) {
            throw new Error("Task data not found for optimistic update!");
        }

        await axios.put(`/api/tasks/${movingTaskId}`, {
            CategoryId: parseInt(destination.droppableId),
            position: destination.index,
            version: taskToUpdate.version, // Include version for optimistic locking
        });

        // If API call is successful, we can refetch data to ensure consistency
        // or update the local task version if the API returns the updated task.
        fetchData();

    } catch (err) {
        console.error("Failed to reorder task", err);
        setError("Could not save task move. Reverting changes.");
        // If the request fails, revert the state to the original data
        setData(originalState);
    }
};
  
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div>
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
