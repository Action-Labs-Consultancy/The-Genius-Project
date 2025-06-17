import React, { useState } from 'react';
import './styles.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Login successful! ✅');
        setTimeout(() => setMessage(''), 3000);
        // TODO: Navigate to dashboard or set login state
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      setMessage('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMsg('Check your inbox for reset instructions.');
        setTimeout(() => {
          setShowForgot(false);
          setForgotEmail('');
          setForgotMsg('');
        }, 3000);
      } else {
        setForgotMsg(data.error || 'Unable to send reset email.');
      }
    } catch (err) {
      setForgotMsg('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="animated-background"></div>
      <div className="login-layout">
        <div className="login-left">
          <h1>Social Media Hub</h1>
          <p>Manage all your social media platforms in one powerful dashboard.</p>
          <ul>
            <li>Multi-platform integration</li>
            <li>AI-powered responses</li>
            <li>Real-time analytics</li>
            <li>Team collaboration</li>
          </ul>
        </div>
        <div className="login-right">
          <h2 className="login-form-title">Welcome Back</h2>
          <p className="login-form-subtext">Sign in to your account to continue</p>
          <form onSubmit={handleLogin}>
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
            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
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
              disabled={loading}
            >
              Forgot your password?
            </button>
          </div>
          <div className="login-footer" style={{ marginTop: '0.5rem' }}>
            Need access to this platform?
            <button className="login-footer-button" disabled={loading}>
              Request Access
            </button>
          </div>
        </div>
      </div>
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
                  <p
                    className={`login-message ${forgotMsg.includes('Check') ? 'success' : 'error'}`}
                    style={{ textAlign: 'center', marginBottom: '1rem' }}
                  >
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
    </div>
  );
}