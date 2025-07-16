import React from 'react';

// This file is now obsolete. The ConnectTikTokButton is imported from the main src directory.

const ConnectTikTokButton = ({ onConnect }) => {
  const handleConnect = () => {
    // Placeholder: Add your TikTok OAuth or connection logic here
    alert('TikTok connect logic goes here!');
    if (onConnect) onConnect();
  };

  return (
    <button
      style={{
        background: 'linear-gradient(90deg, #000 0%, #25F4EE 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 22px',
        fontWeight: 700,
        fontSize: 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 2px 8px #0002',
        marginLeft: 8
      }}
      onClick={handleConnect}
      aria-label="Connect TikTok"
    >
      <span style={{ fontSize: 22 }}>🎵</span> Connect TikTok
    </button>
  );
};

export default ConnectTikTokButton;
