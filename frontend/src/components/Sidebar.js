import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav style={{ width: 220, background: '#232323', color: '#fff', height: '100vh', padding: 24 }}>
      <h2 style={{ color: '#FFD600', fontWeight: 900 }}>Dashboard</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><button style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleNavigation('/dashboard')}>Home</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleNavigation('/clients')}>Clients</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleNavigation('/spend-tracker')}>Spend Tracker</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleNavigation('/calendar')}>Calendar</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleNavigation('/standup')}>Standup</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleNavigation('/settings')}>Settings</button></li>
        {/* Add more links as needed */}
      </ul>
    </nav>
  );
}
