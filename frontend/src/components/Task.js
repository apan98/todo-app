import React, { useState } from 'react';
import axios from 'axios';

const Task = ({ task, fetchTasks }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedStatus, setEditedStatus] = useState(task.status);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        { title: editedTitle, description: editedDescription, status: editedStatus },
        { headers: { 'x-auth-token': token } }
      );
      setIsEditing(false);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${task._id}`, {
        headers: { 'x-auth-token': token },
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div style={{ border: '1px solid gray', padding: '5px', margin: '5px' }}>
      {isEditing ? (
        <div>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
          />
          <select value={editedStatus} onChange={(e) => setEditedStatus(e.target.value)}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <h4>{task.title}</h4>
          <p>{task.description}</p>
          <p>Status: {task.status}</p>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default Task;