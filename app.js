/**
 * Todo App with Kanban Board
 * Модульная архитектура для управления задачами
 */

// StorageManager - управление localStorage
const StorageManager = {
  STORAGE_KEY: 'todo-app-tasks',

  save(taskManager) {
    try {
      const data = {
        tasks: taskManager.tasks,
        nextId: taskManager.nextId
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  },

  load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
    return { tasks: [], nextId: 1 };
  },

  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing tasks:', error);
    }
  }
};

// TaskManager - бизнес-логика управления задачами
const TaskManager = {
  tasks: [],
  nextId: 1,

  init() {
    const data = StorageManager.load();
    this.tasks = data.tasks || [];
    this.nextId = data.nextId || 1;
  },

  addTask(text, status = 'todo') {
    if (!text || text.trim() === '') {
      return null;
    }

    const task = {
      id: this.nextId++,
      text: text.trim(),
      status: status,
      createdAt: new Date().toISOString()
    };

    this.tasks.push(task);
    StorageManager.save(this);
    return task;
  },

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      StorageManager.save(this);
      return true;
    }
    return false;
  },

  updateTaskStatus(id, newStatus) {
    const task = this.tasks.find(t => t.id === id);
    if (task && this.isValidStatus(newStatus)) {
      task.status = newStatus;
      StorageManager.save(this);
      return true;
    }
    return false;
  },

  getTasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  },

  isValidStatus(status) {
    return ['todo', 'in_progress', 'done'].includes(status);
  },

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  },

  getCounts() {
    return {
      todo: this.getTasksByStatus('todo').length,
      in_progress: this.getTasksByStatus('in_progress').length,
      done: this.getTasksByStatus('done').length
    };
  }
};

// DOMManager - управление отображением в DOM
const DOMManager = {
  columns: {
    todo: null,
    in_progress: null,
    done: null
  },

  taskCounts: {
    todo: null,
    in_progress: null,
    done: null
  },

  init() {
    this.columns.todo = document.getElementById('tasks-todo');
    this.columns.in_progress = document.getElementById('tasks-in-progress');
    this.columns.done = document.getElementById('tasks-done');

    this.taskCounts.todo = document.getElementById('count-todo');
    this.taskCounts.in_progress = document.getElementById('count-in-progress');
    this.taskCounts.done = document.getElementById('count-done');
  },

  renderAllTasks() {
    this.renderColumn('todo');
    this.renderColumn('in_progress');
    this.renderColumn('done');
    this.updateCounts();
  },

  renderColumn(status) {
    const container = this.columns[status];
    if (!container) return;

    const tasks = TaskManager.getTasksByStatus(status);

    if (tasks.length === 0) {
      container.innerHTML = `<div class="empty-state">Нет задач</div>`;
    } else {
      container.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
    }

    this.attachDragEvents(container);
  },

  createTaskHTML(task) {
    return `
      <div class="task" draggable="true" data-task-id="${task.id}">
        <div class="task-text">${this.escapeHTML(task.text)}</div>
        <div class="task-actions">
          <button class="btn btn-delete" onclick="deleteTask(${task.id})">Удалить</button>
        </div>
      </div>
    `;
  },

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  updateCounts() {
    const counts = TaskManager.getCounts();
    this.taskCounts.todo.textContent = counts.todo;
    this.taskCounts.in_progress.textContent = counts.in_progress;
    this.taskCounts.done.textContent = counts.done;
  },

  attachDragEvents(container) {
    const tasks = container.querySelectorAll('.task');
    tasks.forEach(task => {
      task.addEventListener('dragstart', handleDragStart);
      task.addEventListener('dragend', handleDragEnd);
    });
  },

  addTaskToColumn(task) {
    this.renderColumn(task.status);
    this.updateCounts();
  },

  removeTaskFromColumn(status) {
    this.renderColumn(status);
    this.updateCounts();
  }
};

// Drag and Drop handlers
let draggedTask = null;
let draggedTaskId = null;

function handleDragStart(e) {
  draggedTask = this;
  draggedTaskId = parseInt(this.dataset.taskId);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedTaskId);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedTask = null;
  draggedTaskId = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e, status) {
  e.preventDefault();
  this.classList.remove('drag-over');

  if (draggedTaskId) {
    const success = TaskManager.updateTaskStatus(draggedTaskId, status);
    if (success) {
      DOMManager.renderAllTasks();
    }

    draggedTask = null;
    draggedTaskId = null;
  }
  return false;
}

// UI Functions
function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();

  if (text) {
    const task = TaskManager.addTask(text, 'todo');
    if (task) {
      DOMManager.addTaskToColumn(task);
      input.value = '';
      input.focus();
    }
  }
}

function deleteTask(id) {
  if (confirm('Удалить эту задачу?')) {
    const success = TaskManager.deleteTask(id);
    if (success) {
      DOMManager.renderAllTasks();
    }
  }
}

function handleKeyPress(e) {
  if (e.key === 'Enter') {
    addTask();
  }
}

// Initialize app
function initApp() {
  TaskManager.init();
  DOMManager.init();

  // Setup drag and drop zones
  const todoZone = DOMManager.columns.todo;
  const inProgressZone = DOMManager.columns.in_progress;
  const doneZone = DOMManager.columns.done;

  todoZone.addEventListener('dragover', handleDragOver);
  todoZone.addEventListener('dragenter', handleDragEnter);
  todoZone.addEventListener('dragleave', handleDragLeave);
  todoZone.addEventListener('drop', (e) => handleDrop.call(todoZone, e, 'todo'));

  inProgressZone.addEventListener('dragover', handleDragOver);
  inProgressZone.addEventListener('dragenter', handleDragEnter);
  inProgressZone.addEventListener('dragleave', handleDragLeave);
  inProgressZone.addEventListener('drop', (e) => handleDrop.call(inProgressZone, e, 'in_progress'));

  doneZone.addEventListener('dragover', handleDragOver);
  doneZone.addEventListener('dragenter', handleDragEnter);
  doneZone.addEventListener('dragleave', handleDragLeave);
  doneZone.addEventListener('drop', (e) => handleDrop.call(doneZone, e, 'done'));

  // Render initial state
  DOMManager.renderAllTasks();

  // Setup form
  document.getElementById('task-input').addEventListener('keypress', handleKeyPress);
  document.getElementById('add-task-btn').addEventListener('click', addTask);
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}