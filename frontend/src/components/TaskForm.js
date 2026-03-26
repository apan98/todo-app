import React, { useState } from 'react';
import axios from 'axios';

const TaskForm = ({ task, isEditing, onTaskUpdated, onTaskCreated }) => {
  const [title, setTitle] = useState(task ? task.title : '');
  const [description, setDescription] = useState(task ? task.description : '');
  const [priority, setPriority] = useState(task ? task.priority : 'low');
  const [deadline, setDeadline] = useState(task && task.deadline ? task.deadline.split('T')[0] : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = { title, description, priority, deadline: deadline || null };

    try {
      if (isEditing) {
        await axios.put(`/api/tasks/${task.id}`, taskData);
        onTaskUpdated();
      } else {
        await axios.post('/api/tasks', taskData);
        onTaskCreated();
      }
    } catch (error) {
      console.error('Failed to save task', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      <button type="submit">{isEditing ? 'Update Task' : 'Create Task'}</button>
    </form>
  );
};

export default TaskForm;
