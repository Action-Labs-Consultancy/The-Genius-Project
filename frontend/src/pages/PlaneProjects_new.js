// PlaneProjects.js - Plane PM Integration Component
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw, Server, Database } from 'lucide-react';
import './PlaneProjects.css';

const PlaneProjects = ({ user, onBack }) => {
  const [planeStatus, setPlaneStatus] = useState({
    backend: 'checking',
    frontend: 'checking',
    database: 'checking',
    overall: 'checking'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkPlaneServices = async () => {
    setIsRefreshing(true);
    const newStatus = {
      backend: 'checking',
      frontend: 'checking', 
      database: 'checking',
      overall: 'checking'
    };

    try {
      // Check backend (Django API on port 8000)
      const backendResponse = await fetch('http://localhost:8000/', { 
        method: 'GET',
        mode: 'no-cors' // Allow cross-origin for local development
      });
      newStatus.backend = 'running';
    } catch (error) {
      console.log('Backend check failed:', error);
      newStatus.backend = 'stopped';
    }

    try {
      // Check frontend (Next.js on port 3001)
      const frontendResponse = await fetch('http://localhost:3001/', { 
        method: 'GET',
        mode: 'no-cors'
      });
      newStatus.frontend = 'running';
    } catch (error) {
      console.log('Frontend check failed:', error);
      newStatus.frontend = 'stopped';
    }

    // For now, assume database is running if backend is running
    if (newStatus.backend === 'running') {
      newStatus.database = 'running';
    } else {
      newStatus.database = 'stopped';
    }

    // Overall status
    if (newStatus.backend === 'running') {
      newStatus.overall = 'running';
    } else {
      newStatus.overall = 'stopped';
    }

    setPlaneStatus(newStatus);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkPlaneServices();
    // Check status every 30 seconds
    const interval = setInterval(checkPlaneServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="status-icon running" />;
      case 'stopped':
        return <AlertCircle className="status-icon stopped" />;
      case 'checking':
      default:
        return <RefreshCw className="status-icon checking" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'stopped':
        return 'Stopped';
      case 'checking':
      default:
        return 'Checking...';
    }
  };

  const openPlaneInterface = () => {
    // Try frontend first, fallback to backend
    if (planeStatus.frontend === 'running') {
      window.open('http://localhost:3001', '_blank');
    } else if (planeStatus.backend === 'running') {
      window.open('http://localhost:8000', '_blank');
    } else {
      alert('Plane services are not running. Please start them first.');
    }
  };

  return (
    <div className="plane-projects-container">
      <div className="plane-header">
        <div className="plane-title">
          <h1>Plane Project Management</h1>
          <p>Local Plane instance integration</p>
        </div>
        <button 
          className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
          onClick={checkPlaneServices}
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? 'spinning' : ''} />
          Refresh Status
        </button>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <div className="status-header">
            <Server className="service-icon" />
            <span>Backend (Django)</span>
          </div>
          <div className="status-info">
            {getStatusIcon(planeStatus.backend)}
            <span className={`status-text ${planeStatus.backend}`}>
              {getStatusText(planeStatus.backend)}
            </span>
          </div>
          <div className="status-details">
            Port: 8000
          </div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <ExternalLink className="service-icon" />
            <span>Frontend (Next.js)</span>
          </div>
          <div className="status-info">
            {getStatusIcon(planeStatus.frontend)}
            <span className={`status-text ${planeStatus.frontend}`}>
              {getStatusText(planeStatus.frontend)}
            </span>
          </div>
          <div className="status-details">
            Port: 3001
          </div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <Database className="service-icon" />
            <span>Database</span>
          </div>
          <div className="status-info">
            {getStatusIcon(planeStatus.database)}
            <span className={`status-text ${planeStatus.database}`}>
              {getStatusText(planeStatus.database)}
            </span>
          </div>
          <div className="status-details">
            PostgreSQL
          </div>
        </div>
      </div>

      <div className="plane-actions">
        {planeStatus.overall === 'running' ? (
          <div className="running-state">
            <div className="success-message">
              <CheckCircle className="success-icon" />
              <span>Plane is running successfully!</span>
            </div>
            <button className="open-plane-button" onClick={openPlaneInterface}>
              <ExternalLink />
              Open Plane Interface
            </button>
            
            {/* Embedded Plane Interface */}
            <div className="plane-embed">
              <div className="embed-header">
                <h3>Plane Interface</h3>
                <button 
                  className="external-link-button"
                  onClick={openPlaneInterface}
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
              <iframe
                src={planeStatus.frontend === 'running' ? 'http://localhost:3001' : 'http://localhost:8000'}
                className="plane-iframe"
                title="Plane Project Management"
                allow="fullscreen"
              />
            </div>
          </div>
        ) : (
          <div className="setup-instructions">
            <div className="warning-message">
              <AlertCircle className="warning-icon" />
              <span>Plane services are not running</span>
            </div>
            
            <div className="instructions">
              <h3>To start Plane locally:</h3>
              <ol>
                <li>Open a terminal in the plane-local-setup directory</li>
                <li>Run: <code>docker compose up -d</code></li>
                <li>Wait for all services to start</li>
                <li>Click "Refresh Status" above</li>
              </ol>
            </div>

            <div className="docker-commands">
              <h4>Docker Commands:</h4>
              <div className="command-list">
                <div className="command-item">
                  <code>docker compose up -d</code>
                  <span>Start all services</span>
                </div>
                <div className="command-item">
                  <code>docker compose down</code>
                  <span>Stop all services</span>
                </div>
                <div className="command-item">
                  <code>docker compose ps</code>
                  <span>Check service status</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaneProjects;
