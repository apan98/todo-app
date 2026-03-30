import { Task } from './types';

const API_BASE = process.env.VITE_API_BASE || '/api';

class ApiService {
  async fetchTasks(): Promise<Task[]> {
    try {
      // Fallback to localStorage if API is not available
      const stored = localStorage.getItem('todo-tasks');
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch tasks, using fallback:', error);
      return [];
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const tasks = await this.fetchTasks();
    const newTask: Task = {
      ...task,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.fetchTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    tasks[index] = { ...tasks[index], ...updates };
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
    return tasks[index];
  }

  async deleteTask(id: number): Promise<boolean> {
    const tasks = await this.fetchTasks();
    const filtered = tasks.filter(t => t.id !== id);
    const result = filtered.length < tasks.length;
    localStorage.setItem('todo-tasks', JSON.stringify(filtered));
    return result;
  }
}

export const api = new ApiService();