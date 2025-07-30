/**
 * Simple Admin Requests Page - Ice Box 🧊
 * Admins can view all requests and update status
 */

import React, { useState, useEffect } from 'react';

const AdminIceBox = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRequests = async () => {
    try {
      const response = await fetch('http://192.168.100.63:10000/api/admin/feature-requests', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRequests(data.data.requests || []);
        setMessage('');
      } else {
        setMessage('❌ Failed to load requests: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Load error:', error);
      setMessage('❌ Failed to load requests');
    }
    setLoading(false);
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`http://192.168.100.63:10000/api/admin/feature-requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage('✅ Status updated successfully!');
        loadRequests(); // Reload requests
      } else {
        setMessage('❌ Failed to update status: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('❌ Failed to update status');
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      loadRequests();
    }
  }, [user]);

  if (!user?.is_admin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
        <h2>❌ Admin access required</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      color: '#fff'
    }}>
      <h1 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '30px' }}>
        🧊 Ice Box 🧊
      </h1>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.includes('✅') ? '#0f5132' : '#842029',
          border: message.includes('✅') ? '1px solid #badbcc' : '1px solid #f5c2c7',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <strong>Total Requests: {requests.length}</strong>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No requests yet</h3>
          <p>When users submit feature requests, they'll appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {requests.map((req) => (
            <div key={req.id} style={{
              backgroundColor: '#1a1a1a',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ color: '#FFD700', margin: 0, marginBottom: '5px' }}>
                    {req.title}
                  </h3>
                  <p style={{ margin: 0, color: '#ccc', fontSize: '14px' }}>
                    By: {req.submitted_by?.email} | 
                    Created: {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: getStatusColor(req.status),
                  color: '#000'
                }}>
                  {req.status}
                </div>
              </div>

              <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
                {req.description}
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <span style={{ 
                  padding: '2px 8px', 
                  backgroundColor: '#333', 
                  borderRadius: '4px', 
                  fontSize: '12px' 
                }}>
                  {req.category}
                </span>
                <span style={{ 
                  padding: '2px 8px', 
                  backgroundColor: getPriorityColor(req.priority), 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  color: '#000'
                }}>
                  {req.priority}
                </span>
              </div>

              {req.admin_comment && (
                <div style={{ 
                  backgroundColor: '#2a2a2a', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  marginBottom: '15px' 
                }}>
                  <strong>Admin Comment:</strong> {req.admin_comment}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['pending', 'in_review', 'approved', 'in_progress', 'completed', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(req.id, status)}
                    disabled={req.status === status}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: req.status === status ? '#666' : '#333',
                      color: req.status === status ? '#999' : '#fff',
                      cursor: req.status === status ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    pending: '#fbbf24',
    in_review: '#60a5fa',
    approved: '#4ade80',
    in_progress: '#a78bfa',
    completed: '#10b981',
    rejected: '#f87171'
  };
  return colors[status] || '#gray';
};

const getPriorityColor = (priority) => {
  const colors = {
    low: '#4ade80',
    medium: '#fbbf24',
    high: '#f87171',
    urgent: '#dc2626'
  };
  return colors[priority] || '#gray';
};

export default AdminIceBox;
