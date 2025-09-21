import React, { useState } from 'react';
import moment from 'moment';
import './TaskDetails.css';

const TaskDetails = ({ task, onClose, onUpdate, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editedTask)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onUpdate(data.task);
          setIsEditing(false);
        }
      } else {
        console.error('Failed to update task:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          text: newComment,
          author: user.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onUpdate(data.task);
          setNewComment('');
        }
      } else {
        console.error('Failed to add comment:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSubtaskToggle = async (subtaskId) => {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          completed: !subtask.completed
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onUpdate(data.task);
        }
      } else {
        console.error('Failed to update subtask:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          progress: newStatus === 'completed' ? 100 : task.progress
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onUpdate(data.task);
        }
      } else {
        console.error('Failed to update task status:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const isOverdue = moment(task.dueDate).isBefore(moment(), 'day') && task.status !== 'completed';

  return (
    <div className="task-details-overlay" onClick={onClose}>
      <div className="task-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-left">
            <h2>{isEditing ? 'Edit Task' : 'Task Details'}</h2>
            <div className="task-meta-badges">
              <span 
                className={`status-badge status-${task.status}`}
                style={{ backgroundColor: getStatusColor(task.status) }}
              >
                {task.status.replace('-', ' ').toUpperCase()}
              </span>
              <span 
                className={`priority-badge priority-${task.priority}`}
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              >
                {task.priority.toUpperCase()} PRIORITY
              </span>
            </div>
          </div>
          <div className="header-right">
            {!isEditing && (
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-content">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editedTask.dueDate}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editedTask.priority}
                    onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editedTask.status}
                    onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editedTask.progress}
                    onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="save-btn" onClick={handleSave}>
                  💾 Save Changes
                </button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="task-info">
              {/* Task Overview */}
              <div className="info-section">
                <h3>{task.title}</h3>
                <p className="task-description">{task.description}</p>

                <div className="task-details-grid">
                  <div className="detail-item">
                    <label>Due Date</label>
                    <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                      {moment(task.dueDate).format('MMMM DD, YYYY')}
                      {isOverdue && <span className="overdue-label"> (OVERDUE)</span>}
                    </span>
                  </div>

                  <div className="detail-item">
                    <label>Assigned Date</label>
                    <span>{moment(task.assignedDate).format('MMMM DD, YYYY')}</span>
                  </div>

                  <div className="detail-item">
                    <label>Assigned By</label>
                    <span>{task.assignedBy}</span>
                  </div>

                  <div className="detail-item">
                    <label>Category</label>
                    <span>{task.category}</span>
                  </div>

                  <div className="detail-item">
                    <label>Estimated Hours</label>
                    <span>{task.estimatedHours}h</span>
                  </div>

                  <div className="detail-item">
                    <label>Progress</label>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${task.progress}%`,
                            backgroundColor: getStatusColor(task.status)
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h4>Quick Actions</h4>
                <div className="action-buttons">
                  {task.status !== 'completed' && (
                    <button 
                      className="action-btn complete-action"
                      onClick={() => handleStatusChange('completed')}
                    >
                      ✅ Mark Complete
                    </button>
                  )}
                  {task.status === 'pending' && (
                    <button 
                      className="action-btn start-action"
                      onClick={() => handleStatusChange('in-progress')}
                    >
                      ▶️ Start Task
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button 
                      className="action-btn reopen-action"
                      onClick={() => handleStatusChange('in-progress')}
                    >
                      🔄 Reopen Task
                    </button>
                  )}
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="subtasks-section">
                  <div 
                    className="section-header" 
                    onClick={() => setShowSubtasks(!showSubtasks)}
                  >
                    <h4>Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})</h4>
                    <span className={`expand-icon ${showSubtasks ? 'expanded' : ''}`}>▼</span>
                  </div>
                  
                  {showSubtasks && (
                    <div className="subtasks-list">
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="subtask-item">
                          <label className="subtask-checkbox">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => handleSubtaskToggle(subtask.id)}
                            />
                            <span className="checkmark"></span>
                            <span className={`subtask-title ${subtask.completed ? 'completed' : ''}`}>
                              {subtask.title}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="attachments-section">
                  <div 
                    className="section-header" 
                    onClick={() => setShowAttachments(!showAttachments)}
                  >
                    <h4>Attachments ({task.attachments.length})</h4>
                    <span className={`expand-icon ${showAttachments ? 'expanded' : ''}`}>▼</span>
                  </div>
                  
                  {showAttachments && (
                    <div className="attachments-list">
                      {task.attachments.map(attachment => (
                        <div key={attachment.id} className="attachment-item">
                          <span className="attachment-icon">📎</span>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="attachment-link"
                          >
                            {attachment.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Comments Section */}
              <div className="comments-section">
                <div 
                  className="section-header" 
                  onClick={() => setShowComments(!showComments)}
                >
                  <h4>Comments ({task.comments?.length || 0})</h4>
                  <span className={`expand-icon ${showComments ? 'expanded' : ''}`}>▼</span>
                </div>
                
                {showComments && (
                  <div className="comments-container">
                    {/* Add Comment */}
                    <div className="add-comment">
                      <textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      <button 
                        className="add-comment-btn"
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        💬 Add Comment
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="comments-list">
                      {task.comments && task.comments.length > 0 ? (
                        task.comments.map(comment => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                              <span className="comment-author">{comment.author}</span>
                              <span className="comment-time">
                                {moment(comment.timestamp).format('MMM DD, YYYY [at] HH:mm')}
                              </span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="no-comments">No comments yet. Be the first to add one!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
