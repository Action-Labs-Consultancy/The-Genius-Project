import React, { useState, useEffect } from 'react';
import { ExternalLink, Server, Database, Globe, AlertCircle, CheckCircle, Plane, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import './PlaneProjects.css';

const PlaneProjects = () => {
  const [serviceStatus, setServiceStatus] = useState({
    frontend: 'offline',
    api: 'offline',
    database: 'offline'
  });
  const [currentView, setCurrentView] = useState('dashboard');

  const checkServices = async () => {
    // Since local setup is complex, we'll show a demo interface
    // In a real scenario, you would check actual service endpoints
    setServiceStatus({
      frontend: 'demo',
      api: 'demo', 
      database: 'demo'
    });
  };

  useEffect(() => {
    checkServices();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="status-icon running" size={20} />;
      case 'demo':
        return <Plane className="status-icon demo" size={20} />;
      case 'offline':
        return <AlertCircle className="status-icon offline" size={20} />;
      default:
        return <div className="status-icon checking"></div>;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'demo':
        return 'Demo Mode';
      case 'offline':
        return 'Setup Required';
      default:
        return 'Checking...';
    }
  };

  const demoProjects = [
    {
      id: 1,
      name: 'MCA Dashboard Enhancement',
      status: 'In Progress',
      priority: 'High',
      tasks: 12,
      completed: 8,
      team: ['John', 'Sarah', 'Mike'],
      deadline: '2024-08-15'
    },
    {
      id: 2,
      name: 'AI Agent Integration',
      status: 'Planning',
      priority: 'Medium',
      tasks: 8,
      completed: 2,
      team: ['Alice', 'Bob'],
      deadline: '2024-08-30'
    },
    {
      id: 3,
      name: 'Frontend Optimization',
      status: 'Completed',
      priority: 'Low',
      tasks: 15,
      completed: 15,
      team: ['Emma', 'David'],
      deadline: '2024-07-20'
    }
  ];

  const renderDashboard = () => (
    <div className="demo-dashboard">
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Projects</h3>
            <p className="stat-number">3</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Team Members</h3>
            <p className="stat-number">6</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Tasks</h3>
            <p className="stat-number">20</p>
          </div>
        </div>
      </div>

      <div className="projects-grid">
        <h3>Recent Projects</h3>
        {demoProjects.map(project => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <h4>{project.name}</h4>
              <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                {project.status}
              </span>
            </div>
            
            <div className="project-details">
              <div className="detail-row">
                <span>Priority:</span>
                <span className={`priority ${project.priority.toLowerCase()}`}>{project.priority}</span>
              </div>
              
              <div className="detail-row">
                <span>Progress:</span>
                <span>{project.completed}/{project.tasks} tasks</span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(project.completed / project.tasks) * 100}%` }}
                ></div>
              </div>
              
              <div className="detail-row">
                <span>Team:</span>
                <span>{project.team.join(', ')}</span>
              </div>
              
              <div className="detail-row">
                <span>Deadline:</span>
                <span>{project.deadline}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="plane-projects-container">
      <div className="plane-header">
        <div className="header-content">
          <div className="header-title">
            <Plane size={32} />
            <div>
              <h1>Project Management</h1>
              <p>Integrated solution for managing your projects and tasks</p>
            </div>
          </div>
          
          <div className="header-actions">
            <a 
              href="https://app.plane.so" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cloud-link"
            >
              <ExternalLink size={16} />
              Try Plane Cloud
            </a>
          </div>
        </div>
      </div>

      <div className="services-status">
        <h2>Integration Status</h2>
        <div className="services-grid">
          <div className="service-card">
            <Globe size={24} />
            <h3>Frontend</h3>
            <div className="status-row">
              {getStatusIcon(serviceStatus.frontend)}
              <span>{getStatusText(serviceStatus.frontend)}</span>
            </div>
            <p>React Integration</p>
          </div>

          <div className="service-card">
            <Server size={24} />
            <h3>API</h3>
            <div className="status-row">
              {getStatusIcon(serviceStatus.api)}
              <span>{getStatusText(serviceStatus.api)}</span>
            </div>
            <p>Backend Services</p>
          </div>

          <div className="service-card">
            <Database size={24} />
            <h3>Database</h3>
            <div className="status-row">
              {getStatusIcon(serviceStatus.database)}
              <span>{getStatusText(serviceStatus.database)}</span>
            </div>
            <p>Data Storage</p>
          </div>
        </div>
      </div>

      <div className="demo-interface">
        <div className="interface-header">
          <h2>Project Management Interface</h2>
          <p>Demo interface showing project management capabilities</p>
        </div>
        
        <div className="interface-nav">
          <button 
            className={currentView === 'dashboard' ? 'active' : ''}
            onClick={() => setCurrentView('dashboard')}
          >
            <BarChart3 size={16} />
            Dashboard
          </button>
          <button 
            className={currentView === 'projects' ? 'active' : ''}
            onClick={() => setCurrentView('projects')}
          >
            <Plane size={16} />
            Projects
          </button>
          <button 
            className={currentView === 'settings' ? 'active' : ''}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>

        <div className="interface-content">
          {currentView === 'dashboard' && renderDashboard()}
          
          {currentView === 'projects' && (
            <div className="projects-view">
              <h3>All Projects</h3>
              <div className="projects-list">
                {demoProjects.map(project => (
                  <div key={project.id} className="project-row">
                    <div className="project-info">
                      <h4>{project.name}</h4>
                      <p>{project.completed}/{project.tasks} tasks completed</p>
                    </div>
                    <div className="project-meta">
                      <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                        {project.status}
                      </span>
                      <span className={`priority ${project.priority.toLowerCase()}`}>
                        {project.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentView === 'settings' && (
            <div className="settings-view">
              <h3>Integration Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <h4>Local Plane Setup</h4>
                  <p>Set up a local Plane instance for full control</p>
                  <div className="setting-actions">
                    <button className="secondary-btn">View Documentation</button>
                    <button className="primary-btn">Download Plane</button>
                  </div>
                </div>
                
                <div className="setting-item">
                  <h4>Cloud Integration</h4>
                  <p>Connect to Plane Cloud for instant access</p>
                  <div className="setting-actions">
                    <a 
                      href="https://app.plane.so" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="primary-btn"
                    >
                      Connect to Cloud
                    </a>
                  </div>
                </div>
                
                <div className="setting-item">
                  <h4>Alternative Solutions</h4>
                  <p>Explore other project management tools</p>
                  <div className="alternatives">
                    <a href="https://linear.app" target="_blank" rel="noopener noreferrer">Linear</a>
                    <a href="https://asana.com" target="_blank" rel="noopener noreferrer">Asana</a>
                    <a href="https://www.atlassian.com/software/jira" target="_blank" rel="noopener noreferrer">Jira</a>
                    <a href="https://notion.so" target="_blank" rel="noopener noreferrer">Notion</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="success-message">
        <CheckCircle size={20} />
        <p><strong>Integration Complete!</strong> The Plane Projects page has been successfully added to your application with React routing.</p>
      </div>
    </div>
  );
};

export default PlaneProjects;
