import React, { useEffect, useState, useRef } from 'react';
import './styles.css';
import { API_BASE_URL } from './config/api';

export default function Settings({ onNavigate, onUserUpdate, user }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    user_type: 'employee', // Only 'employee' or 'client'
    department: '', // Free text
    is_admin: false,
    email: '',
    password: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [tab, setTab] = useState('users');
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approveLoading, setApproveLoading] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(null);
  const [assignType, setAssignType] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeptError, setShowDeptError] = useState(false);
  const [showDeleteRequestsModal, setShowDeleteRequestsModal] = useState(false);
  const [deleteRequestsLoading, setDeleteRequestsLoading] = useState(false);
  const menuRef = useRef();

  // Fetch users from API
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        // Replace with your real API endpoint
        const res = await fetch(`${API_BASE_URL}/api/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        console.log('[Settings] /api/users response:', data); // Debug log
        if (!Array.isArray(data) || data.length === 0) {
          setMsg('No users returned from API. Check your backend/database.');
        }
        setUsers(data);
      } catch (err) {
        setMsg('Failed to load users.');
        console.error('[Settings] Error fetching users:', err);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  // Fetch access requests on mount and when tab changes
  useEffect(() => {
    setLoadingRequests(true);
    fetch(`${API_BASE_URL}/api/access-requests`)
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setLoadingRequests(false);
      });
  }, []);
  useEffect(() => {
    if (tab === 'requests') {
      setLoadingRequests(true);
      fetch(`${API_BASE_URL}/api/access-requests`)
        .then(res => res.json())
        .then(data => {
          setRequests(data);
          setLoadingRequests(false);
        });
    }
  }, [tab]);

  // Count pending requests for notification badge
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  // Filtered and searched users
  const filteredUsers = users.filter(u =>
    (filter === 'all' || u.user_type === filter) &&
    (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );
  console.log('users:', users);
  console.log('filteredUsers:', filteredUsers);

  // Add user
  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setMsg('Name, email, and password are required');
      setLoading(false);
      return;
    }
    if (form.user_type === 'employee' && !form.department) {
      setMsg('Please select a department');
      setLoading(false);
      return;
    }
    try {
      const payload = { ...form, role: form.user_type };
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add user');
      const newUser = await res.json();
      setUsers(prev => [newUser, ...prev]);
      setForm({ name: '', user_type: 'employee', department: '', is_admin: false, email: '', password: '' });
      setShowModal(false);
      setMsg('User added successfully!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg('Failed to add user.');
    }
    setLoading(false);
  };

  // Edit user
  const handleEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      user_type: user.user_type || 'employee',
      department: user.department || '',
      is_admin: user.is_admin || false,
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update user');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      if (user && updated.id === user.id && onUserUpdate) {
        onUserUpdate(updated);
      }
      setEditUser(null);
      setEditForm(null);
      setMsg('User updated successfully!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg('Failed to update user.');
    }
    setLoading(false);
  };

  // Delete user
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      // Replace with your real API endpoint
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(prev => prev.filter(u => u.id !== id));
      setShowDeleteModal(null);
      setMsg('User deleted successfully!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg('Failed to delete user.');
    }
    setLoading(false);
  };

  // Approve request
  const handleApprove = async (req) => {
    setApproveLoading(req.id);
    const user_type = assignType[req.id] || req.user_type || 'employee';
    const department = user_type === 'employee' ? (req.department || '') : '';
    // Prevent approval if employee and no department selected
    if (user_type === 'employee' && !department) {
      setShowDeptError(true);
      setApproveLoading(null);
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/api/access-requests/${req.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_type, department })
      });
      // Refetch users and requests after approval
      fetch(`${API_BASE_URL}/api/users`)
        .then(res => res.json())
        .then(data => setUsers(data));
      fetch(`${API_BASE_URL}/api/access-requests`)
        .then(res => res.json())
        .then(data => setRequests(data));
      setTab('users'); // Switch to users tab after approval
    } catch (err) {
      setMsg('Failed to approve request.');
    }
    setApproveLoading(null);
  };

  // Reject request
  const handleReject = async (req) => {
    setRejectLoading(req.id);
    try {
      await fetch(`${API_BASE_URL}/api/access-requests/${req.id}/reject`, { method: 'POST' });
      // Always refetch after attempt, regardless of response
      fetch(`${API_BASE_URL}/api/access-requests`)
        .then(res => res.json())
        .then(data => setRequests(data));
    } catch (err) {
      // Silently fail
    }
    setRejectLoading(null);
  };

  // Only show department if userType is employee
  const departmentOptions = [
    '',
    'HR',
    'Production',
    'Marketing',
  ];

  // --- MODERN BLACK & YELLOW THEME (Action Labs) ---
  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 4rem 0' }}>
      <style>{`
        @keyframes fadeInPop {
          from { opacity: 0; transform: scale(0.96) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modern-modal {
          background: #181818 !important;
          color: #FFD600 !important;
          border-radius: 22px !important;
          box-shadow: 0 12px 48px #0008, 0 2px 12px #FFD60022 !important;
          border: 2.5px solid #FFD60044 !important;
          padding: 2.5rem 2.5rem 2rem 2.5rem !important;
          min-width: 340px;
          max-width: 98vw;
          animation: fadeInPop 0.22s cubic-bezier(.4,1.4,.6,1) both;
          transition: box-shadow 0.2s, border 0.2s;
        }
        .modern-modal h3 {
          color: #FFD600;
          font-weight: 900;
          margin-bottom: 1.2rem;
          font-size: 1.3rem;
          letter-spacing: 0.5px;
        }
        .modern-modal p {
          color: #fff;
          font-size: 1.08rem;
          margin-bottom: 1.5rem;
        }
        .modern-modal .btn-flat {
          margin-top: 0.5rem;
          font-size: 1.08rem;
          padding: 0.7rem 2.2rem;
        }
        .modern-modal .btn-flat.delete-btn {
          background: #dc2626 !important;
          color: #fff !important;
        }
        .modern-modal .btn-flat.delete-btn:hover {
          background: #fff !important;
          color: #dc2626 !important;
        }
        .modern-modal .modal-btn-row {
          display: flex;
          gap: 1.2rem;
          margin-top: 1.5rem;
          justify-content: center;
        }
        .modern-settings-title {
          margin-top: 40px;
          margin-bottom: 36px;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 1px;
          text-align: left;
        }
        .modern-settings-tabs {
          margin-bottom: 32px;
          gap: 0;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          background: #181818;
          border-radius: 999px;
          box-shadow: 0 2px 12px #FFD60022;
          padding: 4px 6px;
          width: fit-content;
          margin-left: 0;
        }
        .modern-tab-btn {
          background: none;
          border: none;
          font-size: 1.08rem;
          font-weight: 700;
          color: #FFD600;
          padding: 0.7rem 2.2rem;
          border-radius: 999px;
          transition: background 0.22s, color 0.22s, box-shadow 0.22s, transform 0.18s;
          cursor: pointer;
          margin: 0 2px;
          position: relative;
        }
        .modern-tab-btn.active {
          background: #FFD600;
          color: #181818;
          box-shadow: 0 4px 24px #FFD60044;
          transform: translateY(-2px) scale(1.04);
          z-index: 2;
        }
        .modern-tab-btn:not(.active):hover {
          background: #232323;
          color: #fff200;
          box-shadow: 0 2px 12px #FFD60033;
          transform: translateY(-1px) scale(1.03);
        }
        .modern-settings-table {
          background: #181818 !important;
          color: #FFD600;
          border-radius: 18px;
          box-shadow: 0 8px 32px #0005;
          border: 2px solid #FFD60044;
          margin-top: 2.5rem;
          margin-bottom: 2.5rem;
          overflow: hidden;
          width: 100%;
          max-width: 1100px;
          border-collapse: separate;
          border-spacing: 0;
        }
        .modern-table-outer {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto 2.5rem auto;
          background: #111;
          border-radius: 22px;
          padding: 0.5rem 0 2.5rem 0;
        }
        .modern-settings-table th, .modern-settings-table td {
          text-align: center;
        }
        .modern-settings-table th.user-type-col, .modern-settings-table td.user-type-col {
          padding-left: 32px;
          padding-right: 32px;
        }
        .modern-settings-table th {
          background: #FFD600;
          color: #181818;
          font-size: 1.08rem;
          font-weight: 800;
          border-bottom: 2px solid #FFD60044;
          box-shadow: 0 2px 8px #FFD60044;
          padding: 1rem 0.7rem;
          text-align: center;
        }
        .modern-settings-table td {
          color: #FFD600;
          background: #181818;
          font-size: 1rem;
          padding: 1.1rem 0.7rem;
          border-bottom: 1px solid #FFD60044;
          text-align: center;
        }
        .modern-settings-table tr:last-child td {
          border-bottom: none;
        }
        .modern-settings-table tr:hover {
          background: #232323;
          box-shadow: 0 2px 12px #FFD60044;
        }
        .modern-table-actions {
          position: relative;
          display: flex;
          align-items: center;
          margin-left: 12px;
        }
        .modern-table-menu-btn {
          background: none;
          border: none;
          color: #FFD600;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 8px;
          transition: background 0.18s;
        }
        .modern-table-menu-btn:hover {
          background: #232323;
        }
        .modern-table-menu-dropdown {
          position: absolute;
          top: 32px;
          right: 0;
          background: #181818;
          border: 2px solid #FFD600;
          border-radius: 10px;
          box-shadow: 0 4px 16px #FFD60044;
          z-index: 10;
          min-width: 160px;
        }
        .modern-table-menu-dropdown button {
          width: 100%;
          background: none;
          color: #FFD600;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          padding: 12px 18px;
          text-align: left;
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
        }
        .modern-table-menu-dropdown button:hover {
          background: #FFD600;
          color: #111;
        }
        .modern-requests-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .modern-requests-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          align-items: center;
        }
        .modern-input, .btn-outline, .btn-flat {
          font-family: inherit;
          font-size: 1rem;
          border-radius: 10px;
          border: 2px solid #FFD600;
          background: #181818;
          color: #FFD600;
          padding: 10px 18px;
          font-weight: 600;
          transition: background 0.18s, color 0.18s, border 0.18s, box-shadow 0.18s;
        }
        .modern-input:focus, .btn-outline:focus, .btn-flat:focus {
          outline: none;
          border: 2.5px solid #FFD600;
          background: #232323;
        }
        .btn-flat {
          background: #FFD600;
          color: #181818;
          font-weight: 700;
          box-shadow: 0 2px 8px #FFD60022;
        }
        .btn-flat:hover {
          background: #fff200;
          color: #000;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 16px #FFD60044;
        }
        .btn-outline {
          background: #181818;
          color: #FFD600;
          border: 2px solid #FFD600;
        }
        .btn-outline:hover {
          background: #FFD600;
          color: #181818;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 16px #FFD60044;
        }
        .notification-badge {
          position: absolute;
          top: -8px;
          right: -18px;
          background: #dc2626;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 800;
          border-radius: 999px;
          padding: 2px 10px;
          min-width: 26px;
          text-align: center;
          box-shadow: 0 2px 8px #0002;
          z-index: 2;
          border: 2px solid #fff;
          letter-spacing: 0.5px;
          display: inline-block;
          line-height: 1.2;
        }
      `}</style>
      <h2 className="modern-settings-title" style={{ fontSize: 26, marginTop: 48, marginBottom: 48, textAlign: 'left', fontWeight: 800, letterSpacing: 0.5 }}>User Management</h2>
      {msg && <div className="settings-msg" style={{ marginBottom: 24 }}>{msg}</div>}
      <div className="modern-settings-tabs" style={{ marginBottom: 36, marginLeft: 0 }}>
        <button className={tab === 'users' ? 'modern-tab-btn active' : 'modern-tab-btn'} onClick={() => setTab('users')}>Users</button>
        <button className={tab === 'requests' ? 'modern-tab-btn active' : 'modern-tab-btn'} onClick={() => setTab('requests')} style={{ position: 'relative' }}>
          Requests
          {pendingRequests > 0 && (
            <span className="notification-badge">{pendingRequests}</span>
          )}
        </button>
      </div>
      {tab === 'users' && (
        <>
          <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto 8px auto', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-flat"
              style={{ background: '#FFD600', color: '#111', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, padding: '10px 28px', boxShadow: '0 2px 8px #FFD60033', transition: 'background 0.2s, color 0.2s, transform 0.18s, box-shadow 0.18s' }}
              onClick={() => setShowModal(true)}
            >
              + Add User
            </button>
          </div>
          <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', background: '#111', borderRadius: 22, padding: '0.5rem 0 2.5rem 0' }}>
            <table className="modern-settings-table" style={{ width: '100%', minWidth: 900, tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Name</th>
                  <th style={{ width: '22%' }}>Email</th>
                  <th style={{ width: '18%' }}>User Type</th>
                  <th style={{ width: '16%' }}>Department</th>
                  <th style={{ width: '12%' }}>Admin</th>
                  <th style={{ width: '14%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.user_type}</td>
                      <td>{user.user_type !== 'client' ? user.department : '-'}</td>
                      <td>{user.is_admin ? 'Yes' : 'No'}</td>
                      <td>
                        <button 
                          className="btn-outline"
                          onClick={() => handleEdit(user)}
                          disabled={loading}
                          style={{ marginRight: 8 }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-outline"
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
        </>
      )}
      {/* Add User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modern-modal modern-modal-popup" style={{
            background: '#181818',
            border: '2.5px solid #FFD600',
            borderRadius: 20,
            boxShadow: '0 8px 32px #FFD60033',
            padding: '2.5rem 2.5rem 2rem 2.5rem',
            minWidth: 340,
            maxWidth: 500,
            width: '95vw',
            color: '#FFD600',
            fontFamily: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h3 style={{ color: '#FFD600', fontWeight: 900, marginBottom: '1.2rem', fontSize: '1.5rem', letterSpacing: 0.5 }}>Add New User</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', width: '100%' }}>
              <label style={{ color: '#FFD600', fontWeight: 600 }}>Full Name</label>
              <input
                className="modern-input"
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px' }}
              />
              <label style={{ color: '#FFD600', fontWeight: 600 }}>Email</label>
              <input
                className="modern-input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px' }}
              />
              <label style={{ color: '#FFD600', fontWeight: 600 }}>Password</label>
              <input
                className="modern-input"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                required
                style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px' }}
              />
              <label style={{ color: '#FFD600', fontWeight: 600 }}>User Type</label>
              <select
                className="modern-input"
                value={form.user_type}
                onChange={e => setForm(f => ({ ...f, user_type: e.target.value, department: '' }))}
                required
                style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px' }}
              >
                <option value="employee">Employee</option>
                <option value="client">Client</option>
              </select>
              {form.user_type === 'employee' && (
                <>
                  <label style={{ color: '#FFD600', fontWeight: 600 }}>Department</label>
                  <select
                    className="modern-input"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    required
                    style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px' }}
                  >
                    {departmentOptions.map(opt => (
                      <option key={opt} value={opt}>{opt || 'Select Department'}</option>
                    ))}
                  </select>
                </>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD600', fontSize: '0.98rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={e => setForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#FFD600' }}
                />
                Administrator privileges
              </label>
              <div className="modal-btn-row" style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem', justifyContent: 'center' }}>
                <button
                  className="btn-flat"
                  type="submit"
                  disabled={loading || !form.name}
                  style={{ background: '#FFD600', color: '#111', border: 'none', borderRadius: 10, fontWeight: 700, padding: '0.875rem 2rem', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px #FFD60033' }}
                >
                  {loading ? 'Adding User...' : 'Add User'}
                </button>
                <button
                  type="button"
                  className="btn-outline cancel-btn"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#181818', color: '#FFD600', border: '2px solid #FFD600', borderRadius: 10, fontWeight: 700, padding: '0.875rem 2rem', fontSize: '1rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editUser && editForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modern-modal modern-modal-popup" style={{
            background: 'linear-gradient(135deg, #181818 80%, #FFD600 100%)',
            border: '2.5px solid #FFD600',
            borderRadius: 24,
            boxShadow: '0 12px 48px #FFD60033, 0 2px 12px #FFD60022',
            padding: '2.5rem 2.5rem 2rem 2.5rem',
            minWidth: 340,
            maxWidth: 1100,
            width: '100%',
            animation: 'fadeInPop 0.22s cubic-bezier(.4,1.4,.6,1) both',
            transition: 'box-shadow 0.2s, border 0.2s',
            color: '#FFD600',
            fontFamily: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h3 style={{ color: '#FFD600', fontWeight: 900, marginBottom: '2.2rem', fontSize: '2rem', letterSpacing: 0.5, textAlign: 'center', textShadow: '0 2px 12px #0008' }}>Edit User</h3>
            <form onSubmit={handleEditSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.2rem 3.5rem', width: '100%', maxWidth: 900 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <label style={{ color: '#FFD600', fontWeight: 600 }}>Full Name</label>
                <input
                  className="modern-input"
                  type="text"
                  placeholder="Full Name"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                />
                <label style={{ color: '#FFD600', fontWeight: 600 }}>Email</label>
                <input
                  className="modern-input"
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                />
                <label style={{ color: '#FFD600', fontWeight: 600 }}>Password</label>
                <input
                  className="modern-input"
                  type="password"
                  placeholder="New Password (leave blank to keep current)"
                  value={editForm.password}
                  onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <label style={{ color: '#FFD600', fontWeight: 600 }}>User Type</label>
                <select
                  className="modern-input"
                  value={editForm.user_type}
                  onChange={e => setEditForm(f => ({ ...f, user_type: e.target.value, department: '' }))}
                  required
                  style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                >
                  <option value="employee">Employee</option>
                  <option value="client">Client</option>
                </select>
                {editForm.user_type === 'employee' && (
                  <>
                    <label style={{ color: '#FFD600', fontWeight: 600 }}>Department</label>
                    <select
                      className="modern-input"
                      value={editForm.department}
                      onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                      required
                      style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                    >
                      {departmentOptions.map(opt => (
                        <option key={opt} value={opt}>{opt || 'Select Department'}</option>
                      ))}
                    </select>
                  </>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#FFD600', fontSize: '0.98rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editForm.is_admin}
                    onChange={e => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: '#FFD600' }}
                  />
                  Administrator privileges
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2.2rem' }}>
                <button
                  className="btn-flat"
                  type="submit"
                  disabled={loading || !editForm.name}
                  style={{ background: '#FFD600', color: '#111', border: 'none', borderRadius: 10, fontWeight: 700, padding: '0.875rem 2.5rem', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px #FFD60033', transition: 'background 0.2s, color 0.2s, transform 0.18s, box-shadow 0.18s' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-outline cancel-btn"
                  onClick={() => { setEditUser(null); setEditForm(null); }}
                  style={{ background: '#181818', color: '#FFD600', border: '2px solid #FFD600', borderRadius: 10, fontWeight: 700, padding: '0.875rem 2.5rem', fontSize: '1.1rem', cursor: 'pointer', transition: 'background 0.2s, color 0.2s, transform 0.18s, box-shadow 0.18s' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modern-modal modern-modal-popup delete-modal" style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#dc2626' }}>Delete User</h3>
            <p style={{ color: '#fff', marginBottom: '1.2rem' }}>Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="modal-btn-row">
              <button
                className="btn-flat delete-btn"
                onClick={() => handleDelete(showDeleteModal)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                className="btn-outline cancel-btn"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Department error popup */}
      {showDeptError && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modern-modal" style={{ minWidth: 340, maxWidth: 400, textAlign: 'center' }}>
            <h3>Department Required</h3>
            <p>Please select a department for employee approval.</p>
            <button className="btn-flat" onClick={() => setShowDeptError(false)} style={{ minWidth: 120 }}>OK</button>
          </div>
        </div>
      )}
      {/* Requests Table (organized) */}
      {tab === 'requests' && (
        <div style={{ width: '100%', maxWidth: 1100, margin: '2.5rem auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0 24px', position: 'relative' }}>
          {loadingRequests ? <p style={{ color: '#FFD600', textAlign: 'center', margin: '3rem 0' }}>Loading requests…</p> : (
            <table className="modern-settings-table" style={{ width: '100%', minWidth: 900, tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Name</th>
                  <th style={{ width: '22%' }}>Email</th>
                  <th style={{ width: '18%' }}>Date & Time</th>
                  <th className="user-type-col" style={{ width: '16%', paddingLeft: 32, paddingRight: 32 }}>User Type</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '14%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests
                  .filter(req => filter === 'all' || req.status === filter)
                  .filter(req => search === '' || (req.name && req.name.toLowerCase().includes(search.toLowerCase())) || (req.email && req.email.toLowerCase().includes(search.toLowerCase())))
                  .map(req => {
                    return (
                      <tr key={req.id}>
                        <td style={{ padding: '1.1rem 0.7rem' }}>{req.name || '-'}</td>
                        <td style={{ padding: '1.1rem 0.7rem' }}>{req.email}</td>
                        <td style={{ padding: '1.1rem 0.7rem' }}>{req.requested_at ? new Date(req.requested_at).toLocaleDateString() + ' ' + new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                        <td className="user-type-col" style={{ padding: '1.1rem 32px' }}>
                          {req.status === 'pending' ? (
                            <div className="modern-requests-cell" style={{ alignItems: 'center', gap: 8 }}>
                              <select
                                className="modern-input"
                                value={assignType[req.id] || req.user_type || 'employee'}
                                onChange={e => setAssignType(a => ({ ...a, [req.id]: e.target.value }))}
                                style={{ minWidth: 110, marginBottom: 4, background: '#232323', color: '#FFD600', border: '2px solid #FFD600', fontWeight: 600, borderRadius: 8, fontSize: 15, boxShadow: '0 2px 8px #FFD60022', padding: '8px 16px' }}
                              >
                                <option value="employee">Employee</option>
                                <option value="client">Client</option>
                              </select>
                              {(assignType[req.id] === 'employee' || (!assignType[req.id] && (req.user_type === 'employee' || !req.user_type))) && (
                                <select
                                  className="modern-input"
                                  value={req.department || ''}
                                  onChange={e => {
                                    setRequests(requests => requests.map(r => r.id === req.id ? { ...r, department: e.target.value } : r));
                                  }}
                                  required
                                  style={{ minWidth: 110, background: '#232323', color: '#FFD600', border: '2px solid #FFD600', fontWeight: 600, borderRadius: 8, fontSize: 15, boxShadow: '0 2px 8px #FFD60022', padding: '8px 16px' }}
                                >
                                  {departmentOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt || 'Select Department'}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : (
                            req.user_type === 'employee' ? (req.department || '-') : (req.user_type || '-')
                          )}
                        </td>
                        <td style={{ padding: '1.1rem 0.7rem' }}>{req.status}</td>
                        <td style={{ padding: '1.1rem 0.7rem' }}>
                          {req.status === 'pending' && (
                            <div className="modern-requests-actions">
                              <button className="modern-table-menu-btn" onClick={() => handleApprove(req)} disabled={approveLoading === req.id} title="Approve" style={{ fontSize: 22, padding: 4, background: 'none', border: 'none' }}>
                                ✔
                              </button>
                              <button className="modern-table-menu-btn" onClick={() => handleReject(req)} disabled={rejectLoading === req.id} title="Reject" style={{ fontSize: 22, padding: 4, background: 'none', border: 'none' }}>
                                ✖
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}