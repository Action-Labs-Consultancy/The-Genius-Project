import React, { useState, useEffect, useRef } from 'react';
import HeaderBar from './HeaderBar';
import './styles/LlamaRAGChat.css';

const LlamaRAGChat = ({ userId, className = '', onClose = null, isModal = false, user, onLogout, onLogoClick, onNavigate }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const API_URL = process.env.REACT_APP_LLAMA_API_URL || 'http://localhost:8000';

  // Initialize chat history and current chat on mount
  useEffect(() => {
    loadChatHistory();
    checkConnection();
    
    // Hide sidebar by default on mobile
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarVisible(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const saved = localStorage.getItem(`chatHistory_${userId || 'default'}`);
      const history = saved ? JSON.parse(saved) : [];
      setChatHistory(history);
      
      // Load the most recent chat or create a new one
      if (history.length > 0) {
        const recentChat = history[0];
        setCurrentChatId(recentChat.id);
        setMessages(recentChat.messages || []);
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      createNewChat();
    }
  };

  // Save chat history to localStorage
  const saveChatHistory = (history) => {
    try {
      localStorage.setItem(`chatHistory_${userId || 'default'}`, JSON.stringify(history));
      setChatHistory(history);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  // Create a new chat
  const createNewChat = () => {
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentChatId(newChatId);
    setMessages([]);
    
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    const updatedHistory = [newChat, ...chatHistory];
    saveChatHistory(updatedHistory);
  };

  // Update current chat with new messages
  const updateCurrentChat = (newMessages) => {
    if (!currentChatId) return;
    
    const updatedHistory = chatHistory.map(chat => {
      if (chat.id === currentChatId) {
        const updatedChat = {
          ...chat,
          messages: newMessages,
          updated: new Date().toISOString()
        };
        
        // Update title if this is the first user message
        if (newMessages.length === 1 && newMessages[0].sender === 'user') {
          updatedChat.title = generateChatTitle(newMessages[0].content);
        }
        
        return updatedChat;
      }
      return chat;
    });
    
    saveChatHistory(updatedHistory);
  };

  // Generate chat title from first message
  const generateChatTitle = (firstMessage) => {
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
  };

  // Load a specific chat
  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    setCurrentChatId(chatId);
    setMessages(chat.messages || []);
    
    // Close sidebar on mobile after selecting a chat
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  // Delete a chat
  const deleteChat = (chatId) => {
    const updatedHistory = chatHistory.filter(c => c.id !== chatId);
    saveChatHistory(updatedHistory);
    // If we deleted the current chat, switch to the next available chat or create a new one
    if (currentChatId === chatId) {
      if (updatedHistory.length > 0) {
        setCurrentChatId(updatedHistory[0].id);
        setMessages(updatedHistory[0].messages || []);
      } else {
        createNewChat();
      }
    }
  };

  // Update messages and save to chat history
  useEffect(() => {
    if (messages.length > 0) {
      updateCurrentChat(messages);
    }
  }, [messages]);

  const checkConnection = async () => {
    try {
      console.log('Checking connection to:', `${API_URL}/health`);
      const response = await fetch(`${API_URL}/health`);
      console.log('Response status:', response.status);
      if (response.ok) {
        setIsConnected(true);
        setError(null);
        console.log('Connection successful');
      } else {
        setError('RAG server not responding');
        console.log('Server not responding');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError('Cannot connect to RAG server');
      setIsConnected(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      // Use /completion endpoint for Llama chat
      const response = await fetch(`${API_URL}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Use data.completion for Llama response
      const botMessage = {
        id: Date.now() + 1,
        content: data.completion || data.response || 'No response',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        processingTime: data.processing_time,
        responseTime: responseTime
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="llama-rag-chat" style={{position: 'fixed', inset: 0, height: '100vh', width: '100vw', zIndex: 9999, display: 'flex', flexDirection: 'column'}}>
      {/* HeaderBar at the top */}
      <HeaderBar user={user} onLogout={onLogout} onLogoClick={onLogoClick} onNavigate={onNavigate} />
      
      {/* Flex row: sidebar + chat below header */}
      <div style={{display: 'flex', flex: 1, minHeight: 0}}>
        {/* Sidebar under header, can be toggled */}
        {sidebarVisible && (
          <div className={`chat-sidebar`} style={{height: '100%', transition: 'transform 0.2s', zIndex: 1}}>
            <div className="sidebar-header">
              <button 
                onClick={createNewChat} 
                className="new-chat-btn"
                title="Start new chat"
              >
                <i className="fas fa-plus"></i>
                New chat
              </button>
              <button 
                className="sidebar-toggle"
                onClick={() => setSidebarVisible(false)}
                title="Hide sidebar"
              >
                <i className="fas fa-angle-left"></i>
              </button>
            </div>
            <div className="chat-list">
              <div className="chat-list-header">
                <h4>Recent</h4>
              </div>
              <div className="chat-items">
                {chatHistory.length === 0 ? (
                  <div className="no-chats">No conversations yet</div>
                ) : (
                  chatHistory.map(chat => (
                    <div 
                      key={chat.id} 
                      className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                      onClick={() => loadChat(chat.id)}
                    >
                      <div className="chat-title">{chat.title}</div>
                      <div className="chat-date">
                        {new Date(chat.updated).toLocaleDateString()}
                      </div>
                      <button 
                        className="delete-chat-btn"
                        onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
                        title="Delete chat"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Main Chat Area */}
        <div className="chat-main" style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0}}>
          {/* Chat Header with toggle button */}
          <div className="chat-header" style={{flexShrink: 0, zIndex: 2, position: 'relative'}}>
            {!sidebarVisible && (
              <button 
                className="sidebar-toggle-inside"
                onClick={() => setSidebarVisible(true)}
                title="Show sidebar"
              >
                <i className="fas fa-bars"></i>
              </button>
            )}
            <div className="header-left">
              <span className="llama-icon">🦙</span>
              <div className="header-info">
                <h3>RAG Assistant</h3>
                <div className="connection-status">
                  <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                  <span className="status-text">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={checkConnection} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="messages-container">
            <div className="messages-wrapper">
              {messages.length === 0 && (
                <div className="welcome-message">
                  <div className="welcome-icon">🦙</div>
                  <h4>How can I help you today?</h4>
                  <p>I'm your RAG assistant. Ask me anything about your documents and I'll search through your knowledge base to provide accurate answers.</p>
                  <div className="sample-questions">
                    <div className="sample-question" onClick={() => setInputMessage("What is this about?")}>
                      <p>What is this about?</p>
                    </div>
                    <div className="sample-question" onClick={() => setInputMessage("Summarize the main points")}>
                      <p>Summarize the main points</p>
                    </div>
                    <div className="sample-question" onClick={() => setInputMessage("How does this work?")}>
                      <p>How does this work?</p>
                    </div>
                    <div className="sample-question" onClick={() => setInputMessage("Tell me more details")}>
                      <p>Tell me more details</p>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-meta">
                    <span className="timestamp">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.processingTime && (
                      <span className="processing-time">
                        ⚡ {message.processingTime}s
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message bot loading">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="loading-text">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={sendMessage} className="input-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isConnected ? "Message RAG Assistant..." : "Connecting..."}
                className="message-input"
                disabled={!isConnected || isLoading}
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!inputMessage.trim() || !isConnected || isLoading}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LlamaRAGChat;
