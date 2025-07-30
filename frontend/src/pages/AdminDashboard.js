/**
 * Admin Feature Request Dashboard
 * Allows admins to manage feature requests, update statuses, and view analytics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { featureRequestApi } from '../api/featureRequestApi';
import AdminFeatureRequestCard from '../components/AdminFeatureRequestCard';
import AdminStatsPanel from '../components/AdminStatsPanel';
import FeatureRequestFilters from '../components/FeatureRequestFilters';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onNavigate }) => {
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
    page: 1,
    limit: 20,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.is_admin;

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/ice-box');
      return;
    }
  }, [isAdmin, navigate]);

  // Load feature requests
  const loadRequests = async (resetPage = false) => {
    try {
      setLoading(true);
      setError('');
      
      const currentFilters = resetPage ? { ...filters, page: 1 } : filters;
      const response = await featureRequestApi.getFeatureRequests(currentFilters);
      
      if (response.success) {
        const newRequests = response.data.requests || [];
        
        if (resetPage || currentFilters.page === 1) {
          setRequests(newRequests);
        } else {
          setRequests(prev => [...prev, ...newRequests]);
        }
        
        setTotalCount(response.data.total || 0);
        setHasMore(response.data.has_more || false);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
      setError(err.message || 'Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  // Load admin statistics
  const loadStats = async () => {
    try {
      const response = await featureRequestApi.getAdminStats();
      
      if (response.success) {
        setStats(response.data || {});
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      loadRequests(true);
      loadStats();
    }
  }, [filters.status, filters.category, filters.priority, filters.search, filters.sort_by, filters.sort_order, isAdmin]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
    setSelectedRequests([]); // Clear selections when filtering
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
        loadStats();
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
        setSelectedRequests(prev => prev.filter(id => id !== requestId));
        
        // Update counts
        setTotalCount(prev => prev - 1);
        
        // Refresh stats
        loadStats();
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err.message || 'Failed to delete request');
    }
  };

  // Handle request selection
  const handleRequestSelection = (requestId, isSelected) => {
    if (isSelected) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedRequests(requests.map(req => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedRequests.length === 0) return;

    if (!window.confirm(`Are you sure you want to update ${selectedRequests.length} requests to "${newStatus}"?`)) {
      return;
    }

    setBulkActionLoading(true);
    
    try {
      const promises = selectedRequests.map(requestId =>
        featureRequestApi.updateRequestStatus(requestId, newStatus, 'Bulk status update')
      );
      
      await Promise.all(promises);
      
      // Update requests in the list
      setRequests(prev => prev.map(req => 
        selectedRequests.includes(req.id)
          ? { 
              ...req, 
              status: newStatus,
              admin_comment: 'Bulk status update',
              updated_at: new Date().toISOString()
            }
          : req
      ));
      
      setSelectedRequests([]);
      loadStats();
    } catch (err) {
      console.error('Error with bulk update:', err);
      setError(err.message || 'Failed to update requests');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Load more requests
  const loadMore = () => {
    if (!loading && hasMore) {
      setFilters(prev => ({
        ...prev,
        page: prev.page + 1,
      }));
      loadRequests();
    }
  };

  if (!isAdmin) {
    return null; // Will redirect
  }

  const statusOptions = [
    'pending',
    'in_review',
    'approved',
    'in_progress',
    'completed',
    'rejected',
    'on_hold',
  ];

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Feature Request Admin Dashboard</h1>
            <p>Manage and track all feature requests</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => navigate('/ice-box')}
              className="btn btn-secondary"
            >
              View Ice Box
            </button>
            <button
              onClick={() => navigate('/submit-request')}
              className="btn btn-primary"
            >
              + New Request
            </button>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-content">
        <div className="stats-section">
          <AdminStatsPanel stats={stats} />
        </div>

        <div className="filters-section">
          <FeatureRequestFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            totalCount={totalCount}
          />
        </div>

        {selectedRequests.length > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-info">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedRequests.length === requests.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span>{selectedRequests.length} selected</span>
              </label>
            </div>
            <div className="bulk-actions-controls">
              <span className="bulk-label">Bulk Actions:</span>
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusUpdate(status)}
                  disabled={bulkActionLoading}
                  className="bulk-action-btn"
                >
                  Set {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <i className="error-icon">⚠️</i>
            {error}
            <button 
              onClick={() => {
                setError('');
                loadRequests(true);
              }}
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        )}

        <div className="requests-section">
          {loading && requests.length === 0 ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading feature requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No feature requests found</h3>
              <p>
                {filters.search || filters.status || filters.category || filters.priority
                  ? 'Try adjusting your filters to see more results.'
                  : 'No feature requests have been submitted yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="admin-requests-grid">
                {requests.map((request) => (
                  <AdminFeatureRequestCard
                    key={request.id}
                    request={request}
                    user={user}
                    isSelected={selectedRequests.includes(request.id)}
                    onStatusUpdate={handleStatusUpdate}
                    onDelete={handleDeleteRequest}
                    onSelectionChange={handleRequestSelection}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="load-more-section">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="btn btn-secondary load-more-btn"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
