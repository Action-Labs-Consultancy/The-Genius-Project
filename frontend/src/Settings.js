import React, { useEffect, useState } from 'react';
import './styles.css';

export default function Settings({ onNavigate }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', is_admin: false });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
        // Clear success message after 3 seconds
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
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${id}`, { 
        method: 'DELETE' 
      });
      
      if (res.ok) {
        await fetchUsers();
        setMsg('User deleted successfully!');
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
    const pwd = window.prompt('Enter new password:');
    if (!pwd || pwd.trim().length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      
      if (res.ok) {
        setMsg('Password updated successfully!');
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

  return (
    <div className="settings-page fade-in">
      <button 
        className="back-btn" 
        onClick={() => onNavigate('dashboard')}
        disabled={loading}
      >
        ← Back to Dashboard
      </button>
      
      <h2>Manage Users</h2>
      
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
      
      <div style={{ overflowX: 'auto' }}>
        <table className="settings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Admin Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'Loading users...' : 'No users found'}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    <span style={{ 
                      color: user.is_admin ? 'var(--success-color)' : 'var(--text-secondary)',
                      fontWeight: '500'
                    }}>
                      {user.is_admin ? '✔️ Admin' : '— User'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handlePwd(user.id)}
                      disabled={loading}
                      title="Change Password"
                    >
                      Change Password
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      disabled={loading}
                      title="Delete User"
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

      <form className="settings-form" onSubmit={handleAdd}>
        <h3>Add New User</h3>
        
        <input
          type="email"
          placeholder="Enter email address"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          required
          disabled={loading}
        />
        
        <input
          type="password"
          placeholder="Enter password (min 6 characters)"
          value={form.password}
          onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
          required
          minLength="6"
          disabled={loading}
        />
        
        <label>
          <input
            type="checkbox"
            checked={form.is_admin}
            onChange={(e) => setForm(prev => ({ ...prev, is_admin: e.target.checked }))}
            disabled={loading}
          />
          Administrator privileges
        </label>
        
        <button 
          type="submit" 
          disabled={loading || !form.email || !form.password}
        >
          {loading ? 'Adding User...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}