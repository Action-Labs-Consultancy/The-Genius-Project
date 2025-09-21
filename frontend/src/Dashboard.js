import React, { useState } from 'react';
import './styles.css';
import MeetingsCalendar from './MeetingsCalendar';

const getModules = (user) => {
  const baseModules = [
    { id: 'brains', title: 'AI Brains', icon: '🧠' },
    { id: 'mca-brains', title: 'MCA Brain System', icon: '🧬' },
    { id: 'marketing-lab', title: 'Marketing AI Lab', icon: '🚀' },
    { id: 'due-diligence', title: 'Due Diligence Generator', icon: '📋' },
    { id: 'components', title: 'Reforge Growth Dashboard', icon: '📊' },
    { id: 'folders', title: 'Project Folders', icon: '📁' },
    { id: 'n8n-automation', title: 'n8n Automation', icon: '⚡' },
    { id: 'taiga-pm', title: 'Taiga PM', icon: '📋' },
    { id: 'my-tasks', title: 'My Tasks', icon: '✅' },
    { id: 'chat', title: 'Chat', icon: '💬' },
    { id: 'llama-rag', title: 'Llama Chat', icon: '🦙' },
    { id: 'workflow-canvas', title: 'Workflow Canvas', icon: '🎨' },
    { id: 'spend-tracker', title: 'Spend Tracker', icon: '💸' },
    { id: 'weeklyStandup', title: 'Weekly Standup', icon: '📅' },
    { id: 'clients', title: 'Clients', icon: '👥' },
    { id: 'newsFeed', title: 'News Feed', icon: '📰' },
    { id: 'notes', title: 'Notes', icon: '📝' },
    { id: 'bookmarks', title: 'Bookmarks', icon: '🔖' },
    { id: 'calendar', title: 'Calendar', icon: '📆' },
    { id: 'leaveboard', title: 'LeaveBoard', icon: '🏖️' },
    // Removed projects tab
  ];

  // Add equipment options based on user role
  if (user?.is_admin) {
    baseModules.push({ id: 'equipment', title: 'Equipment Management', icon: '📦' });
  }
  baseModules.push({ id: 'equipment-request', title: 'Request Equipment', icon: '📋' });

  // Add HR-specific modules
  if (user?.is_admin || user?.department === 'HR' || user?.role === 'hr') {
    baseModules.push({ id: 'requests', title: 'Client Requests', icon: '📋' });
    baseModules.push({ id: 'hr/client-requests', title: 'HR Client Approval', icon: '✅' });
  }

  // Add feature request modules
  baseModules.push(
    { id: 'submit-request', title: 'Submit Request', icon: '💡' }
  );

  // Add admin feature request dashboard
  if (user?.is_admin || user?.role === 'admin') {
    baseModules.push({ id: 'ice-box', title: 'Ice Box 🧊', icon: '🧊' });
  }

  return baseModules;
};

