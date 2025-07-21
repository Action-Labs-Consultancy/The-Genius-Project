import React, { useState, useEffect, useRef } from 'react';
import './styles/LlamaRAGChat.css';

const LlamaRAGChat = ({ userId, className = '', onClose = null, isModal = false }) => {
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
  const RAG_API_URL = 'http://localhost:8000';

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
      const response = await fetch(`${RAG_API_URL}/health`);
      if (response.ok) {
        setIsConnected(true);
        setError(null);
      } else {
        setError('RAG server not responding');
      }
    } catch (err) {
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
      const response = await fetch(`${RAG_API_URL}/chat/fast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      const botMessage = {
        id: Date.now() + 1,
        content: data.response,
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

  const clearChat = () => {
    createNewChat();
  };

  const containerClass = `llama-rag-chat ${className} ${isModal ? 'modal-style' : ''}`;

  return (
    <div className={containerClass} style={{height: '100vh', width: '100vw'}}>
      {/* Header spanning full width */}
      <div className="chat-header">
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
        <div className="header-actions">
          {onClose && (
            <button 
              onClick={onClose} 
              className="close-btn"
              title="Close chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {/* Flex row: sidebar + chat */}
      <div className="chat-row-layout">
        {/* Sidebar */}
        <div className={`chat-sidebar${sidebarVisible ? '' : ' closed'}`}>
          <div className="sidebar-header">
            <button 
              onClick={createNewChat} 
              className="new-chat-btn"
              title="Start new chat"
            >
              <i className="fas fa-plus"></i>
              New Chat
            </button>
          </div>
          <div className="chat-list">
            <div className="chat-list-header">
              <h4>Recent Chats</h4>
            </div>
            <div className="chat-items">
              {chatHistory.length === 0 ? (
                <div className="no-chats">No chats yet</div>
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
        {/* Main Chat Area */}
        <div className="chat-main">
          <button 
            className="sidebar-toggle-inside"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            aria-label="Toggle sidebar"
          >
            <i className={`fas ${sidebarVisible ? 'fa-angle-left' : 'fa-bars'}`}></i>
          </button>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={checkConnection} className="retry-btn">
              Retry
            </button>
          </div>
        )}

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">🦙</div>
            <h4>Welcome to RAG Assistant!</h4>
            <p>Ask me anything about your documents. I'll search through your knowledge base to provide accurate answers.</p>
            <div className="sample-questions">
              <p><strong>Try asking:</strong></p>
              <ul>
                <li>"What is this about?"</li>
                <li>"Summarize the main points"</li>
                <li>"How does this work?"</li>
              </ul>
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

        {/* Input Form */}
        <form onSubmit={sendMessage} className="input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isConnected ? "Ask me anything..." : "Connecting..."}
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
