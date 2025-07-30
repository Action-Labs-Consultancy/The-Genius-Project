import React, { useState, useEffect } from 'react';
import { api } from './config/api';

const AuthenticationComponent = ({ onLoginSuccess }) => {
  // Debug logs to confirm component is loading
  console.log('🔥 AuthenticationComponent: Loading with minimal black design');
  console.log('🔥 onLoginSuccess:', onLoginSuccess);
  
  // Force load our CSS after component mounts
  useEffect(() => {
    // Force document body styles immediately
    const forceStyles = () => {
      document.body.style.setProperty('background', '#000000', 'important');
      document.body.style.setProperty('backgroundColor', '#000000', 'important');
      document.body.style.setProperty('margin', '0px', 'important');
      document.body.style.setProperty('padding', '0px', 'important');
      document.body.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('height', '100vh', 'important');
      document.body.style.setProperty('width', '100vw', 'important');
      
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.setProperty('background', '#000000', 'important');
        rootEl.style.setProperty('backgroundColor', '#000000', 'important');
        rootEl.style.setProperty('margin', '0px', 'important');
        rootEl.style.setProperty('padding', '0px', 'important');
        rootEl.style.setProperty('height', '100vh', 'important');
        rootEl.style.setProperty('width', '100vw', 'important');
      }
    };
    
    // Apply styles immediately
    forceStyles();
    
    // Create premium login styles
    const style = document.createElement('style');
    style.setAttribute('id', 'premium-login-styles');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      /* Premium Login Container */
      body, html, #root {
        background: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        height: 100vh !important;
        width: 100vw !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
      
      .premium-login-container {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: #000000 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        animation: fadeIn 0.6s ease-out !important;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .premium-login-card {
        background: rgba(17, 17, 17, 0.95) !important;
        border: 1px solid rgba(255, 215, 0, 0.3) !important;
        border-radius: 8px !important;
        padding: 48px 40px !important;
        width: 100% !important;
        max-width: 420px !important;
        box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.1) inset, 
                    0 8px 32px rgba(0, 0, 0, 0.4) !important;
        backdrop-filter: blur(10px) !important;
      }
      
      .premium-brand {
        font-size: 26px !important;
        font-weight: 700 !important;
        color: #FFD700 !important;
        text-align: center !important;
        letter-spacing: 1.2px !important;
        margin-bottom: 40px !important;
        text-transform: uppercase !important;
      }
      
      .premium-input-group {
        position: relative !important;
        margin-bottom: 24px !important;
      }
      
      .premium-input-icon {
        position: absolute !important;
        left: 16px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        color: rgba(255, 215, 0, 0.6) !important;
        font-size: 18px !important;
        z-index: 2 !important;
      }
      
      .premium-input {
        width: 100% !important;
        height: 56px !important;
        background: #111111 !important;
        border: 1px solid rgba(255, 215, 0, 0.2) !important;
        border-radius: 6px !important;
        color: #FFFFFF !important;
        font-size: 15px !important;
        font-weight: 400 !important;
        padding: 0 16px 0 50px !important;
        font-family: 'Inter', sans-serif !important;
        outline: none !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      }
      
      .premium-input:focus {
        border-color: #FFD700 !important;
        box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1), 
                    0 4px 16px rgba(0, 0, 0, 0.3) !important;
        transform: translateY(-1px) !important;
      }
      
      .premium-input::placeholder {
        color: rgba(255, 255, 255, 0.4) !important;
      }
      
      .premium-button-primary {
        width: 100% !important;
        height: 56px !important;
        background: #FFD700 !important;
        border: none !important;
        border-radius: 6px !important;
        color: #000000 !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        font-family: 'Inter', sans-serif !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        margin-bottom: 32px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2) !important;
      }
      
      .premium-button-primary:hover {
        background: #E6C200 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(255, 215, 0, 0.3) !important;
      }
      
      .premium-button-primary:active {
        transform: translateY(0) !important;
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2) !important;
      }
      
      .premium-link {
        color: rgba(255, 215, 0, 0.8) !important;
        text-decoration: none !important;
        font-size: 14px !important;
        font-weight: 400 !important;
        transition: all 0.3s ease !important;
      }
      
      .premium-link:hover {
        color: #FFD700 !important;
      }
      
      .premium-button-ghost {
        background: transparent !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        border-radius: 6px !important;
        color: #FFFFFF !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        font-family: 'Inter', sans-serif !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        padding: 12px 24px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
      }
      
      .premium-button-ghost:hover {
        border-color: rgba(255, 255, 255, 0.6) !important;
        color: #FFD700 !important;
        transform: translateY(-1px) !important;
      }
      
      .premium-links {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
        align-items: center !important;
      }
      
      .premium-forgot-link {
        margin-bottom: 8px !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Clean up when component unmounts
      const existingStyle = document.getElementById('premium-login-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle login form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await api.login(formData);
      if (data && data.user) {
        showNotification('Login successful!', 'success');
        setTimeout(() => {
          setIsLoading(false);
          if (onLoginSuccess) onLoginSuccess(data.user);
        }, 800);
      } else {
        setIsLoading(false);
        showNotification(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      showNotification('Login error: ' + err.message, 'error');
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.forgotPassword(forgotEmail);
      setForgotMessage('Check your inbox for reset instructions.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotMessage('');
      }, 3000);
    } catch (err) {
      setForgotMessage('Network error or server unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle request access
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulate API call for now
      showNotification(`Access request submitted for ${requestName} (${requestEmail})`, 'success');
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestEmail('');
        setRequestName('');
      }, 1000);
    } catch (err) {
      showNotification('Error submitting request: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="premium-login-container">
      {/* Notification */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '6px',
            background: notification.type === 'success' ? '#22C55E' : '#EF4444',
            color: '#FFFFFF',
            zIndex: 10000,
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {notification.message}
        </div>
      )}

      <div className="premium-login-card">
        <div className="premium-brand">
          Action Labs
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="premium-input-group">
            <div className="premium-input-icon">✉</div>
            <input
              className="premium-input"
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="premium-input-group">
            <div className="premium-input-icon">🔒</div>
            <input
              className="premium-input"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            className="premium-button-primary" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="premium-links">
            <a 
              href="#" 
              className="premium-link premium-forgot-link"
              onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(true);
              }}
            >
              Forgot your password?
            </a>
            
            <button 
              type="button"
              className="premium-button-ghost"
              onClick={() => setShowRequestModal(true)}
            >
              Request Access
            </button>
          </div>
        </form>
      </div>
          boxShadow: 'none'
        }}
      >
        <div className="minimal-brand">
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#FFD600',
            textAlign: 'center',
            letterSpacing: '-0.5px',
            margin: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}>
            Action Labs
          </h1>
        </div>
        
        <form 
          className="minimal-login-form" 
          onSubmit={handleSubmit}
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
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
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
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
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
            disabled={isLoading}
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
            {isLoading ? 'Signing In...' : 'Sign In'}
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
              onClick={() => setShowForgotPassword(true)}
              disabled={isLoading}
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
              onClick={() => setShowRequestModal(true)}
              disabled={isLoading}
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="minimal-modal-overlay" style={{
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
        }}>
          <div className="minimal-modal" style={{
            background: '#000000',
            border: '1px solid #333333',
            width: '100%',
            maxWidth: '400px',
            padding: '32px',
            borderRadius: 0,
            boxShadow: 'none',
            margin: 0
          }}>
            <div className="minimal-modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              padding: 0,
              background: 'transparent',
              border: 'none'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 300,
                color: '#FFD600',
                margin: 0,
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
              }}>
                Reset Password
              </h2>
              <button
                className="minimal-close-button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail('');
                  setForgotMessage('');
                }}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666666',
                  fontSize: '24px',
                  fontWeight: 300,
                  cursor: 'pointer',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                  boxShadow: 'none',
                  margin: 0,
                  fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
                }}
                onMouseEnter={(e) => {e.target.style.color = '#FFD600'}}
                onMouseLeave={(e) => {e.target.style.color = '#666666'}}
              >
                ×
              </button>
            </div>
            
            <form className="minimal-modal-form" onSubmit={handleForgotPassword} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0
            }}>
              <p style={{
                color: '#CCCCCC',
                fontSize: '14px',
                fontWeight: 300,
                lineHeight: 1.5,
                margin: 0,
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: 0
              }}>
                Enter your email to receive reset instructions.
              </p>
              
              <div className="minimal-input-group">
                <input
                  className="minimal-input"
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={isLoading}
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
              
              {forgotMessage && (
                <p style={{
                  color: forgotMessage.includes('Check') ? '#4CAF50' : '#F44336',
                  fontSize: '14px',
                  fontWeight: 300,
                  textAlign: 'center',
                  margin: 0,
                  padding: '12px',
                  border: `1px solid ${forgotMessage.includes('Check') ? '#4CAF50' : '#F44336'}`,
                  background: 'transparent',
                  borderRadius: 0,
                  boxShadow: 'none'
                }}>
                  {forgotMessage}
                </p>
              )}
              
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                marginTop: '8px',
                background: 'transparent',
                border: 'none',
                padding: 0
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                    setForgotMessage('');
                  }}
                  disabled={isLoading}
                  style={{
                    minWidth: '100px',
                    height: '40px',
                    fontSize: '14px',
                    background: 'transparent',
                    color: '#FFFFFF',
                    border: '1px solid #333333',
                    borderRadius: 0,
                    fontWeight: 400,
                    fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, opacity 0.2s ease',
                    outline: 'none',
                    textTransform: 'none',
                    letterSpacing: 0,
                    boxShadow: 'none',
                    margin: 0,
                    padding: '0 16px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#FFD600';
                    e.target.style.color = '#FFD600';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#333333';
                    e.target.style.color = '#FFFFFF';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    minWidth: '100px',
                    height: '40px',
                    fontSize: '14px',
                    background: '#FFD600',
                    color: '#000000',
                    border: '1px solid #FFD600',
                    borderRadius: 0,
                    fontWeight: 400,
                    fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, opacity 0.2s ease',
                    outline: 'none',
                    textTransform: 'none',
                    letterSpacing: 0,
                    boxShadow: 'none',
                    margin: 0,
                    padding: '0 16px'
                  }}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="minimal-modal-overlay" style={{
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
        }}>
          <div className="minimal-modal" style={{
            background: '#000000',
            border: '1px solid #333333',
            width: '100%',
            maxWidth: '400px',
            padding: '32px',
            borderRadius: 0,
            boxShadow: 'none',
            margin: 0
          }}>
            <div className="minimal-modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              padding: 0,
              background: 'transparent',
              border: 'none'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 300,
                color: '#FFD600',
                margin: 0,
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
              }}>
                Request Access
              </h2>
              <button
                className="minimal-close-button"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestEmail('');
                  setRequestName('');
                }}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666666',
                  fontSize: '24px',
                  fontWeight: 300,
                  cursor: 'pointer',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                  boxShadow: 'none',
                  margin: 0,
                  fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
                }}
                onMouseEnter={(e) => {e.target.style.color = '#FFD600'}}
                onMouseLeave={(e) => {e.target.style.color = '#666666'}}
              >
                ×
              </button>
            </div>
            
            <form className="minimal-modal-form" onSubmit={handleRequestAccess} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0
            }}>
              <div className="minimal-input-group">
                <input
                  className="minimal-input"
                  type="text"
                  placeholder="Your name"
                  value={requestName}
                  onChange={e => setRequestName(e.target.value)}
                  required
                  disabled={isLoading}
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
                  type="email"
                  placeholder="Your email"
                  value={requestEmail}
                  onChange={e => setRequestEmail(e.target.value)}
                  required
                  disabled={isLoading}
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
              
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                marginTop: '8px',
                background: 'transparent',
                border: 'none',
                padding: 0
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestEmail('');
                    setRequestName('');
                  }}
                  disabled={isLoading}
                  style={{
                    minWidth: '100px',
                    height: '40px',
                    fontSize: '14px',
                    background: 'transparent',
                    color: '#FFFFFF',
                    border: '1px solid #333333',
                    borderRadius: 0,
                    fontWeight: 400,
                    fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, opacity 0.2s ease',
                    outline: 'none',
                    textTransform: 'none',
                    letterSpacing: 0,
                    boxShadow: 'none',
                    margin: 0,
                    padding: '0 16px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#FFD600';
                    e.target.style.color = '#FFD600';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#333333';
                    e.target.style.color = '#FFFFFF';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    minWidth: '100px',
                    height: '40px',
                    fontSize: '14px',
                    background: '#FFD600',
                    color: '#000000',
                    border: '1px solid #FFD600',
                    borderRadius: 0,
                    fontWeight: 400,
                    fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, opacity 0.2s ease',
                    outline: 'none',
                    textTransform: 'none',
                    letterSpacing: 0,
                    boxShadow: 'none',
                    margin: 0,
                    padding: '0 16px'
                  }}
                >
                  {isLoading ? 'Sending...' : 'Request Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticationComponent;
