import React, { useState, useEffect, useRef } from 'react';

const LlamaRAGChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws');
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Connected to RAG chatbot');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        setIsTyping(false);
        console.log('Disconnected from RAG chatbot');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'typing':
        setIsTyping(true);
        break;
      case 'response':
        setIsTyping(false);
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.message,
          sources: data.sources || [],
          contextCount: data.context_count || 0,
          timestamp: new Date()
        }]);
        break;
      case 'error':
        setIsTyping(false);
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: `❌ ${data.message}`,
          timestamp: new Date()
        }]);
        break;
    }
  };

  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || !isConnected || isTyping) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: message,
      timestamp: new Date()
    }]);
    
    setInputValue('');
    setIsLoading(true);
    
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat',
          message: message
        }));
      } else {
        // Fallback to REST API if WebSocket is not available
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            max_tokens: 150,
            temperature: 0.3
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(prev => [...prev, {
            type: 'assistant',
            content: data.response,
            sources: data.sources || [],
            processingTime: data.processing_time,
            timestamp: new Date()
          }]);
        } else {
          throw new Error('Failed to get response');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: '❌ Sorry, there was an error processing your request. Make sure the RAG server is running on localhost:8000.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="llama-rag-chat">
      <style jsx>{`
        .llama-rag-chat {
          display: flex;
          flex-direction: column;
          height: 600px;
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-title {
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${isConnected ? '#4ade80' : '#ef4444'};
          box-shadow: 0 0 8px ${isConnected ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 80%;
          animation: slideIn 0.3s ease-out;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .message.user .message-avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message.assistant .message-avatar {
          background: #f3f4f6;
          color: #374151;
        }

        .message-content {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 16px;
          line-height: 1.5;
          position: relative;
          font-size: 14px;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message.assistant .message-content {
          background: #f3f4f6;
          color: #374151;
        }

        .message-meta {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 11px;
          opacity: 0.8;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f3f4f6;
          border-radius: 16px;
          color: #6b7280;
          font-style: italic;
          font-size: 14px;
        }

        .typing-dots {
          display: flex;
          gap: 3px;
        }

        .typing-dots span {
          width: 4px;
          height: 4px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        .input-container {
          padding: 16px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .input-form {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .input-field {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          resize: none;
          min-height: 20px;
          max-height: 100px;
          font-family: inherit;
        }

        .input-field:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .send-button {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: ${(inputValue.trim() && isConnected && !isTyping) ? 
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db'};
          color: white;
          cursor: ${(inputValue.trim() && isConnected && !isTyping) ? 'pointer' : 'not-allowed'};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .welcome-message {
          text-align: center;
          color: #6b7280;
          padding: 20px;
          font-size: 14px;
        }

        .welcome-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div className="chat-header">
        <div className="chat-title">
          🦙 LLaMA RAG Assistant
        </div>
        <div className="status-indicator"></div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-title">Ask me about your documents!</div>
            <div>I'll search through your knowledge base to provide accurate answers.</div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-avatar">
                {message.type === 'user' ? '👤' : '🦙'}
              </div>
              <div className="message-content">
                {message.content}
                {message.sources && message.sources.length > 0 && (
                  <div className="message-meta">
                    📚 Sources: {message.sources.join(', ')} 
                    {message.contextCount && ` (${message.contextCount} chunks)`}
                  </div>
                )}
                {message.processingTime && (
                  <div className="message-meta">
                    ⚡ Response time: {message.processingTime}s
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="message assistant">
            <div className="message-avatar">🦙</div>
            <div className="typing-indicator">
              Searching knowledge base...
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-form">
          <textarea
            className="input-field"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            rows="1"
            disabled={!isConnected || isTyping}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!inputValue.trim() || !isConnected || isTyping || isLoading}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LlamaRAGChat;
