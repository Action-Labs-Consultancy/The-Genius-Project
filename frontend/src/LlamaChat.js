import React from 'react';
import LlamaRAGChat from './LlamaRAGChat_fixed';
import './styles/LlamaChat.css';

// Debug: Log which component is being loaded
console.log('LlamaChat loading LlamaRAGChat_fixed component');

const LlamaChat = ({ userId, user, onLogout, onLogoClick, onNavigate }) => {
  return (
    <div style={{height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 1000, background: '#212121'}}>
      <LlamaRAGChat 
        userId={userId} 
        className="embedded-rag-chat"
        user={user}
        onLogout={onLogout}
        onLogoClick={onLogoClick}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default LlamaChat;
