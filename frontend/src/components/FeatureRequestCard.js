/**
 * Feature Request Card Component
 * Displays individual feature request with voting and commenting capabilities
 */

import React, { useState } from 'react';
import { featureRequestApi } from '../api/featureRequestApi';
import './FeatureRequestCard.css';

const FeatureRequestCard = ({ 
  request, 
  user, 
  onVote, 
  onCommentAdded, 
  getStatusColor, 
  getStatusLabel 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#4ade80',
      medium: '#fbbf24',
      high: '#f87171',
      urgent: '#dc2626',
    };
    return colors[priority] || '#888';
  };

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      await onVote(request.id, voteType);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || isAddingComment) return;

    setIsAddingComment(true);
    try {
      const response = await featureRequestApi.addComment(request.id, newComment.trim());
      
      if (response.success) {
        onCommentAdded(request.id, response.data);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsAddingComment(false);
    }
  };

  const userVote = request.user_vote;
  const upvotes = request.votes?.upvotes || 0;
  const downvotes = request.votes?.downvotes || 0;
  const score = upvotes - downvotes;

  return (
    <div className="feature-request-card">
      <div className="card-header">
        <div className="request-meta">
          <span 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(request.status) }}
          >
            {getStatusLabel(request.status)}
          </span>
          <span 
            className="priority-badge"
            style={{ backgroundColor: getPriorityColor(request.priority) }}
          >
            {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
          </span>
          <span className="category-badge">
            {request.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        <div className="request-date">
          {formatDate(request.created_at)}
        </div>
      </div>

      <div className="card-content">
        <h3 className="request-title">{request.title}</h3>
        <p className="request-description">{request.description}</p>
        
        {request.use_case && (
          <div className="request-section">
            <h4>Use Case:</h4>
            <p>{request.use_case}</p>
          </div>
        )}
        
        {request.expected_outcome && (
          <div className="request-section">
            <h4>Expected Outcome:</h4>
            <p>{request.expected_outcome}</p>
          </div>
        )}

        {request.attachments && request.attachments.length > 0 && (
          <div className="attachments-section">
            <h4>Attachments:</h4>
            <div className="attachments-list">
              {request.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-link"
                >
                  📎 {attachment.filename}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="voting-section">
          <button
            onClick={() => handleVote('upvote')}
            className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
            disabled={isVoting}
            title="Upvote this request"
          >
            👍 {upvotes}
          </button>
          <span className="vote-score" title={`Score: ${score}`}>
            {score > 0 ? '+' : ''}{score}
          </span>
          <button
            onClick={() => handleVote('downvote')}
            className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
            disabled={isVoting}
            title="Downvote this request"
          >
            👎 {downvotes}
          </button>
        </div>

        <div className="actions-section">
          <button
            onClick={() => setShowComments(!showComments)}
            className="action-btn"
          >
            💬 {request.comment_count || 0} Comments
          </button>
          <div className="submitter-info">
            By: <strong>{request.submitted_by?.username || 'Unknown'}</strong>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-header">
            <h4>Comments</h4>
          </div>

          {request.comments && request.comments.length > 0 ? (
            <div className="comments-list">
              {request.comments.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-header">
                    <strong className="comment-author">
                      {comment.author?.username || 'Unknown'}
                    </strong>
                    <span className="comment-date">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className="comment-content">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-comments">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}

          <form onSubmit={handleAddComment} className="add-comment-form">
            <div className="comment-input-group">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
                rows={3}
                disabled={isAddingComment}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isAddingComment}
                className="btn btn-primary add-comment-btn"
              >
                {isAddingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeatureRequestCard;
