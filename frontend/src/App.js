import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Settings from './Settings';
import './styles.css';

export default function App() {
  const [view, setView] = useState('login'); // 'login' | 'request' | 'dashboard' | 'settings'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

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
        setIsAdmin(data.is_admin);
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
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestEmail }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch {
      setMessage('Request failed');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (res.ok) {
        setTimeout(() => {
          setShowForgot(false);
          setForgotEmail('');
          setMessage('');
        }, 3000);
      }
    } catch {
      setMessage('Error sending reset email');
    }
  };

  // render views
  if (view === 'dashboard') {
    return (
      <Dashboard
        email={email}
        isAdmin={isAdmin}
        onNavigate={setView}
      />
    );
  }

  if (view === 'settings') {
    return <Settings onNavigate={setView} />;
  }

  // login / request access / forgot password
  return (
    <div className="login-page">
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
              {message && (
                <p className={`login-message ${message.includes('successful') ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}
              <div className="login-footer">
                <button
                  className="login-footer-button"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot your password?
                </button>
                <span> | </span>
                <button
                  className="login-footer-button"
                  onClick={() => setView('request')}
                >
                  Request Access
                </button>
              </div>
            </>
          ) : view === 'request' ? (
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
              {message && (
                <p className={`login-message ${message.includes('success') ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}
              <div className="login-footer">
                <button
                  className="login-footer-button"
                  onClick={() => setView('login')}
                >
                  Already have an account? Login here
                </button>
              </div>
            </>
          ) : null}

          {showForgot && (
            <div className="modal-overlay active">
              <div className="modal">
                <div className="modal-header">
                  <h2>Reset Password</h2>
                  <button
                    className="action-btn"
                    onClick={() => setShowForgot(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-content">
                  <p>Enter your email to receive reset instructions.</p>
                  <form onSubmit={handleForgot}>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="login-input"
                    />
                    {message && (
                      <p
                        className={`login-message ${message.includes('sent') ? 'success' : 'error'}`}
                        style={{ textAlign: 'center', marginBottom: '1rem' }}
                      >
                        {message}
                      </p>
                    )}
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForgot(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Send Reset Link
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}