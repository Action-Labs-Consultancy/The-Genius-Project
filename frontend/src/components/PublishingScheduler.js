import React, { useState, useEffect } from 'react';

const PublishingScheduler = ({ 
  contentId, 
  user, 
  connectedAccounts = [], 
  onScheduled, 
  initialScheduledTime = null,
  initialPlatforms = []
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState(initialPlatforms);
  const [scheduledDateTime, setScheduledDateTime] = useState(
    initialScheduledTime || new Date().toISOString().slice(0, 16)
  );
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const theme = {
    bg: '#111',
    cardBg: '#181818',
    accent: '#FFD600',
    text: '#FFD600',
    border: '#FFD600',
    green: '#10B981',
    red: '#F87171',
    blue: '#3B82F6'
  };

  useEffect(() => {
    // Auto-select platforms that are connected
    if (connectedAccounts.length > 0 && selectedPlatforms.length === 0) {
      setSelectedPlatforms(connectedAccounts.map(account => account.platform));
    }
  }, [connectedAccounts]);

  const availablePlatforms = [
    { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1DA1F2' }
  ];

  const getConnectedPlatforms = () => {
    return availablePlatforms.filter(platform => 
      connectedAccounts.some(account => account.platform === platform.id)
    );
  };

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const handleSchedule = async () => {
    if (!contentId || !user?.id) {
      setError('Missing content ID or user authentication');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    if (!scheduledDateTime) {
      setError('Please select a date and time');
      return;
    }

    try {
      setIsScheduling(true);
      setError(null);

      const response = await fetch('/api/social/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_id: contentId,
          platforms: selectedPlatforms,
          scheduled_time: scheduledDateTime + ':00Z', // Add seconds and UTC
          user_id: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        const successCount = Object.values(data).filter(result => result.success).length;
        const failCount = Object.values(data).filter(result => !result.success).length;
        
        if (successCount > 0) {
          setSuccess(`Scheduled for ${successCount} platform${successCount > 1 ? 's' : ''}`);
          if (onScheduled) {
            onScheduled(data);
          }
        }
        
        if (failCount > 0) {
          const errors = Object.entries(data)
            .filter(([_, result]) => !result.success)
            .map(([platform, result]) => `${platform}: ${result.error}`)
            .join(', ');
          setError(`Failed to schedule for: ${errors}`);
        }
      } else {
        setError(data.error || 'Failed to schedule content');
      }
    } catch (err) {
      console.error('Error scheduling content:', err);
      setError('Network error occurred');
    } finally {
      setIsScheduling(false);
    }
  };

  const connectedPlatforms = getConnectedPlatforms();

  if (connectedPlatforms.length === 0) {
    return (
      <div style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}22`,
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
          No social media accounts connected
        </div>
        <div style={{ color: '#666', fontSize: '12px' }}>
          Connect accounts to enable automated publishing
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.border}22`,
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h4 style={{
        margin: '0 0 16px 0',
        color: theme.accent,
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        Schedule Publishing
      </h4>

      {error && (
        <div style={{
          background: theme.red,
          color: '#fff',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: theme.green,
          color: '#fff',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {/* Platform Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          color: theme.text,
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          Select Platforms
        </label>

        <div style={{
          display: 'grid',
          gap: '8px'
        }}>
          {connectedPlatforms.map(platform => (
            <label
              key={platform.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: selectedPlatforms.includes(platform.id) ? '#222' : '#1a1a1a',
                border: selectedPlatforms.includes(platform.id) 
                  ? `2px solid ${platform.color}` 
                  : '1px solid #333',
                borderRadius: '6px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                if (!selectedPlatforms.includes(platform.id)) {
                  e.target.style.background = '#222';
                }
              }}
              onMouseOut={e => {
                if (!selectedPlatforms.includes(platform.id)) {
                  e.target.style.background = '#1a1a1a';
                }
              }}
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform.id)}
                onChange={() => handlePlatformToggle(platform.id)}
                style={{ display: 'none' }}
              />
              
              <span style={{ fontSize: '20px' }}>{platform.icon}</span>
              
              <div>
                <div style={{
                  color: theme.text,
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {platform.name}
                </div>
                <div style={{
                  color: '#888',
                  fontSize: '12px'
                }}>
                  Connected and ready
                </div>
              </div>

              {selectedPlatforms.includes(platform.id) && (
                <div style={{
                  marginLeft: 'auto',
                  background: platform.color,
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  ✓ SELECTED
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Date/Time Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          color: theme.text,
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          Schedule Date & Time
        </label>

        <input
          type="datetime-local"
          value={scheduledDateTime}
          onChange={(e) => setScheduledDateTime(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          style={{
            width: '100%',
            background: '#222',
            border: `1px solid ${theme.border}22`,
            borderRadius: '6px',
            padding: '12px',
            color: theme.text,
            fontSize: '14px'
          }}
        />

        <div style={{
          color: '#888',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          Content will be published automatically when approved and time is reached
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleSchedule}
          disabled={isScheduling || selectedPlatforms.length === 0}
          style={{
            background: selectedPlatforms.length > 0 ? theme.accent : '#666',
            color: selectedPlatforms.length > 0 ? theme.bg : '#999',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: selectedPlatforms.length > 0 ? 'pointer' : 'not-allowed',
            opacity: isScheduling ? 0.6 : 1
          }}
        >
          {isScheduling ? 'Scheduling...' : 'Schedule Publishing'}
        </button>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#1a1a1a',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#888'
      }}>
        <strong style={{ color: theme.accent }}>How it works:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
          <li>Content must be approved before publishing</li>
          <li>System checks every minute for scheduled posts</li>
          <li>Posts are automatically published when time is reached</li>
          <li>Failed posts will be retried up to 3 times</li>
        </ul>
      </div>
    </div>
  );
};

export default PublishingScheduler;
