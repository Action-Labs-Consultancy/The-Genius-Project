import React, { useState, useEffect } from 'react';
import LlamaRAGChat from './LlamaRAGChat';
import './styles/LlamaChat.css';

const LlamaChat = ({ userId }) => {
  const [mode, setMode] = useState('rag'); // 'rag' or 'original'
  const [showModeSelector, setShowModeSelector] = useState(true);

  return (
    <div className="llama-chat-container">
      {/* Mode Selector */}
      {showModeSelector && (
        <div className="mode-selector-banner">
          <div className="mode-content">
            <h3>🦙 Choose Your Chat Mode</h3>
            <div className="mode-options">
              <button 
                className={`mode-btn ${mode === 'rag' ? 'active' : ''}`}
                onClick={() => setMode('rag')}
              >
                <span className="mode-icon">🧠</span>
                <div className="mode-info">
                  <strong>RAG Assistant</strong>
                  <small>Search through documents for answers</small>
                </div>
              </button>
              <button 
                className={`mode-btn ${mode === 'original' ? 'active' : ''}`}
                onClick={() => setMode('original')}
              >
                <span className="mode-icon">💬</span>
                <div className="mode-info">
                  <strong>General Chat</strong>
                  <small>Free-form conversation</small>
                </div>
              </button>
            </div>
            <button 
              className="close-selector"
              onClick={() => setShowModeSelector(false)}
            >
              Continue with RAG Assistant →
            </button>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="chat-interface">
        {mode === 'rag' ? (
          <LlamaRAGChat 
            userId={userId} 
            className="embedded-rag-chat"
          />
        ) : (
          <OriginalLlamaChat userId={userId} />
        )}
      </div>

      {/* Quick Switch */}
      {!showModeSelector && (
        <div className="quick-switch">
          <button 
            onClick={() => setShowModeSelector(true)}
            className="switch-mode-btn"
          >
            Switch Mode
          </button>
        </div>
      )}
    </div>
  );
};

// Simplified original chat component (keeping your existing functionality)
const OriginalLlamaChat = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'phi-3-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Be concise and helpful.'
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage.content
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          id: Date.now() + 1,
          content: data.choices[0].message.content,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="original-chat">
      <div className="chat-header">
        <h3>💬 General Chat</h3>
      </div>
      <div className="messages-area">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">Thinking...</div>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default LlamaChat;
