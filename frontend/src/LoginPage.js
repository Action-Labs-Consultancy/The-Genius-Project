import React, { useState } from 'react';
import { api, API_BASE_URL } from './config/api';
import './styles.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [accessEmail, setAccessEmail] = useState('');
  const [accessName, setAccessName] = useState('');
  const [accessResult, setAccessResult] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      if (data && data.user) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        // Handle login error (e.g., show a notification)
      }
    } catch (err) {
      // Handle network or server error (e.g., show a notification)
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setLoading(true);
    try {
      await api.forgotPassword(forgotEmail);
      setForgotMsg('Check your inbox for reset instructions.');
      setTimeout(() => {
        setShowForgot(false);
        setForgotEmail('');
        setForgotMsg('');
      }, 3000);
    } catch (err) {
      setForgotMsg('Network error or server unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Request Access handler
  const handleAccessRequest = async (e) => {
    e.preventDefault();
    setAccessResult('');
    setAccessLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accessEmail, name: accessName }),
      });
      await api.requestAccess({ email: accessEmail, name: accessName });
      setAccessResult('Request submitted!');
      setTimeout(() => {
        setShowAccessRequest(false);
        setAccessEmail('');
        setAccessName('');
        setAccessResult('');
      }, 2000);
    } catch (err) {
      setAccessResult('Network error or server unavailable.');
    } finally {
      setAccessLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="branding">
          <i className="fas fa-share-alt logo-icon"></i>
          <h1>The Genius Project</h1>
          <ul className="features-list">
            <li>All your projects, clients, and teamwork in one place.</li>
            <li>Secure, fast, and easy to use.</li>
            <li>Collaborate and grow your business.</li>
          </ul>
          <div className="icons">
            <i className="fab fa-instagram"></i>
            <i className="fab fa-facebook"></i>
            <i className="fab fa-tiktok"></i>
            <i className="fab fa-linkedin"></i>
            <i className="fab fa-youtube youtube-icon"></i>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Sign In</h2>
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <div className="remember-row">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>
          <button className="login-button gradient-btn" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <div className="login-footer">
            <button
              className="login-footer-button"
              type="button"
              onClick={() => setShowForgot(true)}
              disabled={loading}
            >
              Forgot your password?
            </button>
          </div>
          <div className="login-footer access-link">
            Need access to this platform?
            <button
              className="login-footer-button"
              type="button"
              onClick={() => setShowAccessRequest(true)}
              disabled={loading}
            >
              Request Access
            </button>
          </div>
        </form>
        {showForgot && (
          <div className="modal-overlay active">
            <div className="modal">
              <div className="modal-header">
                <h2>Reset Password</h2>
                <button
                  className="action-btn"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotEmail('');
                    setForgotMsg('');
                  }}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <p>Enter your email to receive reset instructions.</p>
                <form onSubmit={handleForgot}>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="Email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  {forgotMsg && (
                    <p className={`login-message ${forgotMsg.includes('Check') ? 'success' : 'error'}`}
                      style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      {forgotMsg}
                    </p>
                  )}
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowForgot(false);
                        setForgotEmail('');
                        setForgotMsg('');
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {showAccessRequest && (
          <div className="modal-overlay active">
            <div className="modal">
              <div className="modal-header">
                <h2>Request Access</h2>
                <button
                  className="action-btn"
                  onClick={() => {
                    setShowAccessRequest(false);
                    setAccessEmail('');
                    setAccessName('');
                    setAccessResult('');
                  }}
                  disabled={accessLoading}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <form onSubmit={handleAccessRequest}>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="Your name"
                    value={accessName}
                    onChange={e => setAccessName(e.target.value)}
                    required
                    disabled={accessLoading}
                  />
                  <input
                    className="login-input"
                    type="email"
                    placeholder="Your email"
                    value={accessEmail}
                    onChange={e => setAccessEmail(e.target.value)}
                    required
                    disabled={accessLoading}
                  />
                  {accessResult && (
                    <p className="login-message" style={{ textAlign: 'center', marginBottom: '1rem' }}>{accessResult}</p>
                  )}
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAccessRequest(false);
                        setAccessEmail('');
                        setAccessName('');
                        setAccessResult('');
                      }}
                      disabled={accessLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={accessLoading}
                    >
                      {accessLoading ? 'Sending...' : 'Request Access'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}