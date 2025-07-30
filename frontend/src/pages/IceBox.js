/**
 * Ice Box Page - Feature Request Backlog
 * Displays all feature requests with filtering, sorting, and voting capabilities
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { featureRequestApi } from '../api/featureRequestApi';
import FeatureRequestCard from '../components/FeatureRequestCard';
import FeatureRequestFilters from '../components/FeatureRequestFilters';
import './IceBox.css';

const IceBox = ({ user, onNavigate }) => {
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
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

  // Initial load
  useEffect(() => {
    loadRequests(true);
  }, [filters.status, filters.category, filters.priority, filters.search, filters.sort_by, filters.sort_order]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  // Handle vote
  const handleVote = async (requestId, voteType) => {
    try {
      const response = await featureRequestApi.voteOnRequest(requestId, voteType);
      
      if (response.success) {
        // Update the request in the list
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                votes: response.data.votes,
                user_vote: response.data.user_vote 
              }
            : req
        ));
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError(err.message || 'Failed to vote');
    }
  };

  // Handle comment addition
  const handleCommentAdded = (requestId, newComment) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            comments: [...(req.comments || []), newComment],
            comment_count: (req.comment_count || 0) + 1
          }
        : req
    ));
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

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      in_review: 'In Review',
      approved: 'Approved',
      in_progress: 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected',
      on_hold: 'On Hold',
    };
    return labels[status] || status;
  };

  return (
    <div className="ice-box-container">
      <div className="ice-box-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Ice Box</h1>
            <p>Feature request backlog - Vote and track progress</p>
          </div>
          <div className="header-actions">
            <div className="stats">
              <span className="stat-item">
                <strong>{totalCount}</strong> Total Requests
              </span>
              <span className="stat-item">
                <strong>{requests.filter(r => r.status === 'pending').length}</strong> Pending
              </span>
            </div>
            <button
              onClick={() => navigate('/submit-request')}
              className="btn btn-primary"
            >
              + New Request
            </button>
          </div>
        </div>
      </div>

      <div className="ice-box-content">
        <div className="filters-section">
          <FeatureRequestFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            totalCount={totalCount}
          />
        </div>

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
              <div className="empty-icon">💡</div>
              <h3>No feature requests found</h3>
              <p>
                {filters.search || filters.status || filters.category || filters.priority
                  ? 'Try adjusting your filters to see more results.'
                  : 'Be the first to submit a feature request!'}
              </p>
              {!filters.search && !filters.status && !filters.category && !filters.priority && (
                <button
                  onClick={() => navigate('/submit-request')}
                  className="btn btn-primary"
                >
                  Submit First Request
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="requests-grid">
                {requests.map((request) => (
                  <FeatureRequestCard
                    key={request.id}
                    request={request}
                    user={user}
                    onVote={handleVote}
                    onCommentAdded={handleCommentAdded}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
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

export default IceBox;
