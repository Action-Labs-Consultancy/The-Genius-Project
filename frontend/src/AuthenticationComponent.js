import React, { useState, useEffect } from 'react';
import { authApi } from './api/authApi';
import { API_BASE_URL } from './config/api';

const AuthenticationComponent = ({ onLoginSuccess }) => {
  // Force premium styling
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
        padding: 20px !important;
        box-sizing: border-box !important;
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
        box-sizing: border-box !important;
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
      
      .premium-password-toggle {
        position: absolute !important;
        right: 16px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        background: none !important;
        border: none !important;
        color: rgba(255, 215, 0, 0.6) !important;
        font-size: 18px !important;
        cursor: pointer !important;
        z-index: 2 !important;
        padding: 4px !important;
        transition: all 0.3s ease !important;
        border-radius: 4px !important;
      }
      
      .premium-password-toggle:hover {
        color: #FFD700 !important;
        background: rgba(255, 215, 0, 0.1) !important;
      }
      
      .premium-password-toggle:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
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
        box-sizing: border-box !important;
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
        cursor: pointer !important;
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
        box-sizing: border-box !important;
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
      
      .premium-modal {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 1000000 !important;
        padding: 20px !important;
      }
      
      .premium-modal-content {
        background: #111111 !important;
        border: 1px solid rgba(255, 215, 0, 0.3) !important;
        border-radius: 8px !important;
        padding: 40px !important;
        width: 100% !important;
        max-width: 400px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
      }
      
      .premium-modal h2 {
        color: #FFD700 !important;
        font-size: 24px !important;
        font-weight: 600 !important;
        margin: 0 0 32px 0 !important;
        text-align: center !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
      }
      
      .premium-modal-form {
        display: flex !important;
        flex-direction: column !important;
        gap: 24px !important;
      }
      
      .premium-modal .premium-input {
        padding: 0 16px !important;
      }
      
      .premium-modal textarea.premium-input {
        resize: vertical !important;
        height: auto !important;
        min-height: 80px !important;
        padding: 16px !important;
      }
      
      .premium-button-secondary {
        background: transparent !important;
        border: 1px solid #666666 !important;
        border-radius: 6px !important;
        color: #FFFFFF !important;
        height: 50px !important;
        font-size: 14px !important;
        font-weight: 400 !important;
        font-family: 'Inter', sans-serif !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        box-sizing: border-box !important;
      }
      
      .premium-button-secondary:hover {
        border-color: #FFD700 !important;
        color: #FFD700 !important;
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
  const [showPassword, setShowPassword] = useState(false);

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
      // Direct fetch with credentials to maintain session
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        showNotification('Login successful!', 'success');
        setTimeout(() => {
          setIsLoading(false);
          if (onLoginSuccess) onLoginSuccess(data.user);
        }, 800);
      } else {
        setIsLoading(false);
        showNotification(data.error || 'Login failed', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      
      // Provide specific error messages based on error type from backend
      let errorMessage = 'Login failed. Please try again.';
      
      // Check if we have structured error data from the backend
      if (err.errorData && err.errorData.error_type) {
        switch (err.errorData.error_type) {
          case 'credentials':
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'network':
            errorMessage = 'Cannot connect to the database. Please try again later.';
            break;
          case 'server':
            errorMessage = 'Server error. Our systems are experiencing issues. Please try again in a few minutes.';
            break;
          case 'validation':
            errorMessage = 'Please enter both email and password.';
            break;
          default:
            errorMessage = err.errorData.error || 'An unexpected error occurred. Please try again.';
        }
      } else {
        // Fallback for network errors or other issues
        if (err.message.includes('Failed to fetch') || err.message.includes('TypeError: Failed to fetch')) {
          errorMessage = 'Cannot connect to the server. Please check your internet connection and try again.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Our systems are experiencing issues. Please try again in a few minutes.';
        } else if (err.message.includes('400')) {
          errorMessage = 'Please enter both email and password.';
        }
      }
      
      showNotification(errorMessage, 'error');
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Note: Implement forgot password endpoint later
      // await authApi.forgotPassword(forgotEmail);
      showNotification('Forgot password feature coming soon!', 'info');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
      }, 3000);
    } catch (err) {
      showNotification('Network error or server unavailable. Please try again later.', 'error');
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
          💰 Action Labs
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="premium-input-group">
            <div className="premium-input-icon">📧</div>
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
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="premium-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
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
              className="premium-link"
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="premium-modal">
          <div className="premium-modal-content">
            <h2>Reset Password</h2>
            <form className="premium-modal-form" onSubmit={handleForgotPassword}>
              <input
                className="premium-input"
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button type="submit" className="premium-button-primary" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button 
                type="button" 
                className="premium-button-secondary"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail('');
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="premium-modal">
          <div className="premium-modal-content">
            <h2>Request Access</h2>
            <form className="premium-modal-form" onSubmit={handleRequestAccess}>
              <input
                className="premium-input"
                type="text"
                placeholder="Full Name"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className="premium-input"
                type="email"
                placeholder="Email Address"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <textarea
                className="premium-input"
                placeholder="Reason for access request"
                rows="3"
                disabled={isLoading}
              ></textarea>
              <button type="submit" className="premium-button-primary" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button 
                type="button" 
                className="premium-button-secondary"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestEmail('');
                  setRequestName('');
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticationComponent;
