import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import {
  Box,
  Container,
  ThemeProvider,
  CssBaseline,
  Typography
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { api } from './api';
import { Task } from './types';
import Column from './Column';
import TaskModal from './TaskModal';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#bb86fc' },
    secondary: { main: '#03dac6' },
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  }
});

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('todo');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.fetchTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const taskId = parseInt(draggableId);
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== destination.droppableId) {
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: destination.droppableId as Task['status'] } : t
      );
      setTasks(updatedTasks);

      // Update in localStorage/fallback
      try {
        await api.updateTask(taskId, { status: destination.droppableId as Task['status'] });
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
  };

  const handleAddTask = (status: Task['status']) => {
    setEditingTask(null);
    setNewTaskStatus(status);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskStatus(task.status);
    setModalOpen(true);
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Удалить эту задачу?')) {
      try {
        await api.deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        // Update existing task
        const updated = await api.updateTask(editingTask.id, taskData);
        if (updated) {
          setTasks(tasks.map(t => t.id === editingTask.id ? updated : t));
        }
      } else {
        // Create new task
        const newTask = await api.createTask({
          title: taskData.title!,
          description: taskData.description,
          priority: taskData.priority || 'low',
          color: taskData.color || '#e91e63',
          status: newTaskStatus
        });
        setTasks([...tasks, newTask]);
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(t => t.status === status);
  };

  const columns = [
    { title: 'К выполнению', status: 'todo' as const, icon: '📝', color: '#4caf50' },
    { title: 'В работе', status: 'in_progress' as const, icon: '🚀', color: '#2196f3' },
    { title: 'Выполнено', status: 'done' as const, icon: '✅', color: '#9c27b0' }
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
        <Container maxWidth="xl">
          <Typography
            variant="h3"
            component="h1"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 4,
              background: 'linear-gradient(45deg, #bb86fc 30%, #03dac6 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            📋 Todo App - Kanban Board
          </Typography>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              {columns.map((col) => (
                <Column
                  key={col.status}
                  title={col.title}
                  status={col.status}
                  tasks={getTasksByStatus(col.status)}
                  icon={col.icon}
                  color={col.color}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </Box>
          </DragDropContext>
        </Container>
      </Box>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
      />
    </ThemeProvider>
  );
}

export default App;