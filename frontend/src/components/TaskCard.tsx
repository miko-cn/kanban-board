import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    columnId: string;
    title: string;
    description: string;
    order: number;
  };
  onEdit: (task: TaskCardProps['task']) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-content">
        {/* Task Content */}
        <div className="task-content">
          <h4 className="task-title">{task.title} <span style={{opacity:0.5, fontSize:10}}>#{task.order}</span></h4>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
        </div>

        {/* Actions (visible on hover) */}
        <div className="task-actions">
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Pencil size={14} />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}