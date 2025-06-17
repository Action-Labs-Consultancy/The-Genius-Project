import React, { useState } from 'react';
import Dashboard from './Dashboard';
import './styles.css';

export default function App() {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setView('dashboard');
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch {
      setMessage('Error logging in');
    }
  };

  const handleAccessRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestEmail }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch {
      setMessage('Request failed. Please try again.');
    }
  };

  if (view === 'dashboard') return <Dashboard email={email} />;

  return (
    <div className="login-layout">
      <div className="login-left">
        <h1>Social Media Hub</h1>
        <p>Manage all your social media platforms in one powerful dashboard.</p>
        <ul>
          <li><i className="fas fa-check-circle"></i> Multi-platform integration</li>
          <li><i className="fas fa-robot"></i> AI-powered responses</li>
          <li><i className="fas fa-chart-line"></i> Real-time analytics</li>
          <li><i className="fas fa-users"></i> Team collaboration</li>
        </ul>
      </div>

      <div className="login-right">
        {view === 'login' ? (
          <>
            <h2 className="login-form-title">Welcome Back</h2>
            <p className="login-form-subtext">Sign in to your account to continue</p>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
              <button type="submit" className="login-button">Sign In</button>
            </form>
            <p className="login-footer">
              Need access to this platform?{' '}
              <button onClick={() => setView('request')}>Request Access</button>
            </p>
          </>
        ) : (
          <>
            <h2 className="login-form-title">Request Access</h2>
            <p className="login-form-subtext">Enter your email and we'll notify the admin</p>
            <form onSubmit={handleAccessRequest}>
              <input
                type="email"
                placeholder="Your Email"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                required
                className="login-input"
              />
              <button type="submit" className="login-button">Request Access</button>
            </form>
            <p className="login-footer">
              Already have an account?{' '}
              <button onClick={() => setView('login')}>Login here</button>
            </p>
          </>
        )}
        {message && (
          <p className={`login-message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
