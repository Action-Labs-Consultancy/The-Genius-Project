import React, { useState, useEffect } from 'react';

export default function ClientAccessManager({ clientId, userType }) {
  const [accessList, setAccessList] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    if (clientId && userType === 'employee') {
      fetchAccessList();
      fetchAvailableUsers();
    }
  }, [clientId, userType]);

  const fetchAccessList = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/access`);
      if (!res.ok) throw new Error('Failed to fetch access list');
      const data = await res.json();
      setAccessList(data);
    } catch (err) {
      console.error('Error fetching access list:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Fetch all users with role 'client'
      const res = await fetch('/api/users?role=client');
      if (!res.ok) {
        // Fallback: create a mock endpoint or get users another way
        setAvailableUsers([]);
        return;
      }
      const data = await res.json();
      setAvailableUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setAvailableUsers([]);
    }
  };

  const handleAddAccess = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(selectedUser),
          can_view: true,
          can_comment: true,
          can_approve: true
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add access');
      }

      setShowAddUserModal(false);
      setSelectedUser('');
      fetchAccessList();
      alert('User access added successfully!');
    } catch (err) {
      console.error('Error adding access:', err);
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleRemoveAccess = async (accessId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to remove this user\'s access?')) return;
    
    try {
      const res = await fetch(`/api/clients/${clientId}/access/${accessId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to remove access');
      
      fetchAccessList();
      alert('User access removed successfully!');
    } catch (err) {
      console.error('Error removing access:', err);
      alert('Failed to remove access. Please try again.');
    }
  };

  const handleTogglePermission = async (accessId, permission, currentValue) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/access/${accessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [permission]: !currentValue
        })
      });

      if (!res.ok) throw new Error('Failed to update permission');
      
      fetchAccessList();
    } catch (err) {
      console.error('Error updating permission:', err);
      alert('Failed to update permission. Please try again.');
    }
  };

  // Only show for employees
  if (userType !== 'employee') {
    return null;
  }

  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      margin: '20px 0',
      border: '2px solid #333'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          color: '#FFD600',
          fontSize: '18px',
          fontWeight: 'bold',
          margin: 0
        }}>
          🔐 Client Access Management
        </h3>
        
        <button
          onClick={() => setShowAddUserModal(true)}
          style={{
            background: '#FFD600',
            color: '#111',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          + Add User Access
        </button>
      </div>

      {accessList.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          No users have access to this client yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {accessList.map(access => (
            <div
              key={access.id}
              style={{
                background: '#2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>
                  {access.viewer_name}
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  {access.viewer_email}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={access.can_view}
                    onChange={() => handleTogglePermission(access.id, 'can_view', access.can_view)}
                  />
                  View
                </label>
                
                <label style={{ color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={access.can_comment}
                    onChange={() => handleTogglePermission(access.id, 'can_comment', access.can_comment)}
                  />
                  Comment
                </label>
                
                <label style={{ color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={access.can_approve}
                    onChange={() => handleTogglePermission(access.id, 'can_approve', access.can_approve)}
                  />
                  Approve
                </label>
                
                <button
                  onClick={() => handleRemoveAccess(access.id)}
                  style={{
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            border: '2px solid #FFD600'
          }}>
            <h3 style={{ color: '#FFD600', marginBottom: '20px' }}>
              Add User Access
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                Select User:
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#2a2a2a',
                  color: '#fff'
                }}
              >
                <option value="">Select a user...</option>
                {availableUsers
                  .filter(user => !accessList.some(access => access.viewer_user_id === user.id))
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedUser('');
                }}
                style={{
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleAddAccess}
                disabled={!selectedUser || loading}
                style={{
                  background: selectedUser && !loading ? '#FFD600' : '#666',
                  color: '#111',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: selectedUser && !loading ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Adding...' : 'Add Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
