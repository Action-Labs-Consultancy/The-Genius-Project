import React, { useState } from 'react';

export default function HeaderBar({ user, onLogout, onLogoClick, onNavigate }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isClient = user?.role === 'client' || user?.userType === 'client';
  const roleLabel = isClient ? 'Client' : 'Team Member';
  const pillColor = isClient ? '#8e44ad' : '#111';
  const pillTextColor = isClient ? '#fff' : '#FFD600';

  return (
    <>
      <header className="header-bar header-bar-yellow" style={{ background: '#FFD600', borderBottom: '4px solid #FFD600', boxShadow: '0 4px 16px #0003' }}>
        <div className="header-bar-left">
          <span
            className="header-bar-logo"
            style={{ textDecoration: 'none', cursor: 'pointer', color: '#111', fontWeight: 900 }}
            onClick={() => (onNavigate ? onNavigate('dashboard') : onLogoClick && onLogoClick())}
            role="link"
            tabIndex={0}
            aria-label="Go to dashboard"
            onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') (onNavigate ? onNavigate('dashboard') : onLogoClick && onLogoClick()); }}
          >
            Action Labs
          </span>
          <span className="role-pill" style={{ background: pillColor, color: pillTextColor, marginLeft: 12 }}>{roleLabel}</span>
          <div className="nav-menu" style={{ marginLeft: 20 }}>
            {/* Navigation items removed */}
          </div>
        </div>
        <div className="header-bar-right">
          <span className="header-bar-welcome" style={{ color: '#111' }}>Welcome, <strong>{user?.name?.split(' ')[0] || ''}</strong></span>
          {user?.streak != null && (
            <span className="header-bar-streak" style={{ background: '#FFD600', color: '#111', borderRadius: 12, padding: '4px 12px', fontWeight: 700, marginLeft: 12, display: 'flex', alignItems: 'center' }}>
              🔥 {user.streak}
            </span>
          )}
          <button
            className="logout-btn"
            type="button"
            onClick={() => setShowLogoutModal(true)}
            style={{
              background: '#111',
              color: '#FFD600',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '1.1rem',
              padding: '0.6em 1.8em',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
              boxShadow: '0 2px 8px #FFD60033',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#222';
              e.currentTarget.style.color = '#FFD600';
              e.currentTarget.style.boxShadow = '0 4px 16px #FFD60022';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#111';
              e.currentTarget.style.color = '#FFD600';
              e.currentTarget.style.boxShadow = '0 2px 8px #FFD60033';
            }}
          >
            Logout
          </button>
        </div>
      </header>
      {showLogoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#181818', color: '#FFD600', borderRadius: 16, padding: '2rem 1.5rem', maxWidth: 340, width: '95vw', textAlign: 'center', boxShadow: '0 8px 32px #0005', border: '2px solid #FFD600' }}>
            <h3 style={{ color: '#FFD600', fontWeight: 600, fontSize: 19, marginBottom: 14 }}>Are you sure you want to logout?</h3>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 18 }}>
              <button
                className="btn-flat"
                style={{ background: '#FFD600', color: '#111', border: 'none', borderRadius: 10, fontWeight: 600, padding: '0.7rem 1.5rem', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px #FFD60033' }}
                onClick={() => { setShowLogoutModal(false); onLogout(); }}
              >
                Yes, Logout
              </button>
              <button
                className="btn-outline cancel-btn"
                style={{ background: '#181818', color: '#FFD600', border: '2px solid #FFD600', borderRadius: 10, fontWeight: 600, padding: '0.7rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
