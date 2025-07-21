import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientsStore, useProjectsStore } from '../stores/authStore';
import { ArrowLeft, Plus, Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import ProjectModal from '../components/ProjectModal';
import './ClientDetailPage.css';

const ClientDetailPage = ({ user }) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentClient, loadClient, loading: clientLoading } = useClientsStore();
  const { projects, loadProjects, loading: projectsLoading } = useProjectsStore();
  const [showProjectModal, setShowProjectModal] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClient(clientId);
      loadProjects(clientId);
    }
  }, [clientId, loadClient, loadProjects]);

  const handleProjectClick = (project) => {
    navigate(`/projects/${project.id}`);
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'active': return '#FFD600';
      case 'completed': return '#4CAF50';
      case 'on_hold': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFD600';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (clientLoading || !currentClient) {
    return (
      <div className="client-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading client details...</p>
      </div>
    );
  }

  return (
    <div className="client-detail-page">
      {/* Header */}
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/clients')}
        >
          <ArrowLeft size={20} />
          Back to Clients
        </button>
        <div className="header-content">
          <div className="client-title">
            <h1>{currentClient.name}</h1>
            {currentClient.company && (
              <span className="company-name">{currentClient.company}</span>
            )}
          </div>
          <div className={`client-status ${currentClient.status}`}>
            {currentClient.status}
          </div>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="client-info-section">
        <div className="info-cards-grid">
          <div className="info-card contact">
            <h3>Contact Information</h3>
            <div className="contact-details">
              {currentClient.email && (
                <div className="contact-item">
                  <span className="label">Email:</span>
                  <a href={`mailto:${currentClient.email}`}>{currentClient.email}</a>
                </div>
              )}
              {currentClient.phone && (
                <div className="contact-item">
                  <span className="label">Phone:</span>
                  <a href={`tel:${currentClient.phone}`}>{currentClient.phone}</a>
                </div>
              )}
              {currentClient.website && (
                <div className="contact-item">
                  <span className="label">Website:</span>
                  <a href={currentClient.website} target="_blank" rel="noopener noreferrer">
                    {currentClient.website}
                  </a>
                </div>
              )}
              {currentClient.address && (
                <div className="contact-item">
                  <span className="label">Address:</span>
                  <span>{currentClient.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="info-card stats">
            <h3>Project Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{projects.length}</span>
                <span className="stat-label">Total Projects</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {projects.filter(p => p.status === 'active').length}
                </span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {projects.filter(p => p.status === 'completed').length}
                </span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="projects-section">
        <div className="section-header">
          <h2>Projects</h2>
        </div>

        {projectsLoading ? (
          <div className="projects-loading">
            <div className="loading-spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-projects">
            <div className="empty-icon">📋</div>
            <h3>No projects yet</h3>
            <p>Create your first project for {currentClient.name}</p>
            <button 
              className="add-first-project-btn"
              onClick={() => setShowProjectModal(true)}
            >
              <Plus size={20} />
              Create First Project
            </button>
          </div>
        ) : (
          <div className="projects-row-scroll">
            {projects.map(project => {
              const daysUntilDue = getDaysUntilDue(project.due_date);
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
              const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

              return (
                <div 
                  key={project.id}
                  className="project-card-horizontal"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="project-header">
                    <h3 className="project-name">{project.name}</h3>
                    <div 
                      className="project-status"
                      style={{ backgroundColor: getProjectStatusColor(project.status) }}
                    >
                      {project.status}
                    </div>
                  </div>

                  <p className="project-description">
                    {project.description || 'No description provided'}
                  </p>

                  <div className="project-meta">
                    <div className="meta-item">
                      <Calendar size={16} />
                      <span>
                        {project.due_date 
                          ? new Date(project.due_date).toLocaleDateString()
                          : 'No deadline'
                        }
                      </span>
                      {isOverdue && (
                        <span className="overdue-badge">
                          <AlertCircle size={14} />
                          {Math.abs(daysUntilDue)} days overdue
                        </span>
                      )}
                      {isUrgent && (
                        <span className="urgent-badge">
                          <Clock size={14} />
                          {daysUntilDue} days left
                        </span>
                      )}
                    </div>

                    <div className="meta-item">
                      <Users size={16} />
                      <span>
                        {project.team_members?.length || 0} team members
                      </span>
                    </div>

                    <div className="meta-item">
                      <span className="tasks-count">
                        {project.tasks_count || 0} tasks
                      </span>
                    </div>
                  </div>

                  <div className="project-team">
                    {project.team_members?.slice(0, 3).map((member, i) => (
                      <img 
                        key={i}
                        src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=FFD600&color=181818&size=32`}
                        alt={member.full_name}
                        className="team-avatar"
                        title={member.full_name}
                      />
                    ))}
                    {project.team_members?.length > 3 && (
                      <div className="team-overflow">
                        +{project.team_members.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="project-actions">
                    <button 
                      className="view-project-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project);
                      }}
                    >
                      Open Project →
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Add Project Card */}
            <div className="project-card-horizontal add-project-card" onClick={() => setShowProjectModal(true)}>
              <div className="add-project-content">
                <Plus size={32} />
                <span>Add Project</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          clientId={clientId}
          onClose={() => setShowProjectModal(false)}
          onSave={() => {
            setShowProjectModal(false);
            loadProjects(clientId); // Refresh projects
          }}
        />
      )}
    </div>
  );
};

export default ClientDetailPage;
