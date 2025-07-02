import React, { useState } from 'react';

const AuthenticationComponent = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false, // Ensure controlled input
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');

  // Action Labs brand colors with yellow primary theme
  const brandColors = {
    yellow: '#FDCC3F',
    darkYellow: '#F7B801',
    lightYellow: '#FFE066',
    red: '#FE3E3D',
    blue: '#3F47AA',
    black: '#1A1A1A',
    gray: '#D9D9D9',
    bg: '#F7F7F7'
  };

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
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.user) {
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
      showNotification('Login error', 'error');
    }
  };

  // Handle request access submit
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: requestEmail,
          name: requestName
        })
      });
      if (res.ok) {
        setShowRequestModal(false);
        setRequestEmail('');
        setRequestName('');
        // Request submitted successfully
        showNotification('Request sent! The admin will review your request.', 'success');
      } else {
        showNotification('Failed to send request.', 'error');
      }
    } catch (err) {
      showNotification('Failed to send request.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Premium Yellow Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 150% 100% at 50% 0%, #f59e0b 0%, #f7b801 25%, #f59e0b 50%, #d97706 100%),linear-gradient(135deg, #fdcc3f 0%, #f7b801 50%, #d97706 100%)`
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(253, 204, 63, 0.25) 0%, rgba(247, 184, 1, 0.15) 40%, transparent 70%)`
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-0">
          <div
            className="w-[800px] h-[400px] rounded-t-full animate-pulse"
            style={{
              background: `radial-gradient(ellipse 400px 200px at 50% 100%,rgba(253, 204, 63, 0.5) 0%,rgba(253, 204, 63, 0.35) 30%,rgba(253, 204, 63, 0.2) 50%,rgba(253, 204, 63, 0.1) 70%,transparent 100%)`,
              filter: 'blur(80px)',
              animationDuration: '8s',
              opacity: 0.8
            }}
          />
        </div>
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, rgba(253, 204, 63, 0.2) 0%, transparent 70%)`,
            filter: 'blur(60px)',
            animationDuration: '6s'
          }}
        />
        <div className="absolute top-40 right-32 w-48 h-48 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, rgba(247, 184, 1, 0.15) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animationDuration: '7s'
          }}
        />
      </div>
      {/* Notification */}
      {notification && (
        <div 
          className="fixed top-6 right-6 px-6 py-4 rounded-xl font-semibold text-sm shadow-lg z-50 transform transition-all duration-300 border-l-4 max-w-sm backdrop-blur-md"
          style={{
            backgroundColor: `${brandColors.black}95`,
            color: 'white',
            borderLeftColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? brandColors.red : brandColors.yellow,
            boxShadow: `0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px ${notification.type === 'success' ? '#10b981' : notification.type === 'error' ? brandColors.red : brandColors.yellow}30`
          }}
        >
          <div className="flex items-center gap-2">
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : notification.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
            {notification.message}
          </div>
        </div>
      )}
      {/* Main Authentication Container */}
      <div className="h-full flex items-center justify-center p-6 relative z-10">
        <div
          className="w-full max-w-md p-8 rounded-3xl shadow-2xl border backdrop-blur-3xl relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(26, 26, 26, 0.9)',
            borderColor: 'rgba(253, 204, 63, 0.3)',
            boxShadow: `0 8px 32px rgba(253, 204, 63, 0.2),0 4px 16px rgba(0, 0, 0, 0.3),inset 0 1px 0 rgba(253, 204, 63, 0.2)`
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${brandColors.yellow}, ${brandColors.lightYellow})`,
                boxShadow: `0 8px 32px rgba(253, 204, 63, 0.4),0 4px 16px rgba(253, 204, 63, 0.3),inset 0 1px 0 rgba(255, 255, 255, 0.3)`
              }}
            >
              <i className="fas fa-user-shield" style={{ color: brandColors.black }}></i>
            </div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${brandColors.yellow}, ${brandColors.lightYellow})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 20px rgba(253, 204, 63, 0.3)'
              }}
            >
              {'Welcome Back'}
            </h1>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                textShadow: '0 1px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {'Sign in to your account'}
            </p>
          </div>
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: brandColors.yellow }}>
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 rounded-lg transition-all duration-300 focus:outline-none backdrop-blur-sm placeholder-white/50"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid rgba(253, 204, 63, 0.3)`,
                    color: 'white'
                  }}
                  onFocus={e => e.target.style.borderColor = brandColors.yellow}
                  onBlur={e => e.target.style.borderColor = 'rgba(253, 204, 63, 0.3)'}
                  placeholder="Enter your email"
                  required
                />
                <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: brandColors.yellow }}></i>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: brandColors.yellow }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 pr-12 rounded-lg transition-all duration-300 focus:outline-none backdrop-blur-sm placeholder-white/50"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid rgba(253, 204, 63, 0.3)`,
                    color: 'white'
                  }}
                  onFocus={e => e.target.style.borderColor = brandColors.yellow}
                  onBlur={e => e.target.style.borderColor = 'rgba(253, 204, 63, 0.3)'}
                  placeholder="Enter your password"
                  required
                />
                <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: brandColors.yellow }}></i>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-yellow-300"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{ accentColor: brandColors.yellow }}
                />
                <span className="ml-2 text-sm">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm hover:underline font-semibold"
                style={{ color: brandColors.yellow, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => setShowRequestModal(true)}
              >
                Request Access
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${brandColors.yellow}, ${brandColors.lightYellow})`,
                color: brandColors.black,
                boxShadow: `0 8px 32px rgba(253, 204, 63, 0.4)`
              }}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.target.style.background = `linear-gradient(135deg, ${brandColors.lightYellow}, ${brandColors.yellow})`;
                  e.target.style.boxShadow = `0 12px 40px rgba(253, 204, 63, 0.5)`;
                }
              }}
              onMouseLeave={e => {
                if (!isLoading) {
                  e.target.style.background = `linear-gradient(135deg, ${brandColors.yellow}, ${brandColors.lightYellow})`;
                  e.target.style.boxShadow = `0 8px 32px rgba(253, 204, 63, 0.4)`;
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2"
                    style={{ borderColor: brandColors.black }}
                  ></div>
                  {'Signing In...'}
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          {/* Request Access Modal */}
          {showRequestModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative" style={{ color: brandColors.black }}>
                <button
                  className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setShowRequestModal(false)}
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-2" style={{ color: brandColors.yellow }}>Request Access</h2>
                <p className="mb-4 text-sm">Please enter your details to request access.</p>
                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={requestEmail}
                    onChange={e => setRequestEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 rounded-lg font-semibold"
                    style={{ background: brandColors.yellow, color: brandColors.black }}
                  >
                    {isLoading ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthenticationComponent;
