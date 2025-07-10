import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './config/api';
import './OpenAIChat.css';

const OpenAIChat = ({ userId }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user conversations on mount
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          title: 'New Chat'
        }),
      });

      if (response.ok) {
        const newConversation = await response.json();
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        setMessages(newConversation.messages || []);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    
    // Load full conversation details
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversation.id}`);
      if (response.ok) {
        const fullConversation = await response.json();
        setMessages(fullConversation.messages || []);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update messages with the full conversation
        setMessages(data.conversation.messages || []);
        
        // Update the conversation in the list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id 
              ? { ...conv, messages: data.conversation.messages, updated_at: data.conversation.updated_at }
              : conv
          )
        );
      } else {
        // Remove the user message if the API call failed
        setMessages(prev => prev.slice(0, -1));
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
      alert('Error sending message. Please try again.');
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

  const deleteConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        
        // If the deleted conversation was the current one, clear it
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="openai-chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Chat History</h3>
          <button onClick={createNewConversation} className="new-chat-btn">
            + New Chat
          </button>
        </div>
        
        <div className="conversations-list">
          {isLoadingConversations ? (
            <div className="loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">No conversations yet</div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
                onClick={() => selectConversation(conversation)}
              >
                <div className="conversation-title">{conversation.title}</div>
                <div className="conversation-date">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="delete-conversation-btn"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <h3>{currentConversation.title}</h3>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <h4>Start a conversation</h4>
                  <p>Send a message to begin chatting with AI</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`message ${message.role}`}>
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                      <div className="message-time">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="message assistant">
                  <div className="message-content">
                    <div className="message-text">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="chat-input"
                  rows="1"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="send-button"
                >
                  {isLoading ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            <h3>Welcome to AI Chat</h3>
            <p>Select a conversation from the sidebar or create a new one to start chatting.</p>
            <button onClick={createNewConversation} className="create-first-chat-btn">
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenAIChat;
