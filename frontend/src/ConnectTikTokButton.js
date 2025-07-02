import React from 'react';

const TIKTOK_APP_ID = '7522384605962469377';
const REDIRECT_URI = encodeURIComponent('http://localhost:3000/tiktok-auth-callback');
const AUTH_URL = `https://business-api.tiktok.com/portal/auth?app_id=${TIKTOK_APP_ID}&state=your_custom_params&redirect_uri=${REDIRECT_URI}`;

export default function ConnectTikTokButton() {
  return (
    <button
      style={{
        background: 'linear-gradient(90deg, #25F4EE 0%, #FE2C55 100%)',
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
        <g>
          <path d="M34.5 6.5C34.5 4.01472 36.5147 2 39 2C41.4853 2 43.5 4.01472 43.5 6.5V41.5C43.5 43.9853 41.4853 46 39 46C36.5147 46 34.5 43.9853 34.5 41.5V6.5Z" fill="#25F4EE"/>
          <path d="M8.5 6.5C8.5 4.01472 10.5147 2 13 2C15.4853 2 17.5 4.01472 17.5 6.5V41.5C17.5 43.9853 15.4853 46 13 46C10.5147 46 8.5 43.9853 8.5 41.5V6.5Z" fill="#FE2C55"/>
          <path d="M24 2C26.4853 2 28.5 4.01472 28.5 6.5V41.5C28.5 43.9853 26.4853 46 24 46C21.5147 46 19.5 43.9853 19.5 41.5V6.5C19.5 4.01472 21.5147 2 24 2Z" fill="#fff"/>
        </g>
      </svg>
      Connect TikTok
    </button>
  );
}