export default function Dashboard({ user, onNavigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinned, setPinned] = useState([]);
  const [ideaInput, setIdeaInput] = useState('');
  const [search, setSearch] = useState('');

  const MODULES = getModules(user);
  
  // Debug: Log all modules
  console.log('Dashboard modules:', MODULES.map(m => m.title));

  const handleDrop = (e) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData('module');
    if (moduleId && !pinned.includes(moduleId)) {
      setPinned((prev) => [...prev, moduleId]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleIdeaSubmit = () => {
    if (ideaInput.trim()) {
      alert(`Idea submitted: ${ideaInput}. AI is processing... (Feature coming soon!)`);
      setIdeaInput('');
    }
  };

  const handleModuleClick = (id) => {
    console.log('Module clicked:', id); // Debug log
    if (id === 'brains') {
      // Navigate to the new AI Brains page
      if (typeof onNavigate === 'function') onNavigate('/brains');
    } else if (id === 'mca-brains') {
      // Navigate to the MCA Brain System page
      if (typeof onNavigate === 'function') onNavigate('/mca-brains');
    } else if (id === 'marketing-lab') {
      // Navigate to the Marketing AI Tasks Lab
      if (typeof onNavigate === 'function') onNavigate('/marketing-lab');
    } else if (id === 'due-diligence') {
      // Navigate to the Due Diligence Generator page
      if (typeof onNavigate === 'function') onNavigate('/due-diligence');
    } else if (id === 'components') {
      // Navigate to the Reforge Growth Dashboard
      if (typeof onNavigate === 'function') onNavigate('/components');
    } else if (id === 'folders') {
      // Navigate to the Project Folders Explorer
      if (typeof onNavigate === 'function') onNavigate('/folders');
    } else if (id === 'n8n-automation') {
      // Open n8n automation platform in new tab
      console.log('Opening n8n at http://localhost:5678');
      window.open('http://localhost:5678', '_blank');
    } else if (id === 'taiga-pm') {
      // Open Taiga PM in new tab
      console.log('Opening Taiga PM at http://localhost:9000');
      window.open('http://localhost:9000', '_blank');
    } else if (id === 'my-tasks') {
      // Navigate to the My Tasks page
      if (typeof onNavigate === 'function') onNavigate('/my-tasks');
    } else if (id === 'llama-rag') {
      // Navigate to the RAG Chat page
      if (typeof onNavigate === 'function') onNavigate('/llama-rag');
    } else if (id === 'workflow-canvas') {
      // Navigate to the Workflow Canvas page
      if (typeof onNavigate === 'function') onNavigate('/workflow-canvas');
    } else if (id === 'calendar') {
      // Switch to the calendar view in App.js
      if (typeof onNavigate === 'function') onNavigate('/calendar');
    } else if (id === 'weeklyStandup') {
      if (typeof onNavigate === 'function') onNavigate('/weekly-standup');
    } else if (id === 'data-dashboard') {
      if (typeof onNavigate === 'function') onNavigate('/data-dashboard');
    } else if (id === 'leaveboard') {
      if (typeof onNavigate === 'function') onNavigate('/leaveboard');
    } else if (id === 'equipment') {
      if (typeof onNavigate === 'function') onNavigate('/equipment');
    } else if (id === 'equipment-request') {
      if (typeof onNavigate === 'function') onNavigate('/equipment-request');
    } else if (id === 'requests') {
      if (typeof onNavigate === 'function') onNavigate('/requests');
    } else if (id === 'submit-request') {
      if (typeof onNavigate === 'function') onNavigate('/submit-request');
    } else if (id === 'ice-box') {
      if (typeof onNavigate === 'function') onNavigate('/ice-box');
    } else if (id === 'admin/requests') {
      if (typeof onNavigate === 'function') onNavigate('/admin/requests');
    } else if (id === 'hr/client-requests') {
      if (typeof onNavigate === 'function') onNavigate('/hr/client-requests');
    } else {
      onNavigate(`/${id}`);
    }
  };

  const handleQuickLaunch = (id) => {
    alert(`Quick launching ${MODULES.find((m) => m.id === id)?.title}... (Feature coming soon!)`);
  };

  return (
    <div className="dashboard-page-new" style={{ height: '100vh', overflow: 'hidden', background: '#111' }}>
      <main className="dashboard-main" style={{ height: '100vh' }}>
        <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`} style={{ minHeight: '92vh', background: '#181818', borderRight: '2px solid #FFD600', boxShadow: sidebarOpen ? '4px 0 24px #FFD60022' : 'none', transition: 'all 0.22s cubic-bezier(.4,1.4,.6,1)' }}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)}
            style={{
              background: 'transparent',
              color: '#FFD600',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              margin: '18px 0',
              padding: '8px 18px',
              boxShadow: 'none',
              transition: 'background 0.2s, color 0.2s',
              outline: 'none',
              cursor: 'pointer',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#232323'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            {sidebarOpen ? '←' : '☰'}
          </button>
          {sidebarOpen && (
            <>
              <div className="sidebar-search-modern" style={{ background: '#232323', borderRadius: 12, padding: '12px 16px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(255, 214, 0, 0.2)', border: '2px solid #FFD600' }}>
                <span className="search-icon" style={{ color: '#FFD600', fontSize: 18, marginRight: 10 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="modern-search-input"
                  style={{ background: 'transparent', color: '#FFD600', border: 'none', outline: 'none', fontWeight: 500, fontSize: 15, flex: 1, placeholder: '#999' }}
                />
              </div>
              <div className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {MODULES.filter((m) => m.title.toLowerCase().includes(search.toLowerCase())).map((m) => (
                  <button
                    key={m.id}
                    className="menu-item"
                    onClick={() => handleModuleClick(m.id)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('module', m.id)}
                    style={{ background: '#232428', color: '#FFD600', border: '2px solid #FFD600', borderRadius: 10, fontWeight: 700, fontSize: 16, marginBottom: 12, padding: '12px 18px', boxShadow: '0 2px 8px #FFD60022', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.18s, color 0.18s, transform 0.18s', justifyContent: 'flex-start', width: '100%', textAlign: 'left' }}
                  >
                    <span className="menu-icon" style={{ fontSize: 22 }}>{m.icon}</span>
                    {m.title}
                  </button>
                ))}
                {/* Only show Settings menu item for admin users */}
                {user.is_admin && (
                  <button
                    className="menu-item settings-menu-item"
                    onClick={() => handleModuleClick('settings')}
                    draggable={false}
                    style={{ cursor: 'pointer', background: '#FFD600', color: '#181818', fontWeight: 900, border: '2px solid #FFD600', borderRadius: 10, fontSize: 16, marginBottom: 12, padding: '12px 18px', boxShadow: '0 2px 8px #FFD60044', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.18s, color 0.18s, transform 0.18s', justifyContent: 'flex-start', width: '100%', textAlign: 'left' }}
                  >
                    <span className="menu-icon" style={{ fontSize: 22 }}>⚙️</span>
                    Settings
                  </button>
                )}
              </div>
              {/* Remove Weekly Meetings Calendar from sidebar */}
              {/* <div style={{ marginTop: 24, width: '100%', maxWidth: 260 }}>
                <MeetingsCalendar currentUser={user} sidebarMode />
              </div> */}
            </>
          )}
        </aside>
        <div className="main-content" style={{ background: 'none', minHeight: '100vh', padding: 0 }}>
          <div className="hatch-idea-card" style={{ background: '#181818', color: '#FFD600', border: '2px solid #FFD600', borderRadius: 18, boxShadow: '0 2px 16px #FFD60022', marginBottom: 32 }}>
            <span className="idea-icon">💡</span>
            <h2 style={{ color: '#FFD600' }}>Hatch an idea</h2>
            <input
              type="text"
              placeholder="What’s on your mind?"
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              className="login-input idea-input"
              style={{ background: '#111', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 10 }}
            />
            <button
              className="login-button idea-submit"
              onClick={handleIdeaSubmit}
              disabled={!ideaInput.trim()}
              style={{ background: '#FFD600', color: '#111', borderRadius: 10, fontWeight: 700, marginTop: 12 }}
            >
              Submit Idea
            </button>
          </div>
          <div className="quick-launch-card" onDrop={handleDrop} onDragOver={handleDragOver} style={{ background: '#181818', color: '#FFD600', border: '2px solid #FFD600', borderRadius: 20, boxShadow: '0 2px 16px #FFD60022' }}>
            <h3 style={{ color: '#FFD600' }}>Quick Launch</h3>
            <div className="pinned-modules">
              {pinned.length === 0 ? (
                <span className="no-modules">Drag modules here to launch.</span>
              ) : (
                pinned.map((id) => {
                  const m = MODULES.find((x) => x.id === id);
                  return m ? (
                    <div key={id} className="pinned-module">
                      <span className="module-icon">{m.icon}</span>
                      <span className="module-title">{m.title}</span>
                      <button
                        className="quick-launch-btn"
                        onClick={() => handleQuickLaunch(m.id)}
                      >
                        Quick Launch
                      </button>
                      <button
                        className="unpin-btn"
                        onClick={() => setPinned(pinned.filter((x) => x !== id))}
                        title="Remove from Quick Launch"
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}