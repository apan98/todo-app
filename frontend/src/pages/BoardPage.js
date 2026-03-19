import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DragDropContext } from 'react-beautiful-dnd';
import Column from '../components/Column';

// Set credentials to true to allow cookies to be sent
axios.defaults.withCredentials = true;

const BoardPage = () => {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ priority: 'all', search: '' });

  const fetchData = useCallback(async () => {
    try {
      // No need for token in header, it's in an httpOnly cookie
      const tasksResult = await axios.get('/api/tasks');
      const categoriesResult = await axios.get('/api/categories');
      
      const tasks = tasksResult.data.tasks.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
      }, {});
      
      const columns = categoriesResult.data.reduce((acc, category) => {
        acc[category.id] = {
          id: String(category.id), // Ensure IDs are strings for dnd
          title: category.name,
          // Sort tasks by position on initial load
          taskIds: tasksResult.data.tasks
            .filter(task => task.CategoryId === category.id)
            .sort((a, b) => a.position - b.position)
            .map(task => task.id)
        };
        return acc;
      }, {});

      const columnOrder = categoriesResult.data.map(category => String(category.id));
      
      setData({ tasks, columns, columnOrder });
    } catch (error) {
      console.error("Error fetching data", error);
      // Handle auth errors, e.g., redirect to login
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDragEnd = (result) => {
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

    // Optimistic UI update
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = { ...startColumn, taskIds: startTaskIds };

    let newFinishColumn;
    if (startColumn === finishColumn) {
        const newTaskIds = Array.from(startColumn.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, parseInt(draggableId));
        newFinishColumn = { ...startColumn, taskIds: newTaskIds };
    } else {
        const finishTaskIds = Array.from(finishColumn.taskIds);
        finishTaskIds.splice(destination.index, 0, parseInt(draggableId));
        newFinishColumn = { ...finishColumn, taskIds: finishTaskIds };
    }

    const newState = {
      ...data,
      columns: {
        ...data.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    };
    setData(newState);

    // Persist changes to the backend
    axios.post('/api/tasks/dnd/reorder', {
        draggableId: parseInt(draggableId),
        source: { droppableId: parseInt(source.droppableId), index: source.index },
        destination: { droppableId: parseInt(destination.droppableId), index: destination.index },
    })
    .catch(err => {
        console.error("Failed to reorder task", err);
        // If the request fails, revert the state to the original data
        fetchData(); 
    });
  };
  
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (!data) return <div>Loading...</div>;

  // Apply filters
  const getFilteredTasks = () => {
    let filtered = Object.values(data.tasks);

    if (filters.priority !== 'all') {
        filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.search) {
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(filters.search.toLowerCase())
        );
    }
    return new Set(filtered.map(t => t.id));
  };

  const filteredTaskIds = getFilteredTasks();

  return (
    <div>
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
                // Filter tasks for the column
                const tasks = column.taskIds
                    .map(taskId => data.tasks[taskId])
                    .filter(task => task && filteredTaskIds.has(task.id));
                return <Column key={column.id} column={column} tasks={tasks} />;
            })}
        </div>
        </DragDropContext>
    </div>
  );
};

export default BoardPage;
