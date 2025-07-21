import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Calendar, Users, AlertCircle } from 'lucide-react';
import { useProjectsStore, useAuthStore } from '../stores/authStore';
import './ProjectModal.css';

const ProjectModal = ({ project = null, clientId, onClose, onSave }) => {
  const { createProject, updateProject, loadUsers } = useProjectsStore();
  const { user } = useAuthStore();
  const isEditing = !!project;

  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    priority: project?.priority || 'medium',
    start_date: project?.start_date ? project.start_date.split('T')[0] : '',
    due_date: project?.due_date ? project.due_date.split('T')[0] : '',
    budget: project?.budget || '',
    client_id: project?.client_id || clientId || ''
  });

  const [members, setMembers] = useState(project?.members || []);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await loadUsers();
        setAvailableUsers(users || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    fetchUsers();
  }, [loadUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleMemberToggle = (userId) => {
    setMembers(prev => {
      const isSelected = prev.some(member => member.user_id === userId);
      if (isSelected) {
        return prev.filter(member => member.user_id !== userId);
      } else {
        return [...prev, { user_id: userId, role: 'member' }];
      }
    });
  };

  const handleMemberRoleChange = (userId, role) => {
    setMembers(prev => prev.map(member => 
      member.user_id === userId ? { ...member, role } : member
    ));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (formData.start_date && formData.due_date) {
      const startDate = new Date(formData.start_date);
      const dueDate = new Date(formData.due_date);
      if (dueDate < startDate) {
        newErrors.due_date = 'Due date must be after start date';
      }
    }
    
    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        members
      };
      
      let savedProject;
      if (isEditing) {
        savedProject = await updateProject(project.id, projectData);
      } else {
        savedProject = await createProject(projectData);
      }
      
      onSave?.(savedProject);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: '#666' },
    { value: 'active', label: 'Active', color: '#2196F3' },
    { value: 'on_hold', label: 'On Hold', color: '#FF9800' },
    { value: 'completed', label: 'Completed', color: '#4CAF50' },
    { value: 'cancelled', label: 'Cancelled', color: '#F44336' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FFD600' },
    { value: 'high', label: 'High', color: '#FF9800' },
    { value: 'urgent', label: 'Urgent', color: '#F44336' }
  ];

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="project-modal">
        <div className="modal-header">
          <div className="modal-title">
            <FolderOpen className="modal-icon" />
            <h2>{isEditing ? 'Edit Project' : 'Create New Project'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3>Project Details</h3>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="name">
                  Project Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter project name"
                  required
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="start_date">
                  <Calendar className="field-icon" />
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>

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
                  className={errors.due_date ? 'error' : ''}
                />
                {errors.due_date && <span className="error-text">{errors.due_date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="budget">Budget ($)</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className={errors.budget ? 'error' : ''}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {errors.budget && <span className="error-text">{errors.budget}</span>}
              </div>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'hr') && (
            <div className="form-section">
              <h3>
                <Users className="section-icon" />
                Team Members
              </h3>
              
              <div className="members-grid">
                {availableUsers.map(userItem => {
                  const member = members.find(m => m.user_id === userItem.id);
                  const isSelected = !!member;
                  
                  return (
                    <div key={userItem.id} className={`member-item ${isSelected ? 'selected' : ''}`}>
                      <div className="member-info">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMemberToggle(userItem.id)}
                          className="member-checkbox"
                        />
                        <div className="member-details">
                          <span className="member-name">{userItem.name}</span>
                          <span className="member-email">{userItem.email}</span>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <select
                          value={member.role}
                          onChange={(e) => handleMemberRoleChange(userItem.id, e.target.value)}
                          className="member-role-select"
                        >
                          <option value="member">Member</option>
                          <option value="lead">Lead</option>
                          <option value="manager">Manager</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {availableUsers.length === 0 && (
                <div className="no-users">
                  <AlertCircle className="no-users-icon" />
                  <span>No users available. Users need to be created first.</span>
                </div>
              )}
            </div>
          )}

          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
