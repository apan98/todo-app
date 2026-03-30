import { Task } from './types';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, IconButton, Typography, Chip } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { Box } from '@mui/material';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const TaskCard = ({ task, index, onEdit, onDelete }: TaskCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            marginBottom: 12,
            transform: snapshot.isDragging ? 'rotate(2deg)' : provided.draggableProps.style?.transform
          }}
        >
          <Card
            elevation={snapshot.isDragging ? 8 : 2}
            sx={{
              bgcolor: snapshot.isDragging ? 'primary.dark' : 'background.paper',
              borderLeft: `4px solid ${task.color}`,
              '&:hover': {
                elevation: 4
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography variant="body1" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                  {task.title}
                </Typography>
                <Box display="flex" gap={0.5} ml={1}>
                  <IconButton size="small" onClick={() => onEdit(task)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(task.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {task.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-word' }}>
                  {task.description}
                </Typography>
              )}

              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={task.priority.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: getPriorityColor(task.priority),
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 20
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;