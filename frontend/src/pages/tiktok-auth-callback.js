import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function TikTokAuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Connecting to TikTok...');
  const navigate = useNavigate();

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

    // Check if this is for social media connection or analysis
    const isForSocialMedia = state && state.includes('social-media');

    if (isForSocialMedia) {
      // Handle social media connection
      setStatus('Connecting your TikTok account...');
      
      fetch('/api/social-media/connect/tiktok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          auth_code: code,
          state: state,
          username: 'tiktok_connected_user',
          access_token: 'real_token_from_oauth',
          auto_publish: true
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('TikTok connected successfully! Redirecting...');
          // Notify parent window and close popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              platform: 'tiktok',
              authCode: code
            }, window.location.origin);
            window.close();
          } else {
            // Regular redirect for non-popup
            setTimeout(() => navigate('/clients'), 2000);
          }
        } else {
          setError(data.error || 'Failed to connect TikTok account');
        }
      })
      .catch(err => {
        console.error('TikTok connection error:', err);
        setError('Failed to connect to TikTok.');
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: 'Failed to connect TikTok account'
          }, window.location.origin);
          window.close();
        }
      })
      .finally(() => setLoading(false));
    } else {
      // Handle TikTok analysis (original functionality)
      setStatus('Analyzing your TikTok account...');
      
      fetch(`${API_BASE_URL}/api/tiktok/analyze?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setStatus('Analysis complete! Redirecting...');
            setTimeout(() => {
              if (state && state.startsWith('http')) {
                const url = new URL(state);
                navigate(url.pathname);
              } else {
                navigate('/insights');
              }
            }, 3000);
          }
        })
        .catch(err => {
          console.error('TikTok API error:', err);
          setError('Failed to connect to TikTok.');
        })
        .finally(() => setLoading(false));
    }
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
        <div style={{ fontSize: 24, marginBottom: 20 }}>🔗 {status}</div>
        <div style={{ fontSize: 16, color: '#888' }}>Please wait while we process your authorization.</div>
        <div style={{ marginTop: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #333',
            borderTop: '3px solid #25F4EE',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
      
      <div style={{
        background: 'linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        maxWidth: 600,
        textAlign: 'center'
      }}>
        <h3 style={{ color: 'white', marginBottom: 16, margin: 0 }}>🎉 Ready for Automated Publishing!</h3>
        <div style={{ fontSize: 14, color: 'white', opacity: 0.9 }}>
          Your TikTok account is now connected and ready for automated content publishing.
        </div>
      </div>
      
      <div style={{ fontSize: 16, color: '#888', marginBottom: 20 }}>
        {window.opener ? 'Closing popup...' : 'Redirecting you back...'}
      </div>
      
      <button 
        onClick={() => window.location.href = '/clients'}
        style={{
          background: '#25F4EE',
          color: '#000',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: 16,
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Go to Clients
      </button>
    </div>
  );
}
