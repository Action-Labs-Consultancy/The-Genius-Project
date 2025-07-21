import React from 'react';
import { Calendar, Clock, AlertCircle, User, Briefcase, Building2 } from 'lucide-react';
import './TaskCard.css';

const TaskCard = ({ 
  task, 
  onClick, 
  showProject = false, 
  showClient = false,
  isDragging = false 
}) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFD600';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return '#666';
      case 'in_progress': return '#2196F3';
      case 'review': return '#FF9800';
      case 'done': return '#4CAF50';
      default: return '#666';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(task.due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <div 
      className={`task-card ${isDragging ? 'dragging' : ''} ${task.priority}`}
      onClick={onClick}
      id={`task-${task.id}`}
    >
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>
        <div 
          className="priority-indicator"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
          title={`${task.priority} priority`}
        />
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        {/* Project and Client info (for dashboard view) */}
        {showProject && task.project_name && (
          <div className="meta-item project">
            <Briefcase size={14} />
            <span>{task.project_name}</span>
          </div>
        )}
        
        {showClient && task.client_name && (
          <div className="meta-item client">
            <Building2 size={14} />
            <span>{task.client_name}</span>
          </div>
        )}

        {/* Due date */}
        {task.due_date && (
          <div className={`meta-item due-date ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
            <Calendar size={14} />
            <span>
              {isOverdue 
                ? `${Math.abs(daysUntilDue)} days overdue`
                : isUrgent 
                ? `${daysUntilDue} days left`
                : new Date(task.due_date).toLocaleDateString()
              }
            </span>
            {(isOverdue || isUrgent) && (
              <AlertCircle size={12} className="warning-icon" />
            )}
          </div>
        )}

        {/* Assignee */}
        {task.assignee && (
          <div className="meta-item assignee">
            <img 
              src={task.assignee.avatar_url || `https://ui-avatars.com/api/?name=${task.assignee.full_name}&background=FFD600&color=181818&size=24`}
              alt={task.assignee.full_name}
              className="assignee-avatar"
              title={task.assignee.full_name}
            />
            <span>{task.assignee.full_name}</span>
          </div>
        )}

        {/* Estimated hours */}
        {task.estimated_hours && (
          <div className="meta-item hours">
            <Clock size={14} />
            <span>{task.estimated_hours}h</span>
          </div>
        )}
      </div>

      <div className="task-footer">
        <div 
          className="status-badge"
          style={{ backgroundColor: getStatusColor(task.status) }}
        >
          {task.status.replace('_', ' ')}
        </div>
        
        {task.comments_count > 0 && (
          <div className="comments-count">
            💬 {task.comments_count}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
