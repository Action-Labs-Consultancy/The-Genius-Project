/**
 * Admin Ice Box - Feature Request Management
 * Ice emoji on the left, admin dashboard for managing requests
 */

import React, { useState, useEffect } from 'react';
import { featureRequestApi } from '../api/featureRequestApi';

const AdminIceBox = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  const [expandedRequest, setExpandedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await featureRequestApi.getAdminRequests(filters);
      
      if (response.success) {
        setRequests(response.data.requests || []);
      } else {
        setError('Failed to load requests');
      }
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await featureRequestApi.getAdminStats();
      if (response.success) {
        setStats(response.data.stats || {});
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, adminComment = '') => {
    try {
      const response = await featureRequestApi.updateRequestStatus(requestId, newStatus, adminComment);
      
      if (response.success) {
        // Refresh the requests list
        loadRequests();
        loadStats();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        const response = await featureRequestApi.deleteRequest(requestId);
        
        if (response.success) {
          loadRequests();
          loadStats();
        } else {
          alert('Failed to delete request');
        }
      } catch (err) {
        console.error('Error deleting request:', err);
        alert('Failed to delete request');
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#ffc107';
      case 'in progress': return '#17a2b8';
      case 'completed': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* Ice Sidebar */}
      <div style={{
        width: '120px',
        backgroundColor: '#e3f2fd',
        borderRight: '2px solid #bbdefb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 10px',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧊</div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#1976d2',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          Ice Box
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#666',
          textAlign: 'center',
          marginTop: '10px'
        }}>
          Feature Requests
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '120px', flex: 1, padding: '20px', overflow: 'auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '28px' }}>
            Feature Request Dashboard
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Manage and track all feature requests
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#007bff' }}>
              {stats.total || 0}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Total Requests</div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>
              {stats.pending || 0}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Pending</div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#17a2b8' }}>
              {stats.in_progress || 0}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>In Progress</div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
              {stats.completed || 0}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e9ecef',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            <input
              type="text"
              placeholder="Search requests..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              style={{
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              style={{
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
            
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              style={{
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            
            <button
              onClick={() => setFilters({ status: '', category: '', priority: '', search: '' })}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading requests...
          </div>
        )}

        {/* Requests List */}
        {!loading && requests.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
            <h3 style={{ color: '#666', margin: 0 }}>No requests found</h3>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            {requests.map((request) => (
              <div key={request.id} style={{ 
                borderBottom: '1px solid #e9ecef',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 10px 0', 
                      color: '#333',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                    >
                      {request.title}
                      <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
                        {expandedRequest === request.id ? '▼' : '▶'}
                      </span>
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: getStatusColor(request.status),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {request.status}
                      </span>
                      
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: getPriorityColor(request.priority),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {request.priority}
                      </span>
                      
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#f8f9fa',
                        color: '#666',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {request.category}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      By: {request.user_name} ({request.user_email}) • 
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                      style={{
                        padding: '5px 10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    
                    <button
                      onClick={() => handleDelete(request.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedRequest === request.id && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{ marginBottom: '15px' }}>
                      <strong>Description:</strong>
                      <p style={{ margin: '5px 0', lineHeight: '1.5' }}>{request.description}</p>
                    </div>
                    
                    {request.use_case && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong>Use Case:</strong>
                        <p style={{ margin: '5px 0', lineHeight: '1.5' }}>{request.use_case}</p>
                      </div>
                    )}
                    
                    {request.expected_outcome && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong>Expected Outcome:</strong>
                        <p style={{ margin: '5px 0', lineHeight: '1.5' }}>{request.expected_outcome}</p>
                      </div>
                    )}
                    
                    {request.admin_comment && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong>Admin Notes:</strong>
                        <p style={{ margin: '5px 0', lineHeight: '1.5', fontStyle: 'italic' }}>
                          {request.admin_comment}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                        Add Internal Note:
                      </label>
                      <textarea
                        placeholder="Add internal notes or comments..."
                        rows="3"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          resize: 'vertical'
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            handleStatusUpdate(request.id, request.status, e.target.value);
                            e.target.value = '';
                          }
                        }}
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
  );
};

export default AdminIceBox;
