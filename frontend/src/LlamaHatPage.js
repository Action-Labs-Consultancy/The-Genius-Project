import React, { useState } from 'react';
import LlamaRAGChat from './LlamaRAGChat';
import './styles/LlamaHatPage.css';

const LlamaHatPage = ({ userId }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="llama-hat-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="llama-hat-logo">
            <span className="llama">🦙</span>
            <span className="hat">🎩</span>
          </div>
          <h1>Llama Hat AI</h1>
          <p className="hero-subtitle">
            Your intelligent document companion powered by advanced RAG technology
          </p>
          <div className="hero-features">
            <div className="feature">
              <span className="feature-icon">🧠</span>
              <span>Smart Document Search</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>Lightning Fast Responses</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>Accurate Answers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-grid">
          {/* Chat Section */}
          <div className={`chat-section ${isMinimized ? 'minimized' : ''}`}>
            <div className="section-header">
              <h2>Chat with Your Documents</h2>
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="minimize-btn"
              >
                {isMinimized ? '📖' : '📘'}
              </button>
            </div>
            <div className="chat-container">
              <LlamaRAGChat 
                userId={userId}
                className="hat-page-chat"
              />
            </div>
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <div className="panel-tabs">
              <button 
                className={`tab ${!showDocs ? 'active' : ''}`}
                onClick={() => setShowDocs(false)}
              >
                📊 Stats
              </button>
              <button 
                className={`tab ${showDocs ? 'active' : ''}`}
                onClick={() => setShowDocs(true)}
              >
                📁 Documents
              </button>
            </div>

            <div className="panel-content">
              {!showDocs ? (
                <SystemStats />
              ) : (
                <DocumentList />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <p>
          🦙 Powered by <strong>Llama</strong> + <strong>ChromaDB</strong> + <strong>LangChain</strong>
        </p>
      </div>
    </div>
  );
};

// System Stats Component
const SystemStats = () => {
  const [stats, setStats] = useState({
    status: 'Loading...',
    vector_db_count: 0,
    model: 'mistral',
    ready: false
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/status');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="system-stats">
      <h3>System Status</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Status</span>
          <span className={`stat-value ${stats.ready ? 'ready' : 'loading'}`}>
            {stats.ready ? '🟢 Ready' : '🟡 Loading'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Model</span>
          <span className="stat-value">🤖 {stats.model}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Documents</span>
          <span className="stat-value">📄 {stats.vector_db_count}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Performance</span>
          <span className="stat-value">⚡ Optimized</span>
        </div>
      </div>
      
      <div className="performance-tips">
        <h4>Performance Info</h4>
        <ul>
          <li>✅ Fast retrieval with ChromaDB</li>
          <li>✅ Optimized embeddings</li>
          <li>✅ Reduced context for speed</li>
          <li>✅ Cached responses</li>
        </ul>
      </div>
    </div>
  );
};

// Document List Component
const DocumentList = () => {
  return (
    <div className="document-list">
      <h3>Available Documents</h3>
      <div className="doc-items">
        <div className="doc-item">
          <span className="doc-icon">📄</span>
          <div className="doc-info">
            <span className="doc-name">user_guide.txt</span>
            <span className="doc-type">Text Document</span>
          </div>
        </div>
        <div className="doc-item">
          <span className="doc-icon">📋</span>
          <div className="doc-info">
            <span className="doc-name">technical_docs.txt</span>
            <span className="doc-type">Technical Manual</span>
          </div>
        </div>
      </div>
      
      <div className="add-docs-info">
        <h4>Add More Documents</h4>
        <p>To add documents to your knowledge base:</p>
        <ol>
          <li>Place files in <code>rag-app/data/</code></li>
          <li>Run <code>python ingest.py</code></li>
          <li>Restart the web server</li>
        </ol>
      </div>
    </div>
  );
};

export default LlamaHatPage;
