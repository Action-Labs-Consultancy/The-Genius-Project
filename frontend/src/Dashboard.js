import React from 'react';
import './styles.css';

export default function Dashboard({ email }) {
  return (
    <div className="portal-layout">
      {/* Sidebar */}
      <aside className="sidebar active" id="sidebar">
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
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="page-title">
            <h1>Dashboard</h1>
            <div className="breadcrumb">Home / Dashboard</div>
          </div>
        </header>

        <div className="content-body">
          <div className="dashboard-grid">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-title">
                    <i className="fas fa-tasks"></i>
                    Active Projects
                  </div>
                </div>
                <div className="stat-value">8</div>
                <div className="stat-change positive">
                  <i className="fas fa-arrow-up"></i>
                  +2 this week
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-title">
                    <i className="fas fa-clock"></i>
                    In Production
                  </div>
                </div>
                <div className="stat-value">3</div>
                <div className="stat-change positive">
                  <i className="fas fa-arrow-up"></i>
                  On schedule
                </div>
              </div>
            </div>

            <p style={{ marginTop: '2rem', color: '#aaa' }}>
              Logged in as <strong>{email}</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
