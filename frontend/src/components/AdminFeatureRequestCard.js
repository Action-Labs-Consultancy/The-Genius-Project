/**
 * Admin Feature Request Card Component
 * Enhanced card with admin controls for status updates and management
 */

import React, { useState } from 'react';
import FeatureRequestCard from './FeatureRequestCard';
import './AdminFeatureRequestCard.css';

const AdminFeatureRequestCard = ({ 
  request, 
  user, 
  isSelected,
  onStatusUpdate, 
  onDelete, 
  onSelectionChange 
}) => {
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState(request.status);
  const [adminComment, setAdminComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#fbbf24' },
    { value: 'in_review', label: 'In Review', color: '#60a5fa' },
    { value: 'approved', label: 'Approved', color: '#4ade80' },
    { value: 'in_progress', label: 'In Progress', color: '#a78bfa' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
    { value: 'rejected', label: 'Rejected', color: '#f87171' },
    { value: 'on_hold', label: 'On Hold', color: '#94a3b8' },
  ];

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (newStatus === request.status && !adminComment.trim()) {
      setShowStatusUpdate(false);
      return;
    }

    setIsUpdating(true);
    
    try {
      await onStatusUpdate(request.id, newStatus, adminComment);
      setShowStatusUpdate(false);
      setAdminComment('');
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    onDelete(request.id);
  };

  const handleSelectionChange = (e) => {
    onSelectionChange(request.id, e.target.checked);
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : '#888';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getPriorityWeight = (priority) => {
    const weights = { low: 1, medium: 2, high: 3, urgent: 4 };
    return weights[priority] || 0;
  };

  const getVoteScore = () => {
    const upvotes = request.votes?.upvotes || 0;
    const downvotes = request.votes?.downvotes || 0;
    return upvotes - downvotes;
  };

  return (
    <div className={`admin-feature-request-card ${isSelected ? 'selected' : ''}`}>
      <div className="admin-card-header">
        <label className="selection-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionChange}
          />
          <span className="checkbox-custom"></span>
        </label>
        
        <div className="admin-meta">
          <div className="priority-score">
            Priority Score: <strong>{getPriorityWeight(request.priority)}</strong>
          </div>
          <div className="vote-score">
            Vote Score: <strong>{getVoteScore()}</strong>
          </div>
          <div className="comment-count">
            Comments: <strong>{request.comment_count || 0}</strong>
          </div>
        </div>

        <div className="admin-actions">
          <button
            onClick={() => setShowStatusUpdate(!showStatusUpdate)}
            className="admin-action-btn status-btn"
            title="Update Status"
          >
            🔄
          </button>
          <button
            onClick={handleDelete}
            className="admin-action-btn delete-btn"
            title="Delete Request"
          >
            🗑️
          </button>
        </div>
      </div>

      {showStatusUpdate && (
        <div className="status-update-panel">
          <form onSubmit={handleStatusUpdate} className="status-update-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="status-select"
                  disabled={isUpdating}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Comment (Optional)</label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="admin-comment-input"
                placeholder="Add a comment about this status change..."
                rows={3}
                disabled={isUpdating}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowStatusUpdate(false);
                  setNewStatus(request.status);
                  setAdminComment('');
                }}
                className="btn btn-secondary"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card-content">
        <FeatureRequestCard
          request={request}
          user={user}
          onVote={() => {}} // Disable voting in admin view
          onCommentAdded={() => {}} // Handle separately if needed
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      </div>

      {request.admin_comment && (
        <div className="admin-comment-display">
          <div className="admin-comment-header">
            <strong>Admin Comment:</strong>
          </div>
          <div className="admin-comment-content">
            {request.admin_comment}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatureRequestCard;
