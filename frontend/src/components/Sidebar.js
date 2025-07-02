import React from 'react';

export default function Sidebar({ onNavigate }) {
  return (
    <nav style={{ width: 220, background: '#232323', color: '#fff', height: '100vh', padding: 24 }}>
      <h2 style={{ color: '#FFD600', fontWeight: 900 }}>Dashboard</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><button style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('dashboard')}>Home</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('clients')}>Clients</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('projects')}>Projects</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('spend-tracker')}>Spend Tracker</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('calendar')}>Calendar</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('content-calendar')}>Content Calendar</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('standup')}>Standup</button></li>
        <li><button style={{ color: '#FFD600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onNavigate('settings')}>Settings</button></li>
        {/* Add more links as needed */}
      </ul>
    </nav>
  );
}
