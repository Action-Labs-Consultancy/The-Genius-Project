import React, { useState } from 'react';
import './styles.css';
import MeetingsCalendar from './MeetingsCalendar';

const MODULES = [
  { id: 'llama-chat', title: 'Llama Chat', icon: '🦙' },
  { id: 'spend-tracker', title: 'Spend Tracker', icon: '💸' },
  { id: 'weeklyStandup', title: 'Weekly Standup', icon: '📅' },
  { id: 'clients', title: 'Clients', icon: '👥' },
  { id: 'newsFeed', title: 'News Feed', icon: '📰' },
  { id: 'notes', title: 'Notes', icon: '📝' },
  { id: 'bookmarks', title: 'Bookmarks', icon: '🔖' },
  { id: 'calendar', title: 'Calendar', icon: '📆' }, // Renamed
];

export default function Dashboard({ user, onNavigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinned, setPinned] = useState([]);
  const [ideaInput, setIdeaInput] = useState('');
  const [search, setSearch] = useState('');

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
    if (id === 'llama-chat') {
      // Navigate to the Llama Chat page
      if (typeof onNavigate === 'function') onNavigate('llama-chat');
    } else if (id === 'calendar') {
      // Switch to the calendar view in App.js
      if (typeof onNavigate === 'function') onNavigate('calendar');
    } else if (id === 'weeklyStandup') {
      if (typeof onNavigate === 'function') onNavigate('weeklyStandup');
    } else {
      onNavigate(id);
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
              <div className="sidebar-search-modern" style={{ background: 'transparent', borderRadius: 12, padding: '10px 16px', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', boxShadow: 'none' }}>
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="modern-search-input"
                  style={{ background: '#181818', color: '#FFD600', border: '1.5px solid #FFD600', borderRadius: 8, fontWeight: 500, fontSize: 15, padding: '8px 12px', flex: 1 }}
                />
                <span className="search-icon" style={{ color: '#FFD600', fontSize: 20, marginLeft: 8 }}>🔍</span>
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