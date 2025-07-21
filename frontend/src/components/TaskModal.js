import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  MessageSquare, 
  Send, 
  Clock, 
  AlertCircle,
  Tag,
  Briefcase
} from 'lucide-react';
import { useTasksStore, useAuthStore } from '../stores/authStore';
import './TaskModal.css';

const TaskModal = ({ task = null, projectId, onClose, onSave }) => {
  const { createTask, updateTask, loadUsers, addComment, loadTaskComments } = useTasksStore();
  const { user, canEditTask, canAssignTasks } = useAuthStore();
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    assigned_to_id: task?.assigned_to_id || user?.id || '',
    project_id: task?.project_id || projectId || ''
  });

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const canEdit = !task || canEditTask(task);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load users for assignment
        if (canAssignTasks()) {
          const users = await loadUsers();
          setAvailableUsers(users || []);
        }

        // Load comments if editing existing task
        if (task?.id) {
          setCommentsLoading(true);
          try {
            const taskComments = await loadTaskComments(task.id);
            setComments(taskComments || []);
          } catch (error) {
            console.error('Failed to load comments:', error);
          } finally {
            setCommentsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load task data:', error);
      }
    };
    
    fetchData();
  }, [task, loadUsers, loadTaskComments, canAssignTasks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    if (!formData.assigned_to_id) {
      newErrors.assigned_to_id = 'Please assign this task to someone';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let savedTask;
      if (isEditing) {
        savedTask = await updateTask(task.id, formData);
      } else {
        savedTask = await createTask(formData);
      }
      
      onSave?.(savedTask);
      if (!isEditing) {
        onClose(); // Close modal for new tasks
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || !task?.id) return;
    
    try {
      const comment = await addComment(task.id, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#666' },
    { value: 'in_progress', label: 'In Progress', color: '#2196F3' },
    { value: 'review', label: 'Review', color: '#FF9800' },
    { value: 'done', label: 'Done', color: '#4CAF50' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FFD600' },
    { value: 'high', label: 'High', color: '#FF9800' },
    { value: 'urgent', label: 'Urgent', color: '#F44336' }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="task-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Briefcase className="modal-icon" />
            <h2>{isEditing ? 'Task Details' : 'Create New Task'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="task-modal-content">
          <div className="task-form-section">
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label htmlFor="title">
                  Task Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? 'error' : ''}
                  placeholder="Enter task title"
                  disabled={!canEdit}
                  required
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the task"
                  rows={4}
                  disabled={!canEdit}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">
                    <Tag className="field-icon" />
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={!canEdit}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">
                    <AlertCircle className="field-icon" />
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    disabled={!canEdit}
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="due_date">
                    <Calendar className="field-icon" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    disabled={!canEdit}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="assigned_to_id">
                    <User className="field-icon" />
                    Assigned To <span className="required">*</span>
                  </label>
                  {canAssignTasks() && canEdit ? (
                    <select
                      id="assigned_to_id"
                      name="assigned_to_id"
                      value={formData.assigned_to_id}
                      onChange={handleChange}
                      className={errors.assigned_to_id ? 'error' : ''}
                      required
                    >
                      <option value="">Select user...</option>
                      {availableUsers.map(userItem => (
                        <option key={userItem.id} value={userItem.id}>
                          {userItem.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={task?.assigned_to?.name || user?.name || 'Unassigned'}
                      disabled
                      className="disabled-input"
                    />
                  )}
                  {errors.assigned_to_id && <span className="error-text">{errors.assigned_to_id}</span>}
                </div>
              </div>

              {errors.submit && (
                <div className="error-message">
                  {errors.submit}
                </div>
              )}

              {canEdit && (
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Comments Section */}
          {isEditing && (
            <div className="comments-section">
              <div className="comments-header">
                <h3>
                  <MessageSquare className="section-icon" />
                  Comments ({comments.length})
                </h3>
              </div>

              <div className="comments-list">
                {commentsLoading ? (
                  <div className="comments-loading">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="no-comments">
                    <MessageSquare className="no-comments-icon" />
                    <span>No comments yet</span>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author?.name}</span>
                        <span className="comment-date">
                          <Clock className="time-icon" />
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div className="comment-content">{comment.content}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="comment-form">
                <div className="comment-input-group">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="comment-input"
                  />
                  <button
                    type="submit"
                    className="comment-submit"
                    disabled={!newComment.trim()}
                  >
                    <Send className="send-icon" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
