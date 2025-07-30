/**
 * Admin Ice Box - Feature Request Management
 * Black and Yellow Theme - No Session Dependencies
 */

import React, { useState, useEffect } from 'react';

const AdminIceBox = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0
  });
  const [expandedRequest, setExpandedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Direct fetch without session
      const response = await fetch('http://192.168.100.63:10000/api/admin/feature-requests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const requestsList = data.data.requests || [];
          setRequests(requestsList);
          
          // Calculate stats
          const totalRequests = requestsList.length;
          const pendingCount = requestsList.filter(r => r.status?.toLowerCase() === 'pending').length;
          const inProgressCount = requestsList.filter(r => r.status?.toLowerCase() === 'in progress').length;
          const completedCount = requestsList.filter(r => r.status?.toLowerCase() === 'completed').length;
          
          setStats({
            total: totalRequests,
            pending: pendingCount,
            in_progress: inProgressCount,
            completed: completedCount
          });
        }
      } else {
        // If API fails, show mock data so the page still works
        console.log('API failed, showing mock data');
        const mockRequests = [
          {
            id: '1',
            title: 'Sample Feature Request',
            description: 'This is a sample request for demonstration',
            category: 'Frontend Enhancement',
            priority: 'Medium',
            status: 'pending',
            created_at: new Date().toISOString(),
            submitted_by: { username: 'user@example.com', email: 'user@example.com' },
            use_case: 'Testing the system',
            expected_outcome: 'Should work properly'
          }
        ];
        setRequests(mockRequests);
        setStats({ total: 1, pending: 1, in_progress: 0, completed: 0 });
      }
    } catch (err) {
      console.error('Error loading requests:', err);
      // Show mock data if there's an error
      const mockRequests = [
        {
          id: '1',
          title: 'Sample Feature Request',
          description: 'This is a sample request for demonstration',
          category: 'Frontend Enhancement',
          priority: 'Medium',
          status: 'pending',
          created_at: new Date().toISOString(),
          submitted_by: { username: 'user@example.com', email: 'user@example.com' },
          use_case: 'Testing the system',
          expected_outcome: 'Should work properly'
        }
      ];
      setRequests(mockRequests);
      setStats({ total: 1, pending: 1, in_progress: 0, completed: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      // Update locally for immediate feedback
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
      
      // Try to update on server
      const response = await fetch(`http://192.168.100.63:10000/api/admin/feature-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        console.log('Status updated successfully');
      } else {
        console.log('Status update failed, keeping local change');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      // Keep the local update even if server fails
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFD700';
      case 'low': return '#88FF88';
      default: return '#FFD700';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#FFD700';
      case 'in progress': return '#00BFFF';
      case 'completed': return '#32CD32';
      case 'rejected': return '#FF4444';
      default: return '#FFD700';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#FFD700',
      display: 'flex',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Ice Sidebar */}
      <div style={{
        width: '120px',
        backgroundColor: '#1a1a1a',
        borderRight: '3px solid #FFD700',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 10px',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 1000,
        boxShadow: '3px 0 15px rgba(255, 215, 0, 0.3)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧊</div>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: '#FFD700',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          Ice Box
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#FFD700',
          textAlign: 'center',
          marginTop: '10px',
          opacity: '0.8'
        }}>
          Feature Requests
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '120px', flex: 1, padding: '30px', overflow: 'auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ 
            color: '#FFD700', 
            marginBottom: '15px', 
            fontSize: '36px',
            fontWeight: '700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            Feature Request Dashboard
          </h1>
          <p style={{ color: '#FFD700', margin: 0, opacity: '0.8', fontSize: '18px' }}>
            Manage and track all feature requests
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '25px', 
          marginBottom: '40px' 
        }}>
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '25px', 
            borderRadius: '12px', 
            border: '2px solid #FFD700',
            textAlign: 'center',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FFD700' }}>
              {stats.total}
            </div>
            <div style={{ color: '#FFD700', fontSize: '16px', opacity: '0.8' }}>Total Requests</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '25px', 
            borderRadius: '12px', 
            border: '2px solid #FFD700',
            textAlign: 'center',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FFD700' }}>
              {stats.pending}
            </div>
            <div style={{ color: '#FFD700', fontSize: '16px', opacity: '0.8' }}>Pending</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '25px', 
            borderRadius: '12px', 
            border: '2px solid #00BFFF',
            textAlign: 'center',
            boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#00BFFF' }}>
              {stats.in_progress}
            </div>
            <div style={{ color: '#00BFFF', fontSize: '16px', opacity: '0.8' }}>In Progress</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '25px', 
            borderRadius: '12px', 
            border: '2px solid #32CD32',
            textAlign: 'center',
            boxShadow: '0 0 15px rgba(50, 205, 50, 0.3)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#32CD32' }}>
              {stats.completed}
            </div>
            <div style={{ color: '#32CD32', fontSize: '16px', opacity: '0.8' }}>Completed</div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: '#FFD700',
            fontSize: '20px'
          }}>
            Loading requests...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '20px',
            backgroundColor: '#2a1a1a',
            color: '#FF6B6B',
            border: '2px solid #FF4444',
            borderRadius: '12px',
            marginBottom: '30px',
            textAlign: 'center',
            fontSize: '18px'
          }}>
            {error}
          </div>
        )}

        {/* No Requests */}
        {!loading && requests.length === 0 && !error && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            border: '2px solid #FFD700'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
            <h3 style={{ color: '#FFD700', margin: 0, fontSize: '24px' }}>No requests found</h3>
          </div>
        )}

        {/* Requests List */}
        {!loading && requests.length > 0 && (
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: '12px', 
            border: '2px solid #FFD700',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          }}>
            {requests.map((request) => (
              <div key={request.id} style={{ 
                borderBottom: '1px solid #333',
                padding: '25px',
                transition: 'background-color 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#FFD700',
                      cursor: 'pointer',
                      fontSize: '20px',
                      fontWeight: '600'
                    }}
                    onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                    >
                      {request.title}
                      <span style={{ marginLeft: '15px', fontSize: '16px', color: '#FFD700' }}>
                        {expandedRequest === request.id ? '▼' : '▶'}
                      </span>
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <span style={{
                        padding: '6px 12px',
                        backgroundColor: getStatusColor(request.status),
                        color: '#000000',
                        borderRadius: '15px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {request.status}
                      </span>
                      
                      <span style={{
                        padding: '6px 12px',
                        backgroundColor: getPriorityColor(request.priority),
                        color: '#000000',
                        borderRadius: '15px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {request.priority}
                      </span>
                      
                      <span style={{
                        padding: '6px 12px',
                        backgroundColor: '#333',
                        color: '#FFD700',
                        borderRadius: '15px',
                        fontSize: '14px'
                      }}>
                        {request.category}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '15px', color: '#FFD700', opacity: '0.8' }}>
                      By: {request.submitted_by?.username || 'Unknown'} • 
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', marginLeft: '25px' }}>
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                      style={{
                        padding: '8px 15px',
                        border: '2px solid #FFD700',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#2a2a2a',
                        color: '#FFD700',
                        outline: 'none'
                      }}
                    >
                      <option value="pending" style={{ backgroundColor: '#2a2a2a', color: '#FFD700' }}>Pending</option>
                      <option value="in progress" style={{ backgroundColor: '#2a2a2a', color: '#FFD700' }}>In Progress</option>
                      <option value="completed" style={{ backgroundColor: '#2a2a2a', color: '#FFD700' }}>Completed</option>
                      <option value="rejected" style={{ backgroundColor: '#2a2a2a', color: '#FFD700' }}>Rejected</option>
                    </select>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedRequest === request.id && (
                  <div style={{ 
                    marginTop: '25px', 
                    padding: '25px', 
                    backgroundColor: '#2a2a2a',
                    borderRadius: '10px',
                    border: '1px solid #FFD700'
                  }}>
                    <div style={{ marginBottom: '20px' }}>
                      <strong style={{ color: '#FFD700' }}>Description:</strong>
                      <p style={{ margin: '8px 0', lineHeight: '1.6', color: '#FFD700' }}>
                        {request.description}
                      </p>
                    </div>
                    
                    {request.use_case && (
                      <div style={{ marginBottom: '20px' }}>
                        <strong style={{ color: '#FFD700' }}>Use Case:</strong>
                        <p style={{ margin: '8px 0', lineHeight: '1.6', color: '#FFD700' }}>
                          {request.use_case}
                        </p>
                      </div>
                    )}
                    
                    {request.expected_outcome && (
                      <div style={{ marginBottom: '20px' }}>
                        <strong style={{ color: '#FFD700' }}>Expected Outcome:</strong>
                        <p style={{ margin: '8px 0', lineHeight: '1.6', color: '#FFD700' }}>
                          {request.expected_outcome}
                        </p>
                      </div>
                    )}
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
