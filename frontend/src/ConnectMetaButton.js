import React from 'react';

const META_APP_ID = '123456789'; // Replace with actual Meta App ID
const REDIRECT_URI = encodeURIComponent(window.location.origin + '/meta-auth-callback');
const AUTH_URL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&state=${encodeURIComponent(window.location.href)}&scope=ads_read,pages_read_engagement,instagram_basic,instagram_manage_insights`;

export default function ConnectMetaButton({ user, connected }) {
  if (connected) {
    return (
      <button
        style={{
          background: 'linear-gradient(90deg, #1877F2 0%, #42B883 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '12px 28px',
          fontWeight: 800,
          fontSize: 18,
          cursor: 'default',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 2px 12px #0002',
          opacity: 0.7
        }}
        disabled
      >
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm0 36c-8.837 0-16-7.163-16-16S15.163 8 24 8s16 7.163 16 16-7.163 16-16 16z" fill="#fff"/>
          <path d="M20.5 15.5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        ✓ Meta Connected
      </button>
    );
  }

  return (
    <button
      style={{
        background: 'linear-gradient(90deg, #1877F2 0%, #42B883 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '12px 28px',
        fontWeight: 800,
        fontSize: 18,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 2px 12px #0002',
        transition: 'transform 0.1s',
        marginLeft: 12
      }}
      onClick={() => window.location.href = AUTH_URL}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20c.329 0 .656-.008.979-.024V29.833h-4.396V24h4.396v-4.548c0-4.346 2.666-6.612 6.436-6.612 1.933 0 3.969.345 3.969.345v4.365h-2.238c-2.203 0-2.888 1.368-2.888 2.771V24h4.919l-.786 5.833h-4.133v14.143C35.046 42.954 44 34.046 44 24 44 12.954 35.046 4 24 4z" fill="#fff"/>
      </svg>
      Connect Meta
    </button>
  );
}
