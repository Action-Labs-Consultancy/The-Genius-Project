/**
 * Admin Requests Page - Simplified
 * Shows all feature requests with metrics, filters, and management tools
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { featureRequestApi } from '../api/featureRequestApi';
import './AdminRequestsPage.css';

const AdminRequestsPage = ({ user, onNavigate }) => {
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.is_admin;

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/submit-request');
      return;
    }
  }, [isAdmin, navigate]);

  // Load requests and stats
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [requestsResponse, statsResponse] = await Promise.all([
        featureRequestApi.getAdminRequests(filters),
        featureRequestApi.getAdminStats()
      ]);
      
      if (requestsResponse.success) {
        setRequests(requestsResponse.data.requests || []);
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.data || {});
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [filters, isAdmin]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle status update
  const handleStatusUpdate = async (requestId, newStatus, adminComment = '') => {
    try {
      const response = await featureRequestApi.updateRequestStatus(
        requestId, 
        newStatus, 
        adminComment
      );
      
      if (response.success) {
        // Update the request in the list
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: newStatus,
                admin_comment: adminComment,
                updated_at: new Date().toISOString()
              }
            : req
        ));
        
        // Refresh stats
        loadData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this feature request? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await featureRequestApi.deleteRequest(requestId);
      
      if (response.success) {
        // Remove from list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        
        // Refresh stats
        loadData();
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err.message || 'Failed to delete request');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      in_review: '#60a5fa',
      approved: '#4ade80',
      in_progress: '#a78bfa',
      completed: '#10b981',
      rejected: '#f87171',
      on_hold: '#94a3b8',
    };
    return colors[status] || '#888';
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

  if (!isAdmin) {
    return null; // Will redirect
  }

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'enhancement', label: 'Enhancement' },
    { value: 'bug_fix', label: 'Bug Fix' },
    { value: 'new_feature', label: 'New Feature' },
    { value: 'ui_ux', label: 'UI/UX' },
    { value: 'performance', label: 'Performance' },
    { value: 'integration', label: 'Integration' },
    { value: 'other', label: 'Other' },
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'on_hold', label: 'On Hold' },
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <div className="admin-requests-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Ice Box 🧊</h1>
            <p>Manage feature requests and innovative ideas</p>
          </div>
          <button
            onClick={() => navigate('/submit-request')}
            className="btn btn-primary"
          >
            + New Request
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Statistics */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.total_requests || 0}</div>
              <div className="stat-label">Total Requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.by_status?.pending || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.by_status?.in_progress || 0}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.by_status?.completed || 0}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search requests..."
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="filter-select"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="filter-select"
              >
                <option value="created_at">Date Created</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="error-icon">⚠️</i>
            {error}
            <button 
              onClick={() => {
                setError('');
                loadData();
              }}
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        )}

        {/* Requests List */}
        <div className="requests-section">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No requests found</h3>
              <p>No feature requests match your current filters.</p>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div className="request-meta">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(request.priority) }}
                      >
                        {request.priority.toUpperCase()}
                      </span>
                      <span className="category-badge">
                        {request.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="request-date">
                      {formatDate(request.created_at)}
                    </div>
                  </div>

                  <div className="request-content">
                    <h3 className="request-title">{request.title}</h3>
                    <p className="request-description">{request.description}</p>
                    
                    {request.use_case && (
                      <div className="request-field">
                        <strong>Use Case:</strong> {request.use_case}
                      </div>
                    )}
                    
                    {request.expected_outcome && (
                      <div className="request-field">
                        <strong>Expected Outcome:</strong> {request.expected_outcome}
                      </div>
                    )}

                    <div className="request-submitter">
                      <strong>Submitted by:</strong> {request.submitted_by?.username || 'Unknown'}
                    </div>

                    {request.admin_comment && (
                      <div className="admin-comment">
                        <strong>Admin Note:</strong> {request.admin_comment}
                      </div>
                    )}
                  </div>

                  <div className="request-actions">
                    <div className="status-controls">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_review">In Review</option>
                        <option value="approved">Approved</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>

                    <div className="action-buttons">
                      <button
                        onClick={() => setExpandedRequest(
                          expandedRequest === request.id ? null : request.id
                        )}
                        className="btn btn-secondary btn-sm"
                      >
                        {expandedRequest === request.id ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedRequest === request.id && (
                    <div className="request-details">
                      <div className="detail-section">
                        <h4>Add Admin Comment</h4>
                        <textarea
                          placeholder="Add internal notes..."
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleStatusUpdate(request.id, request.status, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="admin-comment-input"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRequestsPage;
