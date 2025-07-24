import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  FolderOpen, 
  Settings, 
  LogOut, 
  User,
  Users,
  Workflow,
  Brain,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'workflow', label: 'Workflow Builder', icon: Workflow, path: '/workflow' },
    { id: 'ai-brains', label: 'AI Brains', icon: Brain, path: '/ai-brains' },
    { id: 'clients', label: 'Clients', icon: Building2, path: '/clients' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, path: '/projects' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  // Admin/HR only items
  if (user?.role === 'admin' || user?.role === 'hr') {
    menuItems.push(
      { id: 'activity-logs', label: 'Activity Logs', icon: Activity, path: '/activity-logs' },
      { id: 'users', label: 'Users', icon: Users, path: '/users' }
    );
  }

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <FolderOpen className="logo-icon" />
          {!isCollapsed && <span className="logo-text">ProjectHub</span>}
        </div>
        <button className="collapse-btn" onClick={toggleCollapse}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
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
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="sidebar-icon" />
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <User className="avatar-icon" />
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'employee'}</span>
            </div>
          )}
        </div>
        
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut className="logout-icon" />
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
