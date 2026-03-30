import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip
} from '@mui/material';
import { Task, PRIORITY_COLORS, DEFAULT_COLORS } from './types';

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
}

const TaskModal = ({ open, task, onClose, onSave }: TaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('low');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setColor(task.color);
    } else {
      setTitle('');
      setDescription('');
      setPriority('low');
      setColor(DEFAULT_COLORS[0]);
    }
  }, [task, open]);

  const handleSubmit = () => {
    if (title.trim()) {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        color,
        status: task?.status || 'todo'
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Название *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
            error={!title.trim()}
            helperText={!title.trim() ? 'Обязательное поле' : ''}
          />

          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <FormControl fullWidth>
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={priority}
              label="Приоритет"
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
            >
              <MenuItem value="low">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PRIORITY_COLORS.low }} />
                  Низкий
                </Box>
              </MenuItem>
              <MenuItem value="medium">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PRIORITY_COLORS.medium }} />
                  Средний
                </Box>
              </MenuItem>
              <MenuItem value="high">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PRIORITY_COLORS.high }} />
                  Высокий
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Цвет метки:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DEFAULT_COLORS.map((c) => (
                <Chip
                  key={c}
                  label=""
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: c,
                    cursor: 'pointer',
                    border: color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                    boxShadow: color === c ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim()}>
          {task ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModal;