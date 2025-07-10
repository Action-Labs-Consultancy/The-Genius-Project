import React, { useState, useRef, useEffect } from 'react';
import './styles/LlamaChat.css';

const LlamaChat = ({ userId }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, streamingContent]);

  // Check if Llama server is running
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      setIsConnected(response.ok);
      if (!response.ok) {
        setError('Llama server is not responding. Please make sure it\'s running on port 8000.');
      } else {
        setError('');
      }
    } catch (error) {
      setIsConnected(false);
      setError('Cannot connect to Llama server. Please start the llama-server on port 8000.');
    }
  };

  // Check connection on mount and periodically
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Create new conversation
  const createNewConversation = async () => {
    const newConv = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      created_at: new Date(),
      messages: []
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(newConv);
    setMessages([]);
    setError('');
  };

  // Delete conversation
  const deleteConversation = (convId) => {
    setConversations(prev => prev.filter(conv => conv.id !== convId));
    if (currentConversation?.id === convId) {
      const remaining = conversations.filter(conv => conv.id !== convId);
      if (remaining.length > 0) {
        selectConversation(remaining[0]);
      } else {
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  };

  // Send message to Llama with streaming support
  const sendMessage = async () => {
    if (!message.trim() || isLoading || !isConnected) return;

    // If no current conversation, create one
    if (!currentConversation) {
      await createNewConversation();
    }

    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setStreamingContent(''); // Reset streaming content
    
    // Update conversation with user message
    const updatedConv = {
      ...currentConversation,
      messages: newMessages
    };
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversation.id ? updatedConv : conv
    ));

    setMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Prepare conversation history for Llama
      const conversationHistory = [
        {
          role: 'system',
          content: 'You are Llama, a helpful AI assistant. Be concise, informative, and friendly. Format your responses clearly with proper spacing and structure when needed.'
        },
        ...newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await fetch('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'phi-3-mini',
          messages: conversationHistory,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
          stream: true // Enable streaming
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                setStreamingContent(prev => prev + content);
              }
            } catch (e) {
              console.warn('Error parsing streaming data:', e);
            }
          }
        }
      }

      // Create final assistant message
      const assistantMessage = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingContent(''); // Clear streaming content

      // Update conversation title if it's the first message
      let finalConv = updatedConv;
      if (currentConversation && currentConversation.title === 'New Chat') {
        finalConv = {
          ...updatedConv,
          title: userMessage.content.substring(0, 40) + (userMessage.content.length > 40 ? '...' : ''),
          messages: finalMessages
        };
        setCurrentConversation(finalConv);
      } else {
        finalConv = {
          ...updatedConv,
          messages: finalMessages
        };
      }

      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id ? finalConv : conv
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please check if Llama server is running on port 8000.');
      setIsConnected(false);
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
    setStreamingContent(''); // Clear any streaming content
    setError('');
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Initialize with first conversation on component mount
  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, []);

  return (
    <div className="llama-chat-container">
      {/* Sidebar */}
      <div className="llama-chat-sidebar">
        <div className="sidebar-header">
          <h2>🦙 Llama Chat</h2>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button 
            className="new-chat-btn"
            onClick={createNewConversation}
            title="New Chat"
            disabled={!isConnected}
          >
            +
          </button>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <button 
                className="start-first-chat"
                onClick={createNewConversation}
                disabled={!isConnected}
              >
                Start Your First Chat
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              >
                <div 
                  className="conversation-content"
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conversation-title">{conv.title}</div>
                  <div className="conversation-preview">
                    {conv.messages.length > 0 
                      ? conv.messages[conv.messages.length - 1].content.substring(0, 50) + '...'
                      : 'No messages yet'
                    }
                  </div>
                  <div className="conversation-time">
                    {formatTimestamp(conv.created_at)}
                  </div>
                </div>
                <button
                  className="delete-conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  title="Delete conversation"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="llama-chat-main">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <h3>{currentConversation.title}</h3>
              <div className="model-info">
                <span className="model-badge">Phi-3 Mini (Local)</span>
                <span className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="llama-icon">🦙</div>
                  <h4>Start chatting with Llama!</h4>
                  <p>I'm powered by Phi-3 Mini running locally on your machine</p>
                  <div className="quick-suggestions">
                    <button 
                      className="suggestion-btn"
                      onClick={() => setMessage("Hello! How can you help me today?")}
                      disabled={!isConnected}
                    >
                      👋 Say hello
                    </button>
                    <button 
                      className="suggestion-btn"
                      onClick={() => setMessage("Explain quantum computing in simple terms")}
                      disabled={!isConnected}
                    >
                      🔬 Ask about science
                    </button>
                    <button 
                      className="suggestion-btn"
                      onClick={() => setMessage("Help me write a creative story")}
                      disabled={!isConnected}
                    >
                      ✍️ Creative writing
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                      <div className="message-avatar">
                        {msg.role === 'user' ? '👤' : '🦙'}
                      </div>
                      <div className="message-content">
                        <div className="message-text">{msg.content}</div>
                        <div className="message-time">
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Streaming message */}
                  {streamingContent && (
                    <div className="message assistant streaming">
                      <div className="message-avatar">🦙</div>
                      <div className="message-content">
                        <div className="message-text">{streamingContent}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {isLoading && !streamingContent && (
                <div className="message assistant loading">
                  <div className="message-avatar">🦙</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="typing-text">Llama is thinking...</div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <div>
                    <strong>Connection Error:</strong><br />
                    {error}
                    <button 
                      className="retry-btn"
                      onClick={checkConnection}
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyPress={handleKeyPress}
                  placeholder={isConnected ? "Message Llama..." : "Connect to Llama server first..."}
                  disabled={isLoading || !isConnected}
                  rows={1}
                  style={{ resize: 'none', overflow: 'hidden' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading || !isConnected}
                  className="send-button"
                  title="Send message"
                >
                  {isLoading ? '⏳' : '➤'}
                </button>
              </div>
              <div className="input-hint">
                {isConnected 
                  ? "Press Enter to send, Shift+Enter for new line" 
                  : "Start the Llama server to begin chatting"
                }
              </div>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            <div className="llama-icon">🦙</div>
            <h3>Welcome to Llama Chat</h3>
            <p>Your local AI assistant powered by Phi-3 Mini</p>
            <button 
              className="create-first-chat" 
              onClick={createNewConversation}
              disabled={!isConnected}
            >
              {isConnected ? 'Start New Chat' : 'Connect to Llama Server First'}
            </button>
            {!isConnected && (
              <div className="server-instructions">
                <h4>🚀 Start the Llama Server:</h4>
                <code>cd llama.cpp/build/bin && ./llama-server --model /path/to/your/model.gguf --port 8000</code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LlamaChat;
