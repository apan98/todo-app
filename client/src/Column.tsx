import { Droppable, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import { Box, Paper, Typography, Button, alpha } from '@mui/material';
import { Add } from '@mui/icons-material';
import TaskCard from './TaskCard';
import { Task } from './types';

interface ColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  icon: string;
  color: string;
  onAddTask: (status: Task['status']) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
}

const Column = ({ title, status, tasks, icon, color, onAddTask, onEditTask, onDeleteTask }: ColumnProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: 350,
        minHeight: 400,
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(color, 0.08),
        border: "1px solid " + alpha(color, 0.3)
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(color, 0.15),
          borderBottom: "2px solid ${color}",
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5">{icon}</Typography>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            {tasks.length}
          </Typography>
        </Box>
      </Box>

      <Droppable droppableId={status}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              p: 2,
              flex: 1,
              overflowY: 'auto',
              bgcolor: snapshot.isDraggingOver ? alpha(color, 0.1) : 'transparent',
              transition: 'background-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {tasks.length === 0 ? (
              <Box
                sx={{
                  py: 8,
                  textAlign: 'center',
                  color: 'text.disabled',
                  fontStyle: 'italic'
                }}
              >
                <Typography variant="body2">Нет задач</Typography>
              </Box>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      <Box sx={{ p: 2, borderTop: "1px solid ${alpha(color, 0.2)" }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={() => onAddTask(status)}
          sx={{
            color,
            borderColor: alpha(color, 0.5),
            '&:hover': {
              borderColor: color,
              bgcolor: alpha(color, 0.1)
            }
          }}
        >
          Add task
        </Button>
      </Box>
    </Paper>
  );
};

export default Column;
