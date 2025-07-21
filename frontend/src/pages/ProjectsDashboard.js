import React, { useState, useEffect } from 'react';
import './ProjectsDashboard.css';

// --- Status Change Dropdown Component ---
function StatusChangeDropdown({ project, onStatusChange }) {
  const statuses = ['In Concept', 'In Planning', 'In Production', 'In Review', 'Completed'];
  return (
    <select
      value={project.status}
      onChange={e => onStatusChange(project.code, e.target.value)}
      className="status-dropdown"
      onClick={e => e.stopPropagation()}
    >
      {statuses.map(status => (
        <option key={status} value={status}>{status}</option>
      ))}
    </select>
  );
}

// --- Summary Card Component ---
function SummaryCard({ title, value, icon }) {
  return (
    <div className="summary-card">
      <div className="summary-icon">{icon}</div>
      <div className="summary-info">
        <div className="summary-value">{value}</div>
        <div className="summary-title">{title}</div>
      </div>
    </div>
  );
}

// --- Project Card Component ---
function ProjectCard({ project, onClick, onStatusChange }) {
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilDue(project.dueDate);
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-header">
        <div className="project-card-title">{project.name}</div>
        <div className="project-card-meta-top">
          <div className="project-card-id">{project.code}</div>
          <StatusChangeDropdown project={project} onStatusChange={onStatusChange} />
        </div>
      </div>
      
      <div className="project-card-team">
        {project.team.slice(0, 3).map((member, i) => (
          <img 
            key={i} 
            src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=FFD600&color=181818&size=32`} 
            alt={member.name} 
            className="team-avatar" 
            title={member.name} 
          />
        ))}
        {project.team.length > 3 && (
          <div className="team-avatar-more">+{project.team.length - 3}</div>
        )}
      </div>

      <div className="project-card-meta">
        <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
          {project.priority}
        </span>
        <div className={`project-card-due ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
          {isOverdue ? `${Math.abs(daysLeft)} days overdue` : 
           daysLeft === 0 ? 'Due today' :
           daysLeft === 1 ? 'Due tomorrow' :
           `${daysLeft} days left`}
        </div>
      </div>

      <div className="project-card-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress || 0}%` }}></div>
        </div>
        <span className="progress-text">{project.progress || 0}% complete</span>
      </div>

      <div className="project-card-actions">
        <button className="quick-action-btn" title="Request Equipment" onClick={e => { e.stopPropagation(); /* Add equipment request logic */ }}>
          📦
        </button>
        <button className="quick-action-btn" title="Add to Calendar" onClick={e => { e.stopPropagation(); /* Add calendar logic */ }}>
          📅
        </button>
        <button className="quick-action-btn" title="Team Chat" onClick={e => { e.stopPropagation(); /* Open chat */ }}>
          💬
        </button>
        <button className="quick-action-btn priority" title="View Details" onClick={e => { e.stopPropagation(); onClick(); }}>
          👁️
        </button>
      </div>

      {/* Status Change Dropdown */}
      <div className="status-change">
        <label>Status:</label>
        <select 
          value={project.status} 
          onChange={(e) => onStatusChange(project.code, e.target.value)}
          className="status-dropdown"
          onClick={(e) => e.stopPropagation()}
        >
          {['In Concept', 'In Planning', 'In Production', 'In Review', 'Completed'].map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// --- Kanban Column Component ---
function ProjectColumn({ status, projects, onCardClick, onStatusChange }) {
  return (
    <div className="project-column">
      <div className="column-header">
        <span className="column-title">{status}</span>
        <span className="column-count">{projects.length}</span>
      </div>
      <div className="column-cards">
        {projects.map(project => (
          <ProjectCard 
            key={project.code} 
            project={project} 
            onClick={() => onCardClick(project)} 
            onStatusChange={onStatusChange}
          />
        ))}
        {projects.length === 0 && (
          <div className="empty-column">No projects in this stage</div>
        )}
      </div>
    </div>
  );
}

// --- Slack-style Chat Sidebar Component ---
function ChatSidebar({ isCollapsed, onToggleCollapse }) {
  const [currentChannel, setCurrentChannel] = useState('general');
  const [messageInput, setMessageInput] = useState('');

  const channels = [
    { id: 'general', name: '# General', unread: 3 },
    { id: 'projects', name: '# Projects', unread: 0 },
    { id: 'design', name: '# Design', unread: 1 },
    { id: 'random', name: '# Random', unread: 0 }
  ];

  const messages = [
    { 
      id: 1, 
      user: 'Jane Doe', 
      avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=FFD600&color=181818&size=40',
      time: '2m ago', 
      text: "Just uploaded the latest brand concepts! 🎨",
      reactions: ['👍', '🔥']
    },
    { 
      id: 2, 
      user: 'Alex Smith', 
      avatar: 'https://ui-avatars.com/api/?name=Alex+Smith&background=FFD600&color=181818&size=40',
      time: '5m ago', 
      text: "The client wants to see color variations for the logo",
      reactions: ['👀']
    },
    { 
      id: 3, 
      user: 'Sam Wilson', 
      avatar: 'https://ui-avatars.com/api/?name=Sam+Wilson&background=FFD600&color=181818&size=40',
      time: '12m ago', 
      text: "Timeline looks good, we're on track for the deadline 📅",
      reactions: ['✅', '🚀']
    }
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Add message logic here
      setMessageInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (isCollapsed) {
    return (
      <div className="chat-sidebar-collapsed">
        <button className="chat-toggle-btn" onClick={onToggleCollapse} title="Expand Chat">
          💬
        </button>
      </div>
    );
  }

  return (
    <aside className="chat-sidebar">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-logo">💬</span>
          <h2>Team Chat</h2>
        </div>
        <button className="chat-collapse-btn" onClick={onToggleCollapse} title="Collapse Chat">
          ←
        </button>
      </div>
      
      <div className="chat-channels">
        <h3>Channels</h3>
        {channels.map(channel => (
          <div 
            key={channel.id}
            className={`chat-channel ${currentChannel === channel.id ? 'active' : ''}`}
            onClick={() => setCurrentChannel(channel.id)}
          >
            <span className="channel-name">{channel.name}</span>
            {channel.unread > 0 && (
              <span className="unread-badge">{channel.unread}</span>
            )}
          </div>
        ))}
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div className="chat-message" key={msg.id}>
            <img src={msg.avatar} alt={msg.user} className="chat-avatar" />
            <div className="message-content">
              <div className="message-header">
                <span className="chat-user">{msg.user}</span>
                <span className="chat-time">{msg.time}</span>
              </div>
              <div className="chat-text">{msg.text}</div>
              {msg.reactions && (
                <div className="message-reactions">
                  {msg.reactions.map((reaction, i) => (
                    <span key={i} className="reaction">{reaction}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <input 
          type="text" 
          placeholder={`Message #${currentChannel}`}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="chat-input"
        />
        <button className="send-btn" onClick={handleSendMessage}>
          <span>📤</span>
        </button>
      </div>
    </aside>
  );
}

// --- Enhanced Project Detail Modal ---
function ProjectDetailModal({ project, isOpen, onClose }) {
  if (!isOpen || !project) return null;

  // Sample enhanced data for the project
  const enhancedProject = {
    ...project,
    activity: [
      { icon: '📝', text: 'Jane updated project timeline', time: '2 hours ago', user: 'Jane Doe' },
      { icon: '📁', text: 'Alex uploaded design files', time: '4 hours ago', user: 'Alex Smith' },
      { icon: '✅', text: 'Sam completed research task', time: '1 day ago', user: 'Sam Wilson' },
      { icon: '💬', text: 'Team discussed next milestones', time: '2 days ago', user: 'Team' },
      { icon: '🎨', text: 'Logo concepts finalized', time: '3 days ago', user: 'Jane Doe' },
    ],
    notes: [
      { id: 1, author: 'Jane Doe', time: '2 hours ago', text: 'Client wants more color options for the brand palette. They prefer warmer tones.', avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=FFD600&color=181818&size=32' },
      { id: 2, author: 'Alex Smith', time: '1 hour ago', text: 'Working on new logo sketches based on feedback. Will have 3 variations ready by EOD.', avatar: 'https://ui-avatars.com/api/?name=Alex+Smith&background=FFD600&color=181818&size=32' },
    ],
    checklist: [
      { id: 1, text: 'Initial client consultation', done: true },
      { id: 2, text: 'Create mood board and style guide', done: true },
      { id: 3, text: 'Logo concept designs (3 variations)', done: false },
      { id: 4, text: 'Client presentation and feedback', done: false },
      { id: 5, text: 'Final logo refinements', done: false },
      { id: 6, text: 'Brand guidelines document', done: false },
    ],
    files: [
      { id: 1, name: 'Brand_Guidelines_v2.pdf', size: '2.1 MB', type: 'pdf', uploadedBy: 'Jane Doe', uploadedAt: '2 days ago' },
      { id: 2, name: 'Logo_Concepts.ai', size: '12.7 MB', type: 'ai', uploadedBy: 'Alex Smith', uploadedAt: '1 day ago' },
      { id: 3, name: 'Color_Palette.sketch', size: '3.2 MB', type: 'sketch', uploadedBy: 'Jane Doe', uploadedAt: '3 hours ago' },
    ]
  };

  return (
    <div className="modal-overlay-enhanced" onClick={onClose}>
      <div className="project-detail-modal-enhanced" onClick={e => e.stopPropagation()}>
        
        {/* Left Column - Compact Project Stats */}
        <div className="project-modal-left">
          <div className="modal-header-compact">
            <h2>{enhancedProject.name}</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Budget Card */}
          <div className="project-stat-card budget-card">
            <div className="stat-header">
              <span className="stat-icon">💰</span>
              <h3>Budget</h3>
            </div>
            <div className="stat-content">
              <div className="budget-total">${enhancedProject.budget?.total?.toLocaleString() || '0'}</div>
              <div className="budget-used">Used: ${enhancedProject.budget?.used?.toLocaleString() || '0'}</div>
              <div className="budget-progress">
                <div className="budget-bar">
                  <div 
                    className="budget-fill" 
                    style={{ width: `${((enhancedProject.budget?.used || 0) / (enhancedProject.budget?.total || 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="budget-percentage">
                  {Math.round(((enhancedProject.budget?.used || 0) / (enhancedProject.budget?.total || 1)) * 100)}% used
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="project-stat-card tasks-card">
            <div className="stat-header">
              <span className="stat-icon">✅</span>
              <h3>Tasks</h3>
            </div>
            <div className="stat-content">
              <div className="tasks-count">
                <span className="completed">{enhancedProject.tasksCompleted || 0}</span>
                <span className="separator">/</span>
                <span className="total">{enhancedProject.totalTasks || 0}</span>
              </div>
              <div className="tasks-progress">
                <div className="tasks-bar">
                  <div 
                    className="tasks-fill" 
                    style={{ width: `${((enhancedProject.tasksCompleted || 0) / (enhancedProject.totalTasks || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Card */}
          <div className="project-stat-card team-card">
            <div className="stat-header">
              <span className="stat-icon">👥</span>
              <h3>Team</h3>
            </div>
            <div className="stat-content">
              <div className="team-avatars-enhanced">
                {enhancedProject.team?.slice(0, 4).map((member, i) => (
                  <div key={i} className="team-member-item">
                    <img 
                      src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=FFD600&color=181818&size=40`} 
                      alt={member.name} 
                      className="team-avatar-enhanced"
                      title={`${member.name} - ${member.role}`}
                    />
                    <div className="member-info-compact">
                      <span className="member-name">{member.name}</span>
                      <span className="member-role">{member.role}</span>
                    </div>
                  </div>
                ))}
                {enhancedProject.team?.length > 4 && (
                  <div className="team-overflow">+{enhancedProject.team.length - 4} more</div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="project-stat-card timeline-card">
            <div className="stat-header">
              <span className="stat-icon">📅</span>
              <h3>Timeline</h3>
            </div>
            <div className="stat-content">
              <div className="timeline-dates">
                <div className="date-item">
                  <span className="date-label">Start</span>
                  <span className="date-value">{enhancedProject.startDate}</span>
                </div>
                <div className="date-item">
                  <span className="date-label">Due</span>
                  <span className="date-value">{enhancedProject.dueDate}</span>
                </div>
              </div>
              <div className="timeline-progress">
                <div className="timeline-bar">
                  <div 
                    className="timeline-fill" 
                    style={{ width: `${enhancedProject.progress || 0}%` }}
                  ></div>
                </div>
                <span className="timeline-percentage">{enhancedProject.progress || 0}% complete</span>
              </div>
            </div>
          </div>

          {/* Files Card */}
          <div className="project-stat-card files-card">
            <div className="stat-header">
              <span className="stat-icon">📎</span>
              <h3>Files</h3>
            </div>
            <div className="stat-content">
              {enhancedProject.files?.map(file => (
                <div key={file.id} className="file-item-compact">
                  <div className="file-icon">
                    {file.type === 'pdf' ? '📄' : file.type === 'ai' ? '🎨' : '📁'}
                  </div>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">{file.size} • {file.uploadedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Notes */}
        <div className="project-modal-right">
          <div className="project-header-enhanced">
            <div className="project-title-row">
              <span className={`status-badge-enhanced status-${enhancedProject.status?.toLowerCase().replace(' ', '-')}`}>
                {enhancedProject.status}
              </span>
              <div className="project-tags-enhanced">
                {enhancedProject.tags?.map(tag => (
                  <span key={tag} className="tag-enhanced">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="activity-section-enhanced">
            <h3>
              <span className="section-icon">📊</span>
              Recent Activity
            </h3>
            <div className="activity-feed-enhanced">
              {enhancedProject.activity?.map((activity, i) => (
                <div key={i} className="activity-item-enhanced">
                  <span className="activity-icon-enhanced">{activity.icon}</span>
                  <div className="activity-content-enhanced">
                    <span className="activity-text">{activity.text}</span>
                    <div className="activity-meta">
                      <span className="activity-user">{activity.user}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Notes Section */}
          <div className="notes-section-enhanced">
            <h3>
              <span className="section-icon">💭</span>
              Internal Notes
            </h3>
            <div className="notes-feed">
              {enhancedProject.notes?.map(note => (
                <div key={note.id} className="note-item-enhanced">
                  <img src={note.avatar} alt={note.author} className="note-avatar" />
                  <div className="note-content">
                    <div className="note-header">
                      <span className="note-author">{note.author}</span>
                      <span className="note-time">{note.time}</span>
                    </div>
                    <div className="note-text">{note.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="add-note-enhanced">
              <input type="text" placeholder="Add an internal note..." className="note-input" />
              <button className="note-submit-btn">Post</button>
            </div>
          </div>

          {/* Checklist Section */}
          <div className="checklist-section-enhanced">
            <h3>
              <span className="section-icon">☑️</span>
              Project Checklist
            </h3>
            <div className="checklist-enhanced">
              {enhancedProject.checklist?.map(item => (
                <label key={item.id} className={`checklist-item ${item.done ? 'completed' : ''}`}>
                  <input type="checkbox" checked={item.done} readOnly />
                  <span className="checkmark"></span>
                  <span className="checklist-text">{item.text}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- New Project Modal Component ---
function NewProjectModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    priority: 'MEDIUM',
    startDate: '',
    dueDate: '',
    team: [],
    tags: []
  });

  const [currentTag, setCurrentTag] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, currentTag.trim()] 
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.client && formData.dueDate) {
      // Generate project code
      const projectCode = `${formData.name.substring(0, 2).toUpperCase()}-2025-${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;
      
      const newProject = {
        ...formData,
        code: projectCode,
        status: 'In Concept',
        progress: 0,
        team: [
          { name: 'Current User', role: 'Project Lead', avatar: null }
        ],
        budget: { total: 0, used: 0 },
        tasksCompleted: 0,
        totalTasks: 0
      };
      
      onSave(newProject);
      setFormData({
        name: '',
        client: '',
        description: '',
        priority: 'MEDIUM',
        startDate: '',
        dueDate: '',
        team: [],
        tags: []
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="new-project-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="new-project-form">
          <div className="form-row">
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="form-group">
              <label>Client *</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => handleInputChange('client', e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the project goals and deliverables"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <div className="tags-display">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag-item">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <div className="tag-add">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button type="button" onClick={addTag}>Add</button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="yellow-btn">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Projects Dashboard Component ---
export default function ProjectsDashboard({ user, onNavigate }) {
  const [view, setView] = useState('overview'); // 'overview' or 'detail'
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Sample data - replace with API calls
  const [projects, setProjects] = useState([
    {
      code: 'BR-2025-07',
      name: 'Brand Identity Refresh',
      status: 'In Planning',
      priority: 'HIGH',
      dueDate: '2025-08-15',
      startDate: '2025-07-01',
      client: 'Acme Corp',
      progress: 35,
      team: [
        { name: 'Jane Doe', role: 'Project Manager', avatar: null },
        { name: 'Alex Smith', role: 'Designer', avatar: null },
        { name: 'Sam Wilson', role: 'Developer', avatar: null }
      ],
      budget: { total: 50000, used: 23000 },
      tasksCompleted: 4,
      totalTasks: 12,
      tags: ['Campaign', 'Design', 'Brand'],
      activity: [
        { icon: '📝', text: 'Jane updated project timeline', time: '2 hours ago', user: 'Jane Doe' },
        { icon: '📁', text: 'Alex uploaded design files', time: '4 hours ago', user: 'Alex Smith' },
        { icon: '✅', text: 'Sam completed research task', time: '1 day ago', user: 'Sam Wilson' },
        { icon: '💬', text: 'Team discussed next milestones', time: '2 days ago', user: 'Team' },
        { icon: '🎨', text: 'Logo concepts finalized', time: '3 days ago', user: 'Jane Doe' },
      ],
      notes: [
        { id: 1, author: 'Jane Doe', time: '2 hours ago', text: 'Client wants more color options for the brand palette. They prefer warmer tones.', avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=FFD600&color=181818&size=32' },
        { id: 2, author: 'Alex Smith', time: '1 hour ago', text: 'Working on new logo sketches based on feedback. Will have 3 variations ready by EOD.', avatar: 'https://ui-avatars.com/api/?name=Alex+Smith&background=FFD600&color=181818&size=32' },
      ],
      checklist: [
        { id: 1, text: 'Initial client consultation', done: true },
        { id: 2, text: 'Create mood board and style guide', done: true },
        { id: 3, text: 'Logo concept designs (3 variations)', done: false },
        { id: 4, text: 'Client presentation and feedback', done: false },
        { id: 5, text: 'Final logo refinements', done: false },
        { id: 6, text: 'Brand guidelines document', done: false },
      ],
      files: [
        { id: 1, name: 'Brand_Guidelines_v2.pdf', size: '2.1 MB', type: 'pdf', uploadedBy: 'Jane Doe', uploadedAt: '2 days ago' },
        { id: 2, name: 'Logo_Concepts.ai', size: '12.7 MB', type: 'ai', uploadedBy: 'Alex Smith', uploadedAt: '1 day ago' },
        { id: 3, name: 'Color_Palette.sketch', size: '3.2 MB', type: 'sketch', uploadedBy: 'Jane Doe', uploadedAt: '3 hours ago' },
      ]
    },
    {
      code: 'WD-2025-03',
      name: 'Website Redesign',
      status: 'In Production',
      priority: 'MEDIUM',
      dueDate: '2025-09-01',
      startDate: '2025-06-15',
      client: 'TechStart Inc',
      progress: 65,
      team: [
        { name: 'Mike Johnson', role: 'Lead Dev', avatar: null },
        { name: 'Sarah Chen', role: 'UX Designer', avatar: null }
      ],
      budget: { total: 35000, used: 18000 },
      tasksCompleted: 8,
      totalTasks: 15,
      tags: ['Development', 'Design'],
      activity: [
        { icon: '💻', text: 'Mike deployed staging version', time: '1 hour ago', user: 'Mike Johnson' },
        { icon: '🎨', text: 'Sarah finalized mobile mockups', time: '3 hours ago', user: 'Sarah Chen' },
        { icon: '🔧', text: 'Backend API integration completed', time: '6 hours ago', user: 'Mike Johnson' },
      ],
      notes: [
        { id: 1, author: 'Mike Johnson', time: '1 hour ago', text: 'Staging environment is ready for client review. All major features implemented.', avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=FFD600&color=181818&size=32' },
      ],
      checklist: [
        { id: 1, text: 'Requirements gathering', done: true },
        { id: 2, text: 'Wireframes and mockups', done: true },
        { id: 3, text: 'Frontend development', done: true },
        { id: 4, text: 'Backend development', done: true },
        { id: 5, text: 'Mobile responsiveness', done: false },
        { id: 6, text: 'Client testing and feedback', done: false },
      ],
      files: [
        { id: 1, name: 'Design_System.fig', size: '5.8 MB', type: 'figma', uploadedBy: 'Sarah Chen', uploadedAt: '1 week ago' },
        { id: 2, name: 'Mobile_Mockups.sketch', size: '8.2 MB', type: 'sketch', uploadedBy: 'Sarah Chen', uploadedAt: '3 hours ago' },
      ]
    },
    {
      code: 'AD-2025-11',
      name: 'Summer Campaign',
      status: 'In Review',
      priority: 'HIGH',
      dueDate: '2025-07-30',
      startDate: '2025-06-01',
      client: 'Fashion Co',
      progress: 90,
      team: [
        { name: 'Lisa Park', role: 'Creative Director', avatar: null },
        { name: 'Tom Brown', role: 'Copywriter', avatar: null },
        { name: 'Emma Davis', role: 'Designer', avatar: null }
      ],
      budget: { total: 75000, used: 68000 },
      tasksCompleted: 18,
      totalTasks: 20
    },
    {
      code: 'VS-2025-05',
      name: 'Product Video',
      status: 'Completed',
      priority: 'MEDIUM',
      dueDate: '2025-07-15',
      startDate: '2025-06-01',
      client: 'GadgetPro',
      progress: 100,
      team: [
        { name: 'Chris Lee', role: 'Video Producer', avatar: null },
        { name: 'Ana Rodriguez', role: 'Editor', avatar: null }
      ],
      budget: { total: 25000, used: 24500 },
      tasksCompleted: 10,
      totalTasks: 10
    },
    {
      code: 'LU-2025-02',
      name: 'Logo Update',
      status: 'In Concept',
      priority: 'LOW',
      dueDate: '2025-08-30',
      startDate: '2025-07-20',
      client: 'Local Cafe',
      progress: 15,
      team: [
        { name: 'Rachel Green', role: 'Designer', avatar: null }
      ],
      budget: { total: 8000, used: 1200 },
      tasksCompleted: 1,
      totalTasks: 6
    }
  ]);

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || project.tags?.includes(filterDepartment);
    const matchesStatus = !filterStatus || project.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Group projects by status
  const statusColumns = ['In Concept', 'In Planning', 'In Production', 'In Review', 'Completed'];
  const groupedProjects = statusColumns.map(status => ({
    status,
    projects: filteredProjects.filter(p => p.status === status)
  }));

  // Calculate summary stats
  const summaryStats = [
    { 
      title: 'Active Projects', 
      value: projects.filter(p => !['Completed', 'Cancelled'].includes(p.status)).length,
      icon: '🚀'
    },
    { 
      title: 'In Production', 
      value: projects.filter(p => p.status === 'In Production').length,
      icon: '⚡'
    },
    { 
      title: 'Ready for Review', 
      value: projects.filter(p => p.status === 'In Review').length,
      icon: '👀'
    },
    { 
      title: 'Completed This Quarter', 
      value: projects.filter(p => p.status === 'Completed').length,
      icon: '✅'
    }
  ];

  const handleCardClick = (project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedProject(null);
  };

  const handleNewProject = () => {
    setShowNewProjectModal(true);
  };

  const handleSaveNewProject = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setShowNewProjectModal(false);
  };

  const handleStatusChange = (projectCode, newStatus) => {
    setProjects(prev => prev.map(project => 
      project.code === projectCode 
        ? { ...project, status: newStatus }
        : project
    ));
  };

  return (
    <div className="dashboard-root">
      {/* Slack-style Chat Sidebar - Always Visible */}
      <ChatSidebar 
        isCollapsed={chatCollapsed}
        onToggleCollapse={() => setChatCollapsed(!chatCollapsed)}
      />

      {/* Main Dashboard Content */}
      <div className="projects-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Projects Dashboard</h1>
          <button className="new-project-btn" onClick={() => setShowNewProjectModal(true)}>+ New Project</button>
        </div>

        {/* Summary Cards */}
        <div className="summary-section">
          {summaryStats.map(stat => (
            <SummaryCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <select 
              value={filterDepartment} 
              onChange={e => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="">All Departments</option>
              <option value="Campaign">Campaign</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Video">Video</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="In Concept">In Concept</option>
              <option value="In Planning">In Planning</option>
              <option value="In Production">In Production</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
            </select>

            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <div className="kanban-board">
          {groupedProjects.map(column => (
            <ProjectColumn
              key={column.status}
              status={column.status}
              projects={column.projects}
              onCardClick={handleCardClick}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        {/* Project Detail Modal */}
        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          onClose={handleCloseModal}
        />

        {/* New Project Modal */}
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onSave={handleSaveNewProject}
        />
      </div>
    </div>
  );
}
