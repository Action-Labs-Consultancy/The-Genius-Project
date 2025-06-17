import React from 'react';
import './styles.css';

export default function Dashboard({ email, isAdmin, onNavigate }) {
  return (
    <div className="portal-layout fade-in">
      <aside className="sidebar active">
        <div className="sidebar-header">
          <div className="studio-logo">
            <div className="logo-icon">
              <i className="fas fa-video"></i>
            </div>
            <div className="studio-name">Creative Studio</div>
          </div>
          <div className="client-badge">
            <div className="client-avatar">AC</div>
            <div className="client-info">
              <h4>Acme Corporation</h4>
              <p>Q1 Brand Campaign</p>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Overview</div>
            <button className="nav-item active">
              <i className="fas fa-chart-bar"></i> 
              Dashboard
            </button>
            <button className="nav-item">
              <i className="fas fa-tasks"></i> 
              My Projects
              <span className="nav-badge">8</span>
            </button>
            <button className="nav-item">
              <i className="fas fa-folder"></i> 
              Assets
            </button>
            <button className="nav-item">
              <i className="fas fa-calendar"></i> 
              Schedule
            </button>
          </div>
          
          <div className="nav-section">
            <div className="nav-section-title">Management</div>
            <button className="nav-item">
              <i className="fas fa-users"></i> 
              Team
            </button>
            <button className="nav-item">
              <i className="fas fa-chart-line"></i> 
              Analytics
            </button>
            {isAdmin && (
              <button
                className="nav-item"
                onClick={() => onNavigate('settings')}
              >
                <i className="fas fa-cog"></i> 
                Settings
              </button>
            )}
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div className="page-title">
            <h1>Dashboard</h1>
            <div className="breadcrumb">Home / Dashboard</div>
          </div>
        </header>
        
        <div className="content-body">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-title">
                  <i className="fas fa-project-diagram"></i>
                  Active Projects
                </div>
              </div>
              <div className="stat-value">8</div>
              <div className="stat-change positive">
                <i className="fas fa-arrow-up"></i>
                +2 this month
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-title">
                  <i className="fas fa-check-circle"></i>
                  Completed Tasks
                </div>
              </div>
              <div className="stat-value">24</div>
              <div className="stat-change positive">
                <i className="fas fa-arrow-up"></i>
                +12 this week
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-title">
                  <i className="fas fa-clock"></i>
                  Hours Logged
                </div>
              </div>
              <div className="stat-value">156</div>
              <div className="stat-change positive">
                <i className="fas fa-arrow-up"></i>
                +8% this month
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-title">
                  <i className="fas fa-users"></i>
                  Team Members
                </div>
              </div>
              <div className="stat-value">12</div>
              <div className="stat-change">
                <i className="fas fa-minus"></i>
                No change
              </div>
            </div>
          </div>
          
          <div className="recent-activity" style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              color: 'var(--text-primary)',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              Recent Activity
            </h3>
            <div style={{ color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '1rem' }}>
                <i className="fas fa-plus-circle" style={{ color: 'var(--success-color)', marginRight: '0.5rem' }}></i>
                New project "Summer Campaign" created
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--success-color)', marginRight: '0.5rem' }}></i>
                Task "Logo Design" completed
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <i className="fas fa-user-plus" style={{ color: 'var(--accent-color)', marginRight: '0.5rem' }}></i>
                New team member added
              </p>
              <p>
                <i className="fas fa-file-upload" style={{ color: 'var(--warning-color)', marginRight: '0.5rem' }}></i>
                Assets uploaded to project folder
              </p>
            </div>
          </div>
          
          <div className="logged-in-as">
            Logged in as <strong style={{ color: 'var(--accent-color)' }}>{email}</strong>
            {isAdmin && (
              <span style={{ 
                marginLeft: '1rem',
                padding: '0.25rem 0.5rem',
                background: 'var(--accent-secondary)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                ADMIN
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}