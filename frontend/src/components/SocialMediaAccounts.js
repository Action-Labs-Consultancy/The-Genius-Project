import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SocialMediaAccounts.css';

const SocialMediaAccounts = ({ onAccountsUpdate }) => {
  const [accounts, setAccounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [connectionForm, setConnectionForm] = useState({
    username: '',
    access_token: '',
    auto_publish: false
  });

  const platforms = [
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: '#FF0050',
      description: 'Connect your TikTok account for video content',
      available: true
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      color: '#E4405F',
      description: 'Connect your Instagram account for photos and stories',
      available: false
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      description: 'Connect your Twitter account for quick updates',
      available: false
    }
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/social-media/accounts');
      if (response.data.success) {
        setAccounts(response.data.accounts);
        if (onAccountsUpdate) {
          onAccountsUpdate(response.data.accounts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch social accounts:', error);
      setError('Failed to load social media accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const connectAccount = async (platform) => {
    try {
      setConnectingPlatform(platform);
      const response = await axios.post(`/api/social-media/connect/${platform}`, connectionForm);
      
      if (response.data.success) {
        setAccounts(prev => ({
          ...prev,
          [platform]: response.data.account
        }));
        
        // Reset form
        setConnectionForm({
          username: '',
          access_token: '',
          auto_publish: false
        });
        
        setConnectingPlatform(null);
        
        // Show success message
        alert(`${platforms.find(p => p.id === platform)?.name} connected successfully!`);
        
        if (onAccountsUpdate) {
          onAccountsUpdate({ ...accounts, [platform]: response.data.account });
        }
      }
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      alert(`Failed to connect ${platform}. Please check your credentials.`);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const disconnectAccount = async (platform) => {
    try {
      const response = await axios.post(`/api/social-media/disconnect/${platform}`);
      
      if (response.data.success) {
        setAccounts(prev => ({
          ...prev,
          [platform]: { connected: false, username: '', follower_count: 0, auto_publish: false }
        }));
        
        alert(`${platforms.find(p => p.id === platform)?.name} disconnected successfully!`);
        
        if (onAccountsUpdate) {
          onAccountsUpdate({ ...accounts, [platform]: { connected: false } });
        }
      }
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      alert(`Failed to disconnect ${platform}`);
    }
  };

  const toggleAutoPublish = async (platform) => {
    try {
      const newAutoPublish = !accounts[platform]?.auto_publish;
      const response = await axios.post(`/api/social-media/auto-publish/${platform}`, {
        auto_publish: newAutoPublish
      });
      
      if (response.data.success) {
        setAccounts(prev => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            auto_publish: newAutoPublish
          }
        }));
      }
    } catch (error) {
      console.error(`Failed to toggle auto-publish for ${platform}:`, error);
      alert(`Failed to update auto-publish setting`);
    }
  };

  if (isLoading) return <div className="social-loading">Loading social accounts...</div>;

  return (
    <div className="social-media-accounts">
      <button 
        className={`social-toggle-btn ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🔗 Social Media Accounts
        <span className="toggle-indicator">{isExpanded ? '▼' : '▶'}</span>
        <div className="connection-status">
          {Object.values(accounts).filter(acc => acc?.connected).length} connected
        </div>
      </button>

      {isExpanded && (
        <div className="social-accounts-panel">
          {error && <div className="error-message">{error}</div>}
          
          <div className="platforms-grid">
            {platforms.map(platform => {
              const account = accounts[platform.id] || {};
              const isConnected = account.connected;
              
              return (
                <div key={platform.id} className={`platform-card ${isConnected ? 'connected' : 'disconnected'}`}>
                  <div className="platform-header">
                    <div className="platform-info">
                      <span className="platform-icon" style={{ color: platform.color }}>
                        {platform.icon}
                      </span>
                      <div>
                        <h3>{platform.name}</h3>
                        <p className="platform-description">{platform.description}</p>
                      </div>
                    </div>
                    
                    <div className="connection-status-indicator">
                      <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
                      <span className="status-text">
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  {isConnected ? (
                    <div className="connected-account-info">
                      <div className="account-details">
                        <div className="account-stat">
                          <span className="stat-label">Username:</span>
                          <span className="stat-value">{account.username}</span>
                        </div>
                        <div className="account-stat">
                          <span className="stat-label">Followers:</span>
                          <span className="stat-value">{account.follower_count?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="account-controls">
                        <label className="auto-publish-toggle">
                          <input
                            type="checkbox"
                            checked={account.auto_publish || false}
                            onChange={() => toggleAutoPublish(platform.id)}
                          />
                          <span className="toggle-slider"></span>
                          Auto-publish content
                        </label>
                        
                        <button 
                          className="disconnect-btn"
                          onClick={() => disconnectAccount(platform.id)}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="connection-form">
                      {!platform.available ? (
                        <div className="coming-soon-message">
                          <div className="coming-soon-content">
                            <span className="coming-soon-icon">🚧</span>
                            <span className="coming-soon-text">Coming Soon</span>
                          </div>
                          <p className="coming-soon-description">
                            {platform.name} integration is currently under development
                          </p>
                        </div>
                      ) : connectingPlatform === platform.id ? (
                        <div className="form-inputs">
                          <input
                            type="text"
                            placeholder={`${platform.name} username`}
                            value={connectionForm.username}
                            onChange={(e) => setConnectionForm(prev => ({
                              ...prev,
                              username: e.target.value
                            }))}
                          />
                          
                          {platform.id === 'tiktok' && (
                            <input
                              type="text"
                              placeholder="Access Token (optional)"
                              value={connectionForm.access_token}
                              onChange={(e) => setConnectionForm(prev => ({
                                ...prev,
                                access_token: e.target.value
                              }))}
                            />
                          )}
                          
                          <label className="auto-publish-option">
                            <input
                              type="checkbox"
                              checked={connectionForm.auto_publish}
                              onChange={(e) => setConnectionForm(prev => ({
                                ...prev,
                                auto_publish: e.target.checked
                              }))}
                            />
                            Enable auto-publish
                          </label>
                          
                          <div className="form-actions">
                            <button 
                              className="connect-confirm-btn"
                              onClick={() => connectAccount(platform.id)}
                              disabled={!connectionForm.username}
                            >
                              Connect
                            </button>
                            <button 
                              className="connect-cancel-btn"
                              onClick={() => setConnectingPlatform(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="connect-btn"
                          onClick={() => setConnectingPlatform(platform.id)}
                          style={{ borderColor: platform.color }}
                          disabled={!platform.available}
                        >
                          {platform.available ? `Connect ${platform.name}` : 'Coming Soon'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="platform-help">
            <h4>📋 Connection Instructions:</h4>
            <ul>
              <li><strong>TikTok:</strong> Use your TikTok username. Access token is optional for basic features.</li>
              <li><strong>Instagram:</strong> Use your Instagram handle without the @ symbol.</li>
              <li><strong>Twitter:</strong> Use your Twitter handle without the @ symbol.</li>
            </ul>
            <p><em>Auto-publish will automatically post content when it's published to the calendar.</em></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaAccounts;
