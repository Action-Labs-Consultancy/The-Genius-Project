import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  FileText, 
  Search, 
  MessageSquare,
  Database,
  Zap,
  User,
  Bot,
  Star,
  Clock
} from 'lucide-react';
import './AIBrainsPage.css';

const AIBrainsPage = () => {
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [newBrain, setNewBrain] = useState({
    name: '',
    prompt: '',
    personality: 'assistant',
    description: ''
  });

  const PERSONALITIES = {
    'assistant': {
      label: 'Professional Assistant',
      description: 'Helpful, professional, and efficient',
      icon: User,
      color: '#059669'
    },
    'creative': {
      label: 'Creative Helper',
      description: 'Imaginative, artistic, and innovative',
      icon: Star,
      color: '#7C3AED'
    },
    'analytical': {
      label: 'Data Analyst',
      description: 'Logical, precise, and detail-oriented',
      icon: Database,
      color: '#2563EB'
    },
    'friendly': {
      label: 'Friendly Companion',
      description: 'Warm, empathetic, and supportive',
      icon: Bot,
      color: '#DC2626'
    },
    'expert': {
      label: 'Domain Expert',
      description: 'Knowledgeable, authoritative, and focused',
      icon: Brain,
      color: '#EF4444'
    },
    'coach': {
      label: 'Mentor/Coach',
      description: 'Supportive, motivational, and guiding',
      icon: Zap,
      color: '#06B6D4'
    }
  };

  useEffect(() => {
    loadBrains();
  }, []);

  const loadBrains = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:10000/api/brains');
      if (response.ok) {
        const data = await response.json();
        setBrains(data);
      } else {
        console.error('Failed to fetch brains');
      }
    } catch (error) {
      console.error('Failed to load brains:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBrain = async () => {
    try {
      const response = await fetch('http://localhost:10000/api/brains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBrain,
          created_at: new Date().toISOString(),
          knowledge_base: [],
          usage_stats: {
            total_conversations: 0,
            total_messages: 0,
            last_used: null
          }
        }),
      });

      if (response.ok) {
        const createdBrain = await response.json();
        setBrains([...brains, createdBrain]);
        setShowCreateModal(false);
        setNewBrain({ name: '', prompt: '', personality: 'assistant', description: '' });
      }
    } catch (error) {
      console.error('Failed to create brain:', error);
    }
  };

  const updateBrain = async () => {
    try {
      const response = await fetch(`http://localhost:10000/api/brains/${selectedBrain._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedBrain),
      });

      if (response.ok) {
        loadBrains();
        setShowEditModal(false);
        setSelectedBrain(null);
      }
    } catch (error) {
      console.error('Failed to update brain:', error);
    }
  };

  const deleteBrain = async (brainId) => {
    if (!window.confirm('Are you sure you want to delete this brain?')) return;

    try {
      const response = await fetch(`http://localhost:10000/api/brains/${brainId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBrains(brains.filter(brain => brain._id !== brainId));
      }
    } catch (error) {
      console.error('Failed to delete brain:', error);
    }
  };

  const uploadDocument = async () => {
    if (!uploadFile || !selectedBrain) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetch(`http://localhost:10000/api/brains/${selectedBrain._id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        loadBrains();
        setShowUploadModal(false);
        setUploadFile(null);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedBrain) return;

    setChatLoading(true);
    const userMessage = { role: 'user', content: chatMessage, timestamp: new Date() };
    setChatHistory([...chatHistory, userMessage]);

    try {
      const response = await fetch(`http://localhost:10000/api/brains/${selectedBrain._id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = { role: 'assistant', content: data.response, timestamp: new Date() };
        setChatHistory(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
    } finally {
      setChatLoading(false);
      setChatMessage('');
    }
  };

  const getPersonalityInfo = (personality) => {
    return PERSONALITIES[personality] || PERSONALITIES['assistant'];
  };

  const filteredBrains = brains.filter(brain => {
    const matchesSearch = brain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brain.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPersonality = !selectedPersonality || brain.personality === selectedPersonality;
    return matchesSearch && matchesPersonality;
  });

  return (
    <div className="ai-brains-page" style={{ backgroundColor: '#f8fafc', padding: '24px', minHeight: '100vh' }}>
      <div className="page-header" style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <div className="header-content">
          <div className="header-title">
            <Brain className="header-icon" style={{ color: '#6366f1' }} />
            <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px', fontWeight: 600 }}>AI Brains System</h1>
            <span className="brain-count" style={{ background: '#e0e7ff', color: '#6366f1', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 500 }}>{brains.length} brains</span>
          </div>
          <button 
            className="create-brain-btn"
            onClick={() => setShowCreateModal(true)}
            style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            <Plus size={18} />
            Create New Brain
          </button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search brains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="personality-filter"
            value={selectedPersonality}
            onChange={(e) => setSelectedPersonality(e.target.value)}
          >
            <option value="">All Personalities</option>
            {Object.entries(PERSONALITIES).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="brains-grid">
        {loading ? (
          <div className="loading-state">
            <Brain className="loading-icon" />
            <p>Loading brains...</p>
          </div>
        ) : filteredBrains.length === 0 ? (
          <div className="empty-state">
            <Brain className="empty-icon" />
            <p>No brains found. Create your first AI brain to get started!</p>
          </div>
        ) : (
          filteredBrains.map((brain) => {
            const personalityInfo = getPersonalityInfo(brain.personality);
            const PersonalityIcon = personalityInfo.icon;
            
            return (
              <div key={brain._id} className="brain-card">
                <div className="brain-header">
                  <div className="brain-personality" style={{ color: personalityInfo.color }}>
                    <PersonalityIcon size={20} />
                    <span>{personalityInfo.label}</span>
                  </div>
                  
                  <div className="brain-actions">
                    <button 
                      className="brain-action-btn"
                      onClick={() => {
                        setSelectedBrain(brain);
                        setShowEditModal(true);
                      }}
                      title="Edit Brain"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="brain-action-btn delete"
                      onClick={() => deleteBrain(brain._id)}
                      title="Delete Brain"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="brain-content">
                  <h3 className="brain-name">{brain.name}</h3>
                  {brain.description && (
                    <p className="brain-description">{brain.description}</p>
                  )}
                  
                  <div className="brain-stats">
                    <div className="stat-item">
                      <MessageSquare size={14} />
                      <span>{brain.usage_stats?.total_conversations || 0} chats</span>
                    </div>
                    <div className="stat-item">
                      <FileText size={14} />
                      <span>{brain.knowledge_base?.length || 0} docs</span>
                    </div>
                    {brain.usage_stats?.last_used && (
                      <div className="stat-item">
                        <Clock size={14} />
                        <span>Used {new Date(brain.usage_stats.last_used).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="brain-actions-row">
                    <button 
                      className="brain-btn primary"
                      onClick={() => {
                        setSelectedBrain(brain);
                        setChatHistory([]);
                        setShowChatModal(true);
                      }}
                    >
                      <MessageSquare size={16} />
                      Chat
                    </button>
                    <button 
                      className="brain-btn secondary"
                      onClick={() => {
                        setSelectedBrain(brain);
                        setShowUploadModal(true);
                      }}
                    >
                      <Upload size={16} />
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Brain Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New AI Brain</h2>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Brain Name"
                value={newBrain.name}
                onChange={(e) => setNewBrain({...newBrain, name: e.target.value})}
              />
              <textarea
                placeholder="Description"
                value={newBrain.description}
                onChange={(e) => setNewBrain({...newBrain, description: e.target.value})}
              />
              <select
                value={newBrain.personality}
                onChange={(e) => setNewBrain({...newBrain, personality: e.target.value})}
              >
                {Object.entries(PERSONALITIES).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
              <textarea
                placeholder="System Prompt"
                value={newBrain.prompt}
                onChange={(e) => setNewBrain({...newBrain, prompt: e.target.value})}
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button onClick={createBrain} disabled={!newBrain.name}>Create Brain</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Brain Modal */}
      {showEditModal && selectedBrain && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit AI Brain</h2>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Brain Name"
                value={selectedBrain.name}
                onChange={(e) => setSelectedBrain({...selectedBrain, name: e.target.value})}
              />
              <textarea
                placeholder="Description"
                value={selectedBrain.description || ''}
                onChange={(e) => setSelectedBrain({...selectedBrain, description: e.target.value})}
              />
              <select
                value={selectedBrain.personality}
                onChange={(e) => setSelectedBrain({...selectedBrain, personality: e.target.value})}
              >
                {Object.entries(PERSONALITIES).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
              <textarea
                placeholder="System Prompt"
                value={selectedBrain.prompt}
                onChange={(e) => setSelectedBrain({...selectedBrain, prompt: e.target.value})}
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button onClick={updateBrain}>Update Brain</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedBrain && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chat with {selectedBrain.name}</h2>
              <button onClick={() => setShowChatModal(false)}>×</button>
            </div>
            <div className="chat-container">
              <div className="chat-messages">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`message ${message.role}`}>
                    <div className="message-content">{message.content}</div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="message assistant loading">
                    <div className="message-content">Thinking...</div>
                  </div>
                )}
              </div>
              <div className="chat-input-container">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <button onClick={sendChatMessage} disabled={!chatMessage.trim() || chatLoading}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedBrain && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document to {selectedBrain.name}</h2>
              <button onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
                accept=".pdf,.txt,.doc,.docx"
              />
              {uploadFile && (
                <p>Selected: {uploadFile.name}</p>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button onClick={uploadDocument} disabled={!uploadFile}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBrainsPage;
