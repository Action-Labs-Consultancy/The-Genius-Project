import React, { useEffect, useState, useRef } from 'react';
import './styles.css';
import { API_BASE_URL } from './config/api';

// Add modern form styling
const formStyles = `
  .modern-input:focus {
    border-color: #FFD600 !important;
    box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.1) !important;
    outline: none !important;
  }
  
  .modern-input:hover {
    border-color: #FFD600AA !important;
  }
  
  .form-section {
    background: linear-gradient(135deg, #232323 0%, #1a1a1a 100%);
    border: 1px solid #FFD60033;
    border-radius: 16px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  
  .form-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #FFD600, #FFD60066, #FFD600);
    opacity: 0.3;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #FFD600;
    font-size: 1rem;
    cursor: pointer;
    font-weight: 600;
    background: #333;
    padding: 12px 16px;
    border-radius: 12px;
    border: 2px solid #444;
    transition: all 0.2s ease;
  }
  
  .checkbox-label:hover {
    background: #3a3a3a;
    border-color: #FFD600;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = formStyles;
  if (!document.head.querySelector('style[data-form-styles]')) {
    styleSheet.setAttribute('data-form-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default function Settings({ onNavigate, onUserUpdate, user }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    user_type: 'employee', // Only 'employee' or 'client'
    department: '', // Free text
    marketing_role: '', // New field for marketing roles
    is_admin: false,
    email: '',
    password: '',
    start_date: '', // Add start date field
    responsibilities: '', // New field for employees
    skills: '', // New field for employees
    hours: '', // New field for employees
    office_location: '', // New field for employees
    is_ai_user: false, // New field for employees (human vs AI)
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

  // Access Control states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [savingPermissions, setSavingPermissions] = useState(false);

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
        // Ensure data is an array
        setRequests(Array.isArray(data) ? data : []);
        setLoadingRequests(false);
      })
      .catch(err => {
        console.error('Error fetching access requests:', err);
        setRequests([]);
        setLoadingRequests(false);
      });
  }, []);
  useEffect(() => {
    if (tab === 'requests') {
      setLoadingRequests(true);
      fetch(`${API_BASE_URL}/api/access-requests`)
        .then(res => res.json())
        .then(data => {
          // Ensure data is an array
          setRequests(Array.isArray(data) ? data : []);
          setLoadingRequests(false);
        })
        .catch(err => {
          console.error('Error fetching access requests:', err);
          setRequests([]);
          setLoadingRequests(false);
        });
    }
  }, [tab]);

  // Count pending requests for notification badge
  const pendingRequests = Array.isArray(requests) ? requests.filter(r => r.status === 'pending').length : 0;

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
      const payload = { ...form, role: form.user_type, start_date: form.start_date || null };
      console.log('Creating new user with payload:', payload);
      
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add user');
      const newUser = await res.json();
      console.log('Created user response:', newUser);
      
      setUsers(prev => [newUser, ...prev]);
      setForm({ 
        name: '', 
        user_type: 'employee', 
        department: '', 
        marketing_role: '',
        is_admin: false, 
        email: '', 
        password: '', 
        start_date: '',
        responsibilities: '',
        skills: '',
        hours: '',
        office_location: '',
        is_ai_user: false
      });
      setShowModal(false);
      setMsg('User added successfully!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      console.error('Error creating user:', err);
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
      marketing_role: user.marketing_role || '',
      is_admin: user.is_admin || false,
      start_date: user.start_date || '', // Add start date to edit form
      responsibilities: user.responsibilities || '',
      skills: user.skills || '',
      hours: user.hours || '',
      office_location: user.office_location || '',
      is_ai_user: user.is_ai_user || false,
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    if (editForm.user_type === 'employee' && !editForm.department.trim()) {
      setMsg('Employees must have a department assigned');
      setLoading(false);
      return;
    }
    try {
      // Get the user ID from editUser
      const userId = editUser.id || editUser._id;
      
      // Create payload - remove empty password field if unchanged
      const payload = { ...editForm };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password; // Don't send empty password
      }
      
      // Remove ID from payload since it's in the URL
      delete payload.id;
      
      // Ensure start_date is included
      payload.start_date = editForm.start_date || null;
      
      console.log('Sending payload for user update:', payload);
      console.log('User ID:', userId);
      
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      const updated = await res.json();
      console.log('Updated user response:', updated);
      
      setUsers(prev => prev.map(u => (u.id === updated._id || u._id === updated._id) ? updated : u));
      if (user && (updated._id === user.id || updated._id === user._id) && onUserUpdate) {
        onUserUpdate(updated);
      }
      setEditUser(null);
      setEditForm(null);
      setMsg('User updated successfully!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      console.error('Error updating user:', err);
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

  // Access Control Functions
  const loadUserPermissions = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/permissions`);
      if (res.ok) {
        const permissions = await res.json();
        setUserPermissions(permissions);
      } else {
        // Initialize with default permissions if none exist
        const defaultPermissions = {};
        availablePages.forEach(page => {
          defaultPermissions[page.id] = 'none';
        });
        setUserPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error('Error loading user permissions:', err);
      // Initialize with default permissions on error
      const defaultPermissions = {};
      availablePages.forEach(page => {
        defaultPermissions[page.id] = 'none';
      });
      setUserPermissions(defaultPermissions);
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    
    setSavingPermissions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: userPermissions })
      });
      
      if (res.ok) {
        setMsg('Permissions updated successfully!');
        setTimeout(() => setMsg(''), 2000);
      } else {
        setMsg('Failed to update permissions.');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setMsg('Failed to update permissions.');
    }
    setSavingPermissions(false);
  };

  const updatePermission = (pageId, permission) => {
    setUserPermissions(prev => ({
      ...prev,
      [pageId]: permission
    }));
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    loadUserPermissions(user.id);
  };

  // Only show department if userType is employee
  const departmentOptions = [
    'Marketing',
    'HR', 
    'Production',
    'Administration',
  ];

  // Available pages and permission levels for access control
  const availablePages = [
    { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard with overview' },
    { id: 'projects', name: 'Projects', description: 'Project management and tracking' },
    { id: 'tasks', name: 'Tasks', description: 'Task management and assignment' },
    { id: 'calendar', name: 'Calendar', description: 'Meetings and schedule management' },
    { id: 'chat', name: 'Chat/Messages', description: 'Internal communication' },
    { id: 'clients', name: 'Clients', description: 'Client management and information' },
    { id: 'reports', name: 'Reports', description: 'Analytics and reporting' },
    { id: 'settings', name: 'Settings', description: 'System configuration and user management' },
    { id: 'marketing', name: 'Marketing Lab', description: 'Marketing tools and campaigns' },
    { id: 'content', name: 'Content Management', description: 'Content creation and publishing' },
    { id: 'ai-tools', name: 'AI Tools', description: 'AI-powered features and tools' },
    { id: 'file-management', name: 'File Management', description: 'Document and file operations' }
  ];

  const permissionLevels = [
    { id: 'none', name: 'No Access', color: '#dc2626' },
    { id: 'view', name: 'View Only', color: '#f59e0b' },
    { id: 'edit', name: 'View & Edit', color: '#10b981' },
    { id: 'full', name: 'Full Access', color: '#3b82f6' }
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
          background: linear-gradient(135deg, #181818 0%, #232323 100%);
          border-radius: 16px;
          box-shadow: 0 8px 32px #FFD60033, 0 2px 12px #00000044;
          padding: 8px 12px;
          width: fit-content;
          margin-left: 0;
          border: 2px solid #FFD60022;
        }
        .modern-tab-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFD600;
          padding: 0.8rem 2.5rem;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          margin: 0 4px;
          position: relative;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-size: 0.95rem;
        }
        .modern-tab-btn.active {
          background: linear-gradient(135deg, #FFD600 0%, #FFF200 100%);
          color: #111;
          box-shadow: 0 6px 20px #FFD60055, 0 2px 8px #FFD60033;
          transform: translateY(-2px) scale(1.05);
          z-index: 2;
          border: 2px solid #FFD600;
        }
        .modern-tab-btn:not(.active):hover {
          background: linear-gradient(135deg, #232323 0%, #333 100%);
          color: #fff200;
          box-shadow: 0 4px 16px #FFD60044, 0 2px 8px #00000033;
          transform: translateY(-1px) scale(1.02);
          border: 1px solid #FFD60055;
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
        .access-control-user-card {
          transition: all 0.2s ease;
        }
        .access-control-user-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px #FFD60033;
        }
        .permission-button {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .permission-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .permission-button:active {
          transform: translateY(0);
        }
        .permissions-grid {
          max-height: 500px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .permissions-grid::-webkit-scrollbar {
          width: 6px;
        }
        .permissions-grid::-webkit-scrollbar-track {
          background: #232323;
          border-radius: 3px;
        }
        .permissions-grid::-webkit-scrollbar-thumb {
          background: #FFD600;
          border-radius: 3px;
        }
        .permissions-grid::-webkit-scrollbar-thumb:hover {
          background: #fff200;
        }
        .modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: #232323;
          border-radius: 3px;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: #FFD600;
          border-radius: 3px;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #fff200;
        }
        .modern-modal {
          max-height: 90vh !important;
          overflow-y: auto !important;
        }
        .modern-modal-popup {
          max-height: 90vh !important;
          overflow-y: auto !important;
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
        <button className={tab === 'access' ? 'modern-tab-btn active' : 'modern-tab-btn'} onClick={() => setTab('access')}>Access Control</button>
      </div>
      {tab === 'users' && (
        <>
          <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto 8px auto', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-flat"
              style={{ background: '#FFD600', color: '#111', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, padding: '10px 28px', boxShadow: '0 2px 8px #FFD60033', transition: 'background 0.2s, color 0.2s, transform 0.18s, box-shadow 0.18s' }}
              onClick={() => setShowModal(true)}
            >
              + Add User
            </button>
          </div>
          <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', background: '#111', borderRadius: 22, padding: '0.5rem 0 2.5rem 0' }}>
            <table className="modern-settings-table" style={{ width: '100%', minWidth: 1400, tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Name</th>
                  <th style={{ width: '14%' }}>Email</th>
                  <th style={{ width: '8%' }}>Type</th>
                  <th style={{ width: '10%' }}>Department</th>
                  <th style={{ width: '12%' }}>Role</th>
                  <th style={{ width: '10%' }}>Location</th>
                  <th style={{ width: '8%' }}>User Mode</th>
                  <th style={{ width: '6%' }}>Admin</th>
                  <th style={{ width: '20%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id || user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.user_type}</td>
                      <td>{user.user_type !== 'client' ? user.department : '-'}</td>
                      <td>{user.department === 'Marketing' && user.marketing_role ? user.marketing_role : '-'}</td>
                      <td>{user.user_type === 'employee' ? (user.office_location || '-') : '-'}</td>
                      <td>{user.user_type === 'employee' ? (user.is_ai_user ? 'AI User' : 'Human') : '-'}</td>
                      <td>{user.is_admin ? 'Yes' : 'No'}</td>
                      <td>
                        <button 
                          className="btn-outline"
                          onClick={() => handleEdit(user)}
                          disabled={loading}
                          style={{ marginRight: 8, fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-outline"
                          onClick={() => setShowDeleteModal(user.id)}
                          disabled={loading}
                          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modern-modal modern-modal-popup" style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)',
            border: '3px solid #FFD600',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(255, 214, 0, 0.2), 0 0 0 1px rgba(255, 214, 0, 0.1)',
            minWidth: 400,
            maxWidth: 800,
            width: '95vw',
            maxHeight: '95vh',
            color: '#FFD600',
            fontFamily: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #232323 0%, #1a1a1a 100%)', 
              borderRadius: '20px 20px 0 0', 
              padding: '2rem', 
              borderBottom: '2px solid #FFD60033',
              position: 'sticky', 
              top: 0, 
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ 
                color: '#FFD600', 
                fontWeight: 900, 
                marginBottom: 0, 
                fontSize: '2rem', 
                letterSpacing: '1px', 
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                👤 Add New User
              </h3>
              <p style={{ 
                color: '#999', 
                textAlign: 'center', 
                marginTop: '0.5rem', 
                fontSize: '1rem',
                fontWeight: 400
              }}>
                Create a new user account with appropriate permissions
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem 2rem' }} className="modal-scroll">
              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                {/* Basic Information Section */}
                <div style={{ background: '#232323', borderRadius: '16px', padding: '2rem', border: '1px solid #FFD60033' }}>
                  <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    👤 Basic Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
                      <input
                        className="modern-input"
                        type="text"
                        placeholder="Enter full name..."
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Email Address *</label>
                      <input
                        className="modern-input"
                        type="email"
                        placeholder="Enter email address..."
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Password *</label>
                      <input
                        className="modern-input"
                        type="password"
                        placeholder="Create a secure password..."
                        value={form.password}
                        onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Type Section */}
                <div style={{ background: '#232323', borderRadius: '16px', padding: '2rem', border: '1px solid #FFD60033' }}>
                  <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏢 Account Type
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>User Type *</label>
                      <select
                        className="modern-input"
                        value={form.user_type}
                        onChange={e => setForm(f => ({ ...f, user_type: e.target.value, department: '', marketing_role: '' }))}
                        required
                        style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                      >
                        <option value="employee">👨‍💼 Employee</option>
                        <option value="client">🤝 Client</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD600', fontSize: '1rem', cursor: 'pointer', fontWeight: 600, background: '#333', padding: '12px 16px', borderRadius: '12px', border: '2px solid #444', transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          checked={form.is_admin}
                          onChange={e => setForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                          style={{ width: '20px', height: '20px', accentColor: '#FFD600' }}
                        />
                        🔑 Administrator privileges
                      </label>
                    </div>
                  </div>
                </div>

                {/* Employee Details Section */}
                {form.user_type === 'employee' && (
                  <div style={{ background: '#232323', borderRadius: '16px', padding: '2rem', border: '1px solid #FFD60033' }}>
                    <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      💼 Employee Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Department *</label>
                        <select
                          className="modern-input"
                          value={form.department}
                          onChange={e => setForm(f => ({ ...f, department: e.target.value, marketing_role: '' }))}
                          required
                          style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                        >
                          <option value="">Select Department</option>
                          {departmentOptions.map(opt => (
                            <option key={opt} value={opt}>{opt === 'Marketing' ? '📈 ' + opt : opt === 'HR' ? '👥 ' + opt : opt === 'Production' ? '⚙️ ' + opt : '🏛️ ' + opt}</option>
                          ))}
                        </select>
                      </div>
                      {form.department === 'Marketing' && (
                        <div>
                          <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Marketing Role</label>
                          <select
                            className="modern-input"
                            value={form.marketing_role || ''}
                            onChange={e => setForm(f => ({ ...f, marketing_role: e.target.value }))}
                            style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                          >
                            <option value="">Select Role</option>
                            <option value="Head of Marketing">🎯 Head of Marketing</option>
                            <option value="Marketing Manager">📊 Marketing Manager</option>
                            <option value="Marketing Specialist">🔍 Marketing Specialist</option>
                            <option value="Content Creator">✍️ Content Creator</option>
                            <option value="Social Media Manager">📱 Social Media Manager</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Office Location</label>
                        <select
                          className="modern-input"
                          value={form.office_location}
                          onChange={e => setForm(f => ({ ...f, office_location: e.target.value }))}
                          style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                        >
                          <option value="">Select Location</option>
                          <option value="Bahrain">🏝️ Bahrain</option>
                          <option value="UK">🇬🇧 UK</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Working Hours</label>
                        <input
                          className="modern-input"
                          type="text"
                          placeholder="e.g., 9 AM - 5 PM, Full-time"
                          value={form.hours}
                          onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                          style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Start Date *</label>
                        <input
                          type="date"
                          value={form.start_date}
                          onChange={e => setForm({ ...form, start_date: e.target.value })}
                          className="modern-input"
                          required={form.user_type === 'employee'}
                          style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', transition: 'border-color 0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Details Section */}
                {form.user_type === 'employee' && (
                  <div style={{ background: '#232323', borderRadius: '16px', padding: '2rem', border: '1px solid #FFD60033' }}>
                    <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🎯 Professional Details
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Responsibilities</label>
                        <textarea
                          className="modern-input"
                          placeholder="Describe key responsibilities and duties..."
                          value={form.responsibilities}
                          onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))}
                          rows={4}
                          style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', resize: 'vertical', transition: 'border-color 0.2s' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Skills & Expertise</label>
                        <textarea
                          className="modern-input"
                          placeholder="List technical skills, certifications, expertise areas..."
                          value={form.skills}
                          onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                          rows={4}
                          style={{ width: '100%', background: '#111', color: '#FFD600', border: '2px solid #333', borderRadius: 12, fontSize: 16, padding: '12px 16px', resize: 'vertical', transition: 'border-color 0.2s' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD600', fontSize: '1rem', cursor: 'pointer', fontWeight: 600, background: '#333', padding: '12px 16px', borderRadius: '12px', border: '2px solid #444', transition: 'all 0.2s' }}>
                          <input
                            type="checkbox"
                            checked={form.is_ai_user}
                            onChange={e => setForm(prev => ({ ...prev, is_ai_user: e.target.checked }))}
                            style={{ width: '20px', height: '20px', accentColor: '#FFD600' }}
                          />
                          🤖 AI User (not human)
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {/* Action Buttons Section */}
                <div style={{ background: '#232323', borderRadius: '16px', padding: '2rem', border: '1px solid #FFD60033', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      type="submit"
                      disabled={loading || !form.name}
                      style={{ 
                        background: loading ? '#666' : 'linear-gradient(135deg, #FFD600 0%, #FFC107 100%)', 
                        color: '#111', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700, 
                        padding: '14px 32px', 
                        fontSize: '1.1rem', 
                        cursor: loading ? 'not-allowed' : 'pointer', 
                        boxShadow: loading ? 'none' : '0 4px 12px rgba(255, 214, 0, 0.3)',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '160px'
                      }}
                      onMouseEnter={e => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 16px rgba(255, 214, 0, 0.4)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(255, 214, 0, 0.3)';
                        }
                      }}
                    >
                      {loading ? '🔄 Adding...' : '✅ Add User'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{ 
                        background: 'transparent', 
                        color: '#FFD600', 
                        border: '2px solid #FFD600', 
                        borderRadius: '12px', 
                        fontWeight: 600, 
                        padding: '14px 32px', 
                        fontSize: '1.1rem', 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '160px'
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = '#FFD600';
                        e.target.style.color = '#111';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#FFD600';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editUser && editForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modern-modal modern-modal-popup" style={{
            background: 'linear-gradient(135deg, #181818 80%, #FFD600 100%)',
            border: '2.5px solid #FFD600',
            borderRadius: 24,
            boxShadow: '0 12px 48px #FFD60033, 0 2px 12px #FFD60022',
            padding: '2rem',
            minWidth: 340,
            maxWidth: 1100,
            width: '100%',
            maxHeight: '90vh',
            animation: 'fadeInPop 0.22s cubic-bezier(.4,1.4,.6,1) both',
            transition: 'box-shadow 0.2s, border 0.2s',
            color: '#FFD600',
            fontFamily: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#FFD600', fontWeight: 900, marginBottom: '2.2rem', fontSize: '2rem', letterSpacing: 0.5, textAlign: 'center', textShadow: '0 2px 12px #0008', position: 'sticky', top: 0, background: 'linear-gradient(135deg, #181818 80%, #FFD600 100%)', zIndex: 1, paddingBottom: '1rem' }}>Edit User</h3>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }} className="modal-scroll">
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
                      onChange={e => setEditForm(f => ({ ...f, department: e.target.value, marketing_role: '' }))}
                      required
                      style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    
                    {editForm.department === 'Marketing' && (
                      <>
                        <label style={{ color: '#FFD600', fontWeight: 600 }}>Marketing Role</label>
                        <select
                          className="modern-input"
                          value={editForm.marketing_role || ''}
                          onChange={e => setEditForm(f => ({ ...f, marketing_role: e.target.value }))}
                          style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                        >
                          <option value="">Select Role</option>
                          <option value="Head of Marketing">Head of Marketing</option>
                          <option value="Marketing Manager">Marketing Manager</option>
                          <option value="Marketing Specialist">Marketing Specialist</option>
                          <option value="Content Creator">Content Creator</option>
                          <option value="Social Media Manager">Social Media Manager</option>
                        </select>
                      </>
                    )}
                    
                    <label style={{ color: '#FFD600', fontWeight: 600 }}>Responsibilities</label>
                    <textarea
                      className="modern-input"
                      placeholder="Job responsibilities and duties..."
                      value={editForm.responsibilities}
                      onChange={e => setEditForm(f => ({ ...f, responsibilities: e.target.value }))}
                      rows={3}
                      style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0, resize: 'vertical' }}
                    />
                    
                    <label style={{ color: '#FFD600', fontWeight: 600 }}>Skills</label>
                    <textarea
                      className="modern-input"
                      placeholder="Technical skills, certifications, expertise..."
                      value={editForm.skills}
                      onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))}
                      rows={3}
                      style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0, resize: 'vertical' }}
                    />
                    
                    <label style={{ color: '#FFD600', fontWeight: 600 }}>Working Hours</label>
                    <input
                      className="modern-input"
                      type="text"
                      placeholder="e.g., 9 AM - 5 PM, Part-time, Full-time"
                      value={editForm.hours}
                      onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))}
                      style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                    />
                    
                    <label style={{ color: '#FFD600', fontWeight: 600 }}>Office Location</label>
                    <select
                      className="modern-input"
                      value={editForm.office_location}
                      onChange={e => setEditForm(f => ({ ...f, office_location: e.target.value }))}
                      style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px', marginBottom: 0 }}
                    >
                      <option value="">Select Location</option>
                      <option value="Bahrain">Bahrain</option>
                      <option value="UK">UK</option>
                    </select>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD600', fontSize: '0.98rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={editForm.is_ai_user}
                        onChange={e => setEditForm(prev => ({ ...prev, is_ai_user: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#FFD600' }}
                      />
                      AI User (not human)
                    </label>
                  </>
                )}
                <div className="form-group">
                  <label style={{ color: '#FFD600', fontWeight: 600 }}>Start Date</label>
                  <input
                    type="date"
                    value={editForm?.start_date || ''}
                    onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="modern-input"
                    required={editForm?.user_type === 'employee'}
                    style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10, fontSize: 15, padding: '10px' }}
                  />
                </div>
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
                        <td style={{ padding: '1.1rem 0.7rem' }}>{req.created_at ? new Date(req.created_at).toLocaleDateString() + ' ' + new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
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
                                  <option value="">Select Department</option>
                                  {departmentOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
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
      {/* Access Control Tab */}
      {tab === 'access' && (
        <div style={{ width: '100%', maxWidth: 1300, margin: '2.5rem auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0 24px', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '2rem', width: '100%', minHeight: '600px' }}>
            {/* User Selection Panel */}
            <div style={{ width: '300px', background: '#181818', borderRadius: '18px', border: '2px solid #FFD60044', padding: '1.5rem' }}>
              <h3 style={{ color: '#FFD600', fontWeight: 800, marginBottom: '1rem', fontSize: '1.3rem' }}>Select User</h3>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="modal-scroll">
                {users.filter(u => u.user_type === 'employee').map(user => (
                  <div
                    key={user.id || user._id}
                    onClick={() => handleUserSelect(user)}
                    className="access-control-user-card"
                    style={{
                      padding: '1rem',
                      background: selectedUser?.id === user.id ? '#FFD600' : '#232323',
                      color: selectedUser?.id === user.id ? '#111' : '#FFD600',
                      borderRadius: '10px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: selectedUser?.id === user.id ? '2px solid #FFD600' : '2px solid transparent'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.email}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user.department}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions Panel */}
            <div style={{ flex: 1, background: '#181818', borderRadius: '18px', border: '2px solid #FFD60044', padding: '1.5rem' }}>
              {selectedUser ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ color: '#FFD600', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                        Permissions for {selectedUser.name}
                      </h3>
                      <p style={{ color: '#ccc', fontSize: '0.9rem' }}>{selectedUser.email} • {selectedUser.department}</p>
                    </div>
                    <button
                      onClick={saveUserPermissions}
                      disabled={savingPermissions}
                      className="btn-flat"
                      style={{
                        background: '#FFD600',
                        color: '#111',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      {savingPermissions ? 'Saving...' : 'Save Permissions'}
                    </button>
                  </div>

                  {/* Permission Legend */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {permissionLevels.map(level => (
                      <div key={level.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: level.color
                          }}
                        />
                        <span style={{ color: '#FFD600', fontSize: '0.9rem', fontWeight: 600 }}>{level.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Permissions Grid */}
                  <div className="permissions-grid" style={{ display: 'grid', gap: '1rem' }}>
                    {availablePages.map(page => (
                      <div
                        key={page.id}
                        style={{
                          background: '#232323',
                          borderRadius: '12px',
                          padding: '1rem',
                          border: '1px solid #FFD60033'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                              {page.name}
                            </h4>
                            <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0 }}>
                              {page.description}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            {permissionLevels.map(level => (
                              <button
                                key={level.id}
                                onClick={() => updatePermission(page.id, level.id)}
                                className="permission-button"
                                style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: '8px',
                                  border: '2px solid',
                                  borderColor: userPermissions[page.id] === level.id ? level.color : '#444',
                                  background: userPermissions[page.id] === level.id ? level.color : 'transparent',
                                  color: userPermissions[page.id] === level.id ? '#fff' : level.color,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  fontSize: '0.85rem',
                                  fontWeight: 600
                                }}
                              >
                                {level.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                  <h3 style={{ color: '#FFD600', fontWeight: 700, marginBottom: '1rem' }}>Select a User</h3>
                  <p>Choose a user from the left panel to manage their page access permissions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}