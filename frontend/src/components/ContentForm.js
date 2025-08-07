import React, { useState } from 'react';
import axios from 'axios';
import './ContentForm.css';

const ContentForm = ({ onSubmit, initialData = null, connectedAccounts = {} }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    platform: initialData?.platform || 'instagram',
    isSponsored: initialData?.isSponsored || false,
    preferredDays: initialData?.preferredDays || [],
    sponsorDetails: initialData?.sponsorDetails || {
      budget: '',
      targetAudience: ''
    },
    socialMediaSettings: initialData?.socialMediaSettings || {
      autoPublish: false,
      selectedPlatforms: [],
      scheduledTime: '',
      publishImmediately: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSocialOptions, setShowSocialOptions] = useState(false);

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const availablePlatforms = [
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#FF0050' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1DA1F2' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'isSponsored') {
      setFormData(prev => ({
        ...prev,
        isSponsored: checked,
        preferredDays: checked ? prev.preferredDays : [],
        sponsorDetails: checked ? prev.sponsorDetails : { budget: '', targetAudience: '' }
      }));
    } else if (name.startsWith('sponsorDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        sponsorDetails: {
          ...prev.sponsorDetails,
          [field]: value
        }
      }));
    } else if (name.startsWith('socialMediaSettings.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMediaSettings: {
          ...prev.socialMediaSettings,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDayChange = (day) => {
    setFormData(prev => {
      const newPreferredDays = prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day];
      
      // Limit to 2 days
      if (newPreferredDays.length > 2) {
        return prev;
      }
      
      return {
        ...prev,
        preferredDays: newPreferredDays
      };
    });
  };

  const handlePlatformToggle = (platformId) => {
    setFormData(prev => {
      const selectedPlatforms = prev.socialMediaSettings.selectedPlatforms.includes(platformId)
        ? prev.socialMediaSettings.selectedPlatforms.filter(p => p !== platformId)
        : [...prev.socialMediaSettings.selectedPlatforms, platformId];
      
      return {
        ...prev,
        socialMediaSettings: {
          ...prev.socialMediaSettings,
          selectedPlatforms
        }
      };
    });
  };

  const publishToSocialMedia = async (postData) => {
    try {
      if (formData.socialMediaSettings.selectedPlatforms.length > 0) {
        const publishData = {
          content: `${postData.title}\n\n${postData.content}`,
          platforms: formData.socialMediaSettings.selectedPlatforms,
          scheduled_time: formData.socialMediaSettings.scheduledTime || null
        };
        
        const response = await axios.post('/api/social-media/publish', publishData);
        
        if (response.data.success) {
          console.log('Published to social media:', response.data.results);
          return response.data.results;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to publish to social media:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        status: 'pending'
      };

      let postResponse;
      if (initialData) {
        // Update existing post
        postResponse = await axios.put(`/api/content/posts/${initialData._id}`, submitData);
      } else {
        // Create new post
        postResponse = await axios.post('/api/content/posts', submitData);
      }

      // If post is sponsored and approved, create ads request
      if (formData.isSponsored && formData.preferredDays.length === 2) {
        try {
          const adsRequestData = {
            brand: 'Content Creator',
            campaign: formData.title,
            description: formData.content,
            budget: formData.sponsorDetails.budget ? `$${formData.sponsorDetails.budget}` : '$0',
            contact_email: 'content@marketing-lab.local',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
            urgency: formData.sponsorDetails.budget > 100 ? 'high' : 'medium',
            preferred_days: formData.preferredDays,
            target_audience: formData.sponsorDetails.targetAudience,
            content_id: postResponse.data._id || postResponse.data.id,
            status: 'pending',
            source: 'content_calendar'
          };

          await axios.post('/api/ads/incoming-requests', adsRequestData);
          console.log('Sponsored content added to ads requests');
        } catch (adsError) {
          console.error('Failed to create ads request:', adsError);
          setError('Post saved but failed to create ads request');
        }
      }

      // Publish to social media if enabled
      if (formData.socialMediaSettings.autoPublish || formData.socialMediaSettings.publishImmediately) {
        try {
          await publishToSocialMedia(postResponse.data);
        } catch (socialError) {
          console.error('Social media publishing failed:', socialError);
          setError('Post saved but social media publishing failed');
        }
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        platform: 'instagram',
        isSponsored: false,
        preferredDays: [],
        sponsorDetails: { budget: '', targetAudience: '' },
        socialMediaSettings: {
          autoPublish: false,
          selectedPlatforms: [],
          scheduledTime: '',
          publishImmediately: false
        }
      });

      if (onSubmit) {
        onSubmit(submitData);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-form-container">
      <form onSubmit={handleSubmit} className="content-form">
        <h2>{initialData ? 'Edit Post' : 'Create New Post'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter post title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Enter post content"
          />
        </div>

        <div className="form-group">
          <label htmlFor="platform">Primary Platform</label>
          <select
            id="platform"
            name="platform"
            value={formData.platform}
            onChange={handleChange}
            required
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>

        {/* Social Media Publishing Section */}
        <div className="form-group social-media-section">
          <div className="section-header">
            <button
              type="button"
              className={`toggle-section-btn ${showSocialOptions ? 'expanded' : ''}`}
              onClick={() => setShowSocialOptions(!showSocialOptions)}
            >
              📱 Social Media Publishing
              <span className="toggle-icon">{showSocialOptions ? '▼' : '▶'}</span>
            </button>
          </div>
          
          {showSocialOptions && (
            <div className="social-options-panel">
              <div className="platform-selection">
                <label>Select platforms to publish to:</label>
                <div className="platform-grid">
                  {availablePlatforms.map(platform => {
                    const isConnected = connectedAccounts[platform.id]?.connected;
                    const isSelected = formData.socialMediaSettings.selectedPlatforms.includes(platform.id);
                    
                    return (
                      <div 
                        key={platform.id} 
                        className={`platform-option ${isConnected ? 'connected' : 'disconnected'} ${isSelected ? 'selected' : ''}`}
                      >
                        <button
                          type="button"
                          className="platform-toggle"
                          onClick={() => handlePlatformToggle(platform.id)}
                          disabled={!isConnected}
                          style={{ borderColor: platform.color }}
                        >
                          <span className="platform-icon" style={{ color: platform.color }}>
                            {platform.icon}
                          </span>
                          <span className="platform-name">{platform.name}</span>
                          {!isConnected && <span className="not-connected">Not Connected</span>}
                          {isConnected && isSelected && <span className="selected-indicator">✓</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {formData.socialMediaSettings.selectedPlatforms.length > 0 && (
                <div className="publish-timing">
                  <div className="timing-options">
                    <label className="timing-option">
                      <input
                        type="radio"
                        name="publishTiming"
                        checked={formData.socialMediaSettings.publishImmediately}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          socialMediaSettings: {
                            ...prev.socialMediaSettings,
                            publishImmediately: true,
                            scheduledTime: ''
                          }
                        }))}
                      />
                      Publish immediately when post is approved
                    </label>
                    
                    <label className="timing-option">
                      <input
                        type="radio"
                        name="publishTiming"
                        checked={!formData.socialMediaSettings.publishImmediately && formData.socialMediaSettings.scheduledTime !== ''}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          socialMediaSettings: {
                            ...prev.socialMediaSettings,
                            publishImmediately: false
                          }
                        }))}
                      />
                      Schedule for later
                    </label>
                  </div>
                  
                  {!formData.socialMediaSettings.publishImmediately && (
                    <div className="schedule-input">
                      <input
                        type="datetime-local"
                        name="socialMediaSettings.scheduledTime"
                        value={formData.socialMediaSettings.scheduledTime}
                        onChange={handleChange}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group sponsor-toggle">
          <label className="sponsor-checkbox-label">
            <input
              type="checkbox"
              name="isSponsored"
              checked={formData.isSponsored}
              onChange={handleChange}
            />
            <span className="sponsor-checkbox-text">
              💰 Do you want to sponsor this post?
            </span>
          </label>
        </div>

        {formData.isSponsored && (
          <div className="sponsorship-section">
            <div className="sponsorship-header">
              <h3>📈 Sponsorship Settings</h3>
              <p>Configure your sponsored post for maximum reach and engagement</p>
            </div>
            
            <div className="form-group day-selector">
              <label>📅 Choose 2 weekdays for optimal sponsorship performance</label>
              <div className="day-checkboxes">
                {weekdays.map(day => (
                  <label key={day} className={`day-checkbox ${formData.preferredDays.includes(day) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formData.preferredDays.includes(day)}
                      onChange={() => handleDayChange(day)}
                      disabled={!formData.preferredDays.includes(day) && formData.preferredDays.length >= 2}
                    />
                    <span className="day-label">{day}</span>
                    {formData.preferredDays.includes(day) && <span className="selected-indicator">✓</span>}
                  </label>
                ))}
              </div>
              <small className="help-text">
                Select exactly 2 weekdays for optimal sponsorship performance. 
                {formData.preferredDays.length}/2 selected
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budget">💸 Budget ($)</label>
                <input
                  type="number"
                  id="budget"
                  name="sponsorDetails.budget"
                  value={formData.sponsorDetails.budget}
                  onChange={handleChange}
                  min="0"
                  placeholder="Enter budget amount"
                  className="budget-input"
                />
                <small className="input-hint">Recommended: $50-500 for optimal reach</small>
              </div>

              <div className="form-group">
                <label htmlFor="targetAudience">🎯 Target Audience</label>
                <input
                  type="text"
                  id="targetAudience"
                  name="sponsorDetails.targetAudience"
                  value={formData.sponsorDetails.targetAudience}
                  onChange={handleChange}
                  placeholder="e.g., Young professionals, 25-35"
                  className="audience-input"
                />
                <small className="input-hint">Be specific for better targeting</small>
              </div>
            </div>
            
            <div className="sponsorship-preview">
              <h4>📊 Estimated Performance</h4>
              <div className="performance-metrics">
                <div className="metric">
                  <span className="metric-label">Estimated Reach:</span>
                  <span className="metric-value">
                    {formData.sponsorDetails.budget ? `${(formData.sponsorDetails.budget * 20).toLocaleString()}` : '0'} users
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Preferred Days:</span>
                  <span className="metric-value">
                    {formData.preferredDays.length > 0 ? formData.preferredDays.join(', ') : 'None selected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Saving...' : initialData ? 'Update Post' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default ContentForm;
