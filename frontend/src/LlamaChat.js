import React, { useState, useRef, useEffect } from 'react';
import './styles/LlamaChat.css';
import { API_BASE_URL } from './config/api';

const LlamaChat = ({ userId }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Create new conversation
  const createNewConversation = async () => {
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
              content: 'You are a helpful AI assistant powered by Llama. Be concise and helpful.'
            }
          ],
          max_tokens: 1,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const newConv = {
          id: Date.now().toString(),
          title: 'New Chat',
          created_at: new Date(),
          messages: []
        };
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversation(newConv);
        setMessages([]);
        setError('');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create new conversation');
    }
  };

  // Send message to Llama
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    // If no current conversation, create one
    if (!currentConversation) {
      await createNewConversation();
    }

    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Prepare conversation history for Llama
      const conversationHistory = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant powered by Llama. Be concise and helpful.'
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage.content
        }
      ];

      const response = await fetch('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'phi-3-mini',
          messages: conversationHistory,
          max_tokens: 512,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation title if it's the first message
      if (currentConversation && currentConversation.title === 'New Chat') {
        const updatedConv = {
          ...currentConversation,
          title: message.trim().substring(0, 30) + (message.trim().length > 30 ? '...' : '')
        };
        setCurrentConversation(updatedConv);
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversation.id ? updatedConv : conv
        ));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Make sure Llama server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages || []);
    setError('');
  };

  // Initialize with first conversation on component mount
  useEffect(() => {
    createNewConversation();
  }, []);

  return (
    <div className="llama-chat-container">
      {/* Sidebar */}
      <div className="llama-chat-sidebar">
        <div className="sidebar-header">
          <h2>🦙 Llama Chat</h2>
          <button 
            className="new-chat-btn"
            onClick={createNewConversation}
            title="New Chat"
          >
            +
          </button>
        </div>
        
        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv)}
            >
              <div className="conversation-title">{conv.title}</div>
              <div className="conversation-time">
                {formatTimestamp(conv.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="llama-chat-main">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <h3>{currentConversation.title}</h3>
              <div className="model-info">
                <span className="model-badge">Phi-3 Mini</span>
              </div>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="llama-icon">🦙</div>
                  <h4>Start chatting with Llama!</h4>
                  <p>Ask me anything - I'm powered by Phi-3 Mini running locally</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}`}>
                    <div className="message-content">
                      <div className="message-text">{msg.content}</div>
                      <div className="message-time">
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="message assistant loading">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message Llama..."
                  disabled={isLoading}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  className="send-button"
                >
                  {isLoading ? '⏳' : '➤'}
                </button>
              </div>
              <div className="input-hint">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            <div className="llama-icon">🦙</div>
            <h3>Welcome to Llama Chat</h3>
            <p>Create a new conversation to start chatting</p>
            <button className="create-first-chat" onClick={createNewConversation}>
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LlamaChat;
