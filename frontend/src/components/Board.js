import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import api from "../services/api";
import { debounce } from 'lodash';

const Board = () => {
  const [data, setData] = useState(null);
  const location = useLocation();
  const history = useHistory();
  const [error, setError] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search") || "";
  const priorityFilter = searchParams.get("priority") || "";

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("title", searchQuery);
      if (priorityFilter) params.append("priority", priorityFilter);

      const categoriesResult = await api.get(`/categories?${params.toString()}`);
      const categories = {};
      const tasks = {};
      const categoryOrder = categoriesResult.data.map(c => c.id);

      categoriesResult.data.forEach(category => {
        categories[category.id] = { ...category, taskIds: category.tasks.map(t => t.id) };
        category.tasks.forEach(task => {
          tasks[task.id] = task;
        });
      });

      setData({ tasks, categories, categoryOrder });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to fetch data";
      setError(errorMessage);
      console.error(errorMessage, err);
      alert(errorMessage);
    }
  }, [searchQuery, priorityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setSearchParams = (newParams) => {
    history.push({
        pathname: location.pathname,
        search: newParams.toString()
    });
  };

  const debouncedSetSearchParams = useCallback(debounce(setSearchParams, 300), []);

  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    const newParams = new URLSearchParams(location.search);
    if (newQuery) {
        newParams.set("search", newQuery);
    } else {
        newParams.delete("search");
    }
    debouncedSetSearchParams(newParams);
  };
  
  const handlePriorityChange = (e) => {
    const newPriority = e.target.value;
    const newParams = new URLSearchParams(location.search);
    if (newPriority) {
        newParams.set("priority", newPriority);
    } else {
        newParams.delete("priority");
    }
    setSearchParams(newParams);
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    const originalData = JSON.parse(JSON.stringify(data));
    
    // Optimistic UI update
    const newData = { ...data };
    delete newData.tasks[taskId];
    Object.values(newData.categories).forEach(category => {
      category.taskIds = category.taskIds.filter(id => id !== taskId);
    });
    setData(newData);

    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete task";
      setError(errorMessage);
      console.error(errorMessage, err);
      alert(errorMessage);
      setData(originalData); // Revert on failure
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const originalData = JSON.parse(JSON.stringify(data));
    const task = data.tasks[draggableId];
    
    // Optimistic UI update
    const start = data.categories[source.droppableId];
    const end = data.categories[destination.droppableId];
    const newData = { ...data };

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    
    if (start === end) {
        startTaskIds.splice(destination.index, 0, parseInt(draggableId));
        const newCategory = { ...start, taskIds: startTaskIds };
        newData.categories[newCategory.id] = newCategory;
    } else {
        const newStart = { ...start, taskIds: startTaskIds };
        const endTaskIds = Array.from(end.taskIds);
        endTaskIds.splice(destination.index, 0, parseInt(draggableId));
        const newEnd = { ...end, taskIds: endTaskIds };
        newData.categories[newStart.id] = newStart;
        newData.categories[newEnd.id] = newEnd;
    }
    setData(newData);

    try {
      await api.put(`/tasks/${draggableId}/position`, {
        source,
        destination,
        version: task.version
      });
      // Optionally refetch to get the new version number
      // fetchData(); 
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update task position";
      setError(errorMessage);
      console.error(errorMessage, err);
      alert(errorMessage);
      setData(originalData); // Revert on failure
    }
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>
  }

  return (
    <div>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ padding: '8px', width: '250px' }}
            />
            <select onChange={handlePriorityChange} value={priorityFilter} style={{ padding: '8px' }}>
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
        </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {data.categoryOrder.map((categoryId) => {
            const category = data.categories[categoryId];
            const tasks = category.taskIds.map((taskId) => data.tasks[taskId]).filter(Boolean);

            return (
              <Droppable droppableId={categoryId.toString()} key={categoryId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      background: "#f4f5f7",
                      padding: 8,
                      width: 300,
                      minHeight: 500,
                      borderRadius: '4px'
                    }}
                  >
                    <h2 style={{ padding: '0 8px' }}>{category.title}</h2>
                    {tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              userSelect: "none",
                              padding: 16,
                              margin: "0 0 8px 0",
                              minHeight: "50px",
                              backgroundColor: "#fff",
                              borderRadius: '4px',
                              boxShadow: '0 1px 0 rgba(9,30,66,.25)',
                              ...provided.draggableProps.style,
                              position: 'relative'
                            }}
                          >
                            {task.title}
                            <button 
                              onClick={() => deleteTask(task.id)}
                              style={{ position: 'absolute', top: 5, right: 5, cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '16px', fontWeight: 'bold' }}
                             >
                              &times;
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Board;
