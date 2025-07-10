import React, { useEffect, useState } from 'react';

export default function TikTokAuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || urlParams.get('auth_code');
    const state = urlParams.get('state');
    
    if (!code) {
      setError('Missing TikTok authorization code.');
      setLoading(false);
      return;
    }

    // Call backend to exchange code for access token and get analysis
    fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002'}/api/tiktok/analyze?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setAnalysis(data.analysis);
          // Redirect back to original page after 3 seconds
          setTimeout(() => {
            if (state && state.startsWith('http')) {
              window.location.href = state + '?tiktok_connected=true';
            } else {
              window.location.href = '/';
            }
          }, 3000);
        }
      })
      .catch(err => {
        console.error('TikTok API error:', err);
        setError('Failed to connect to TikTok.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#111',
        color: '#fff'
      }}>
        <div style={{ fontSize: 24, marginBottom: 20 }}>🔗 Connecting to TikTok...</div>
        <div style={{ fontSize: 16, color: '#888' }}>Please wait while we process your authorization.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#111',
        color: '#fff'
      }}>
        <div style={{ fontSize: 24, marginBottom: 20, color: '#ff4444' }}>❌ Connection Failed</div>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 20 }}>{error}</div>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            background: '#25F4EE',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#111',
      color: '#fff'
    }}>
      <div style={{ fontSize: 24, marginBottom: 20, color: '#25F4EE' }}>✅ TikTok Connected Successfully!</div>
      
      {analysis && (
        <div style={{
          background: '#222',
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          maxWidth: 600
        }}>
          <h3 style={{ color: '#25F4EE', marginBottom: 16 }}>TikTok Account Analysis</h3>
          <div style={{ fontSize: 14, color: '#ccc' }}>
            <div>Account: {analysis.account}</div>
            <div>Followers: {analysis.followers}</div>
            <div>Avg Views: {analysis.avg_views}</div>
            <div>Top Video: {analysis.top_video}</div>
            <div>Engagement Rate: {analysis.engagement_rate}</div>
            <div>Recent Growth: {analysis.recent_growth}</div>
          </div>
        </div>
      )}
      
      <div style={{ fontSize: 16, color: '#888', marginBottom: 20 }}>
        Redirecting you back to the original page...
      </div>
      
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          background: '#25F4EE',
          color: '#000',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: 16,
          cursor: 'pointer'
        }}
      >
        Continue
      </button>
    </div>
  );
}
