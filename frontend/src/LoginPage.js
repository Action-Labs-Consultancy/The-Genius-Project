import React, { useState } from 'react';
import { api, API_BASE_URL } from './config/api';
// Import our aggressive override styles
import './login-nuclear.css';

export default function LoginPage() {
  // Debug log to confirm component is loading
  console.log('LoginPage: Loading with minimal black design');
  
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
    <div 
      className="minimal-login-container"
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        padding: '20px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        margin: 0
      }}
    >
      <div 
        className="minimal-login-content"
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none'
        }}
      >
        <div className="minimal-brand">
          <h1 style={{
            fontSize: '32px',
            fontWeight: 300,
            color: '#FFD600',
            textAlign: 'center',
            letterSpacing: '-0.5px',
            margin: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}>
            The Genius Project
          </h1>
        </div>
        
        <form 
          className="minimal-login-form" 
          onSubmit={handleLogin}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            borderRadius: 0
          }}
        >
          <div className="minimal-input-group">
            <input
              className="minimal-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                height: '50px',
                background: 'transparent',
                border: '1px solid #333333',
                borderRadius: 0,
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 400,
                padding: '0 16px',
                transition: 'border-color 0.2s ease',
                outline: 'none',
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                boxShadow: 'none',
                margin: 0
              }}
              onFocus={(e) => {e.target.style.borderColor = '#FFD600'}}
              onBlur={(e) => {e.target.style.borderColor = '#333333'}}
            />
          </div>
          
          <div className="minimal-input-group">
            <input
              className="minimal-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                height: '50px',
                background: 'transparent',
                border: '1px solid #333333',
                borderRadius: 0,
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 400,
                padding: '0 16px',
                transition: 'border-color 0.2s ease',
                outline: 'none',
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                boxShadow: 'none',
                margin: 0
              }}
              onFocus={(e) => {e.target.style.borderColor = '#FFD600'}}
              onBlur={(e) => {e.target.style.borderColor = '#333333'}}
            />
          </div>
          
          <button 
            className="minimal-button minimal-button-primary" 
            type="submit" 
            disabled={loading}
            style={{
              height: '50px',
              border: '1px solid #FFD600',
              borderRadius: 0,
              fontSize: '16px',
              fontWeight: 400,
              fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, opacity 0.2s ease',
              outline: 'none',
              textTransform: 'none',
              letterSpacing: 0,
              boxShadow: 'none',
              margin: 0,
              padding: '0 16px',
              background: '#FFD600',
              color: '#000000',
              width: '100%'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div 
            className="minimal-links"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              marginTop: '8px',
              background: 'transparent'
            }}
          >
            <button
              className="minimal-link"
              type="button"
              onClick={() => setShowForgot(true)}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#666666',
                fontSize: '14px',
                fontWeight: 300,
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                textDecoration: 'none',
                outline: 'none',
                boxShadow: 'none',
                margin: 0,
                padding: '8px'
              }}
              onMouseEnter={(e) => {e.target.style.color = '#FFD600'}}
              onMouseLeave={(e) => {e.target.style.color = '#666666'}}
            >
              Forgot Password?
            </button>
            <button
              className="minimal-link"
              type="button"
              onClick={() => setShowAccessRequest(true)}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#666666',
                fontSize: '14px',
                fontWeight: 300,
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                textDecoration: 'none',
                outline: 'none',
                boxShadow: 'none',
                margin: 0,
                padding: '8px'
              }}
              onMouseEnter={(e) => {e.target.style.color = '#FFD600'}}
              onMouseLeave={(e) => {e.target.style.color = '#666666'}}
            >
              Request Access
            </button>
          </div>
        </form>
      </div>

      {showForgot && (
        <div 
          className="minimal-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div 
            className="minimal-modal"
            style={{
              background: '#000000',
              border: '1px solid #333333',
              width: '100%',
              maxWidth: '400px',
              padding: '32px',
              borderRadius: 0,
              boxShadow: 'none',
              margin: 0
            }}
          >
            <div className="minimal-modal-header">
              <h2>Reset Password</h2>
              <button
                className="minimal-close-button"
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
            
            <form className="minimal-modal-form" onSubmit={handleForgot}>
              <p className="minimal-modal-text">Enter your email to receive reset instructions.</p>
              
              <div className="minimal-input-group">
                <input
                  className="minimal-input"
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              {forgotMsg && (
                <p className={`minimal-message ${forgotMsg.includes('Check') ? 'success' : 'error'}`}>
                  {forgotMsg}
                </p>
              )}
              
              <div className="minimal-modal-actions">
                <button
                  type="button"
                  className="minimal-button minimal-button-secondary"
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
                  className="minimal-button minimal-button-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccessRequest && (
        <div className="minimal-modal-overlay">
          <div className="minimal-modal">
            <div className="minimal-modal-header">
              <h2>Request Access</h2>
              <button
                className="minimal-close-button"
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
            
            <form className="minimal-modal-form" onSubmit={handleAccessRequest}>
              <div className="minimal-input-group">
                <input
                  className="minimal-input"
                  type="text"
                  placeholder="Your name"
                  value={accessName}
                  onChange={e => setAccessName(e.target.value)}
                  required
                  disabled={accessLoading}
                />
              </div>
              
              <div className="minimal-input-group">
                <input
                  className="minimal-input"
                  type="email"
                  placeholder="Your email"
                  value={accessEmail}
                  onChange={e => setAccessEmail(e.target.value)}
                  required
                  disabled={accessLoading}
                />
              </div>
              
              {accessResult && (
                <p className="minimal-message">{accessResult}</p>
              )}
              
              <div className="minimal-modal-actions">
                <button
                  type="button"
                  className="minimal-button minimal-button-secondary"
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
                  className="minimal-button minimal-button-primary"
                  disabled={accessLoading}
                >
                  {accessLoading ? 'Sending...' : 'Request Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}