import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  FolderOpen, 
  Settings, 
  LogOut, 
  User,
  Users,
  Workflow
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'workflow', label: 'Workflow Builder', icon: Workflow, path: '/workflow' },
    { id: 'clients', label: 'Clients', icon: Building2, path: '/clients' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, path: '/projects' }
  ];

  // Admin/HR only items
  if (user?.role === 'admin' || user?.role === 'hr') {
    menuItems.push(
      { id: 'users', label: 'Users', icon: Users, path: '/users' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
    );
  }

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <FolderOpen className="logo-icon" />
          <span className="logo-text">ProjectHub</span>
        </div>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <Icon className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <User className="avatar-icon" />
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role">{user?.role || 'employee'}</span>
          </div>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut className="logout-icon" />
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
