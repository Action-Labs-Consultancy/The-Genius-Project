import React, { useEffect, useState } from 'react';
import './styles.css';

export default function Settings({ onNavigate }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', is_admin: false });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/users');
      if (res.ok) {
        const userData = await res.json();
        setUsers(userData);
      } else {
        setMsg('Failed to fetch users');
      }
    } catch (error) {
      setMsg('Error connecting to server');
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setForm({ email: '', password: '', is_admin: false });
        await fetchUsers();
        setMsg('User added successfully!');
        setShowModal(false);
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(data.error || 'Failed to add user');
      }
    } catch (error) {
      setMsg('Error connecting to server');
      console.error('Add user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${id}`, { 
        method: 'DELETE' 
      });
      
      if (res.ok) {
        await fetchUsers();
        setMsg('User deleted successfully!');
        setShowDeleteModal(null);
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg('Failed to delete user');
      }
    } catch (error) {
      setMsg('Error connecting to server');
      console.error('Delete user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePwd = async (id) => {
    if (!newPassword || newPassword.trim().length < 6) {
      setMsg('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (res.ok) {
        setMsg('Password updated successfully!');
        setShowPasswordModal(null);
        setNewPassword('');
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg('Failed to update password');
      }
    } catch (error) {
      setMsg('Error connecting to server');
      console.error('Update password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.is_admin).length,
  };

  return (
    <div className="settings-page fade-in">
      <button 
        className="back-btn" 
        onClick={() => onNavigate('dashboard')}
        disabled={loading}
      >
        ← Back to Dashboard
      </button>
      
      <h2>User Management</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Manage user accounts, roles, and permissions</p>
      
      {msg && (
        <div className="settings-msg">
          {msg}
        </div>
      )}
      
      {loading && (
        <div style={{ 
          color: 'var(--accent-color)', 
          marginBottom: '1rem',
          textAlign: 'center' 
        }}>
          Loading...
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)' }}>{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Admin Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)' }}>{stats.adminUsers}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>All Users</h3>
        <div>
          <select 
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--primary-bg)', color: 'var(--text-primary)' }}
            onChange={(e) => {
              const role = e.target.value;
              if (role === 'All') {
                fetchUsers();
              } else {
                setUsers(users.filter(u => (role === 'Admin' && u.is_admin) || (role === 'User' && !u.is_admin)));
              }
            }}
          >
            <option>All</option>
            <option>Admin</option>
            <option>User</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="settings-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Last Active</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'Loading users...' : 'No users found'}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: user.is_admin ? '#ef4444' : '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 500 }}>
                      {user.is_admin ? 'ADMIN' : 'USER'}
                    </span>
                  </td>
                  <td>Today</td>
                  <td>{new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <button 
                      onClick={() => setShowPasswordModal(user.id)}
                      disabled={loading}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Change Password
                    </button>
                    <button 
                      onClick={() => setShowDeleteModal(user.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button 
        className="settings-form button" 
        onClick={() => setShowModal(true)}
        disabled={loading}
        style={{ marginTop: '1rem', background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))', color: 'white', border: 'none', padding: '0.875rem 2rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
      >
        {loading ? 'Adding User...' : 'Add User'}
      </button>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--secondary-bg)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            width: '90%',
            maxWidth: '400px',
            color: 'var(--text-primary)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Add New User</h3>
            <form onSubmit={handleAdd}>
              <input
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'var(--primary-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              />
              <input
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength="6"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'var(--primary-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              />
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) => setForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
                />
                Administrator privileges
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={loading || !form.email || !form.password}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                    color: 'white',
                    border: 'none',
                    padding: '0.875rem 2rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  {loading ? 'Adding User...' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'var(--glass-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.875rem 2rem',
                    borderRadius: '10px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--secondary-bg)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            width: '90%',
            maxWidth: '400px',
            color: 'var(--text-primary)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Confirm Delete</h3>
            <p style={{ marginBottom: '1.5rem' }}>Are you sure you want to delete this user?</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={loading}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                style={{
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--secondary-bg)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            width: '90%',
            maxWidth: '400px',
            color: 'var(--text-primary)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Change Password</h3>
            <input
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'var(--primary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handlePwd(showPasswordModal)}
                disabled={loading || !newPassword || newPassword.length < 6}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setNewPassword('');
                }}
                style={{
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}