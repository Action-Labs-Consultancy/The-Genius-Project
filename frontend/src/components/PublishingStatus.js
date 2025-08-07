import React, { useState, useEffect } from 'react';

const PublishingStatus = ({ contentId, platforms = [], onStatusUpdate }) => {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const theme = {
    bg: '#111',
    cardBg: '#181818',
    accent: '#FFD600',
    text: '#FFD600',
    border: '#FFD600',
    green: '#10B981',
    red: '#F87171',
    orange: '#FFA500',
    blue: '#3B82F6'
  };

  useEffect(() => {
    if (contentId) {
      loadStatus();
    }
  }, [contentId]);

  const loadStatus = async () => {
    if (!contentId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/social/content/${contentId}/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        if (onStatusUpdate) {
          onStatusUpdate(data);
        }
      }
    } catch (err) {
      console.error('Error loading publishing status:', err);
      setError('Failed to load publishing status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return theme.green;
      case 'queued': return theme.blue;
      case 'failed': return theme.red;
      case 'skipped': return theme.orange;
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return '✅';
      case 'queued': return '⏰';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return 'Published';
      case 'queued': return 'Queued';
      case 'failed': return 'Failed';
      case 'skipped': return 'Skipped';
      default: return 'Unknown';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}22`,
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center'
      }}>
        <div style={{ color: theme.text, fontSize: '12px' }}>Loading status...</div>
      </div>
    );
  }

  if (!contentId || Object.keys(status).length === 0) {
    return (
      <div style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}22`,
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          color: '#888',
          fontSize: '12px',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          No publishing scheduled
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.border}22`,
      borderRadius: '8px',
      padding: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h4 style={{
          margin: 0,
          color: theme.accent,
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Publishing Status
        </h4>
        
        <button
          onClick={loadStatus}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.border}22`,
            borderRadius: '4px',
            padding: '4px 8px',
            color: theme.text,
            fontSize: '10px',
            cursor: 'pointer'
          }}
          title="Refresh status"
        >
          🔄
        </button>
      </div>

      {error && (
        <div style={{
          background: theme.red,
          color: '#fff',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(status).map(([platform, platformStatus]) => (
          <div
            key={platform}
            style={{
              background: '#222',
              border: `1px solid ${getStatusColor(platformStatus.status)}22`,
              borderRadius: '6px',
              padding: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>
                {platform === 'facebook' && '👥'}
                {platform === 'instagram' && '📷'}
                {platform === 'linkedin' && '💼'}
                {platform === 'twitter' && '🐦'}
              </span>
              
              <div>
                <div style={{
                  color: theme.text,
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}>
                  {platform}
                </div>
                
                {platformStatus.scheduled_time && (
                  <div style={{
                    color: '#888',
                    fontSize: '10px'
                  }}>
                    {formatDateTime(platformStatus.scheduled_time)}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: getStatusColor(platformStatus.status),
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {getStatusIcon(platformStatus.status)}
                {getStatusText(platformStatus.status)}
              </span>

              {platformStatus.attempts > 0 && (
                <span style={{
                  color: '#888',
                  fontSize: '10px'
                }}>
                  ({platformStatus.attempts} attempts)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show details for failed or published items */}
      {Object.entries(status).some(([_, platformStatus]) => 
        platformStatus.published_at || platformStatus.error_message
      ) && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          {Object.entries(status).map(([platform, platformStatus]) => {
            if (platformStatus.published_at) {
              return (
                <div key={`${platform}-published`} style={{ color: theme.green, marginBottom: '4px' }}>
                  <strong>{platform}:</strong> Published at {formatDateTime(platformStatus.published_at)}
                </div>
              );
            }
            
            if (platformStatus.error_message) {
              return (
                <div key={`${platform}-error`} style={{ color: theme.red, marginBottom: '4px' }}>
                  <strong>{platform}:</strong> {platformStatus.error_message}
                </div>
              );
            }
            
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default PublishingStatus;
