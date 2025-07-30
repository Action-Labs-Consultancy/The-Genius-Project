import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Bot, 
  Edit3, 
  Trash2, 
  Upload, 
  FileText, 
  MessageCircle,
  Users,
  Settings,
  Activity,
  Database,
  Zap,
  Send,
  Eye,
  Download
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import './BrainDetailView.css';

const BrainDetailView = ({ brain, user, onBack }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agents');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showEditAgentModal, setShowEditAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDocumentViewModal, setShowDocumentViewModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newAgent, setNewAgent] = useState({
    agent_name: '',
    role_description: '',
    system_prompt: '',
    personality: 'professional',
    temperature: 0.7,
    model: 'gpt-3.5-turbo',
    tools: []
  });

  const PERSONALITIES = {
    'professional': 'Professional & Efficient',
    'creative': 'Creative & Innovative',
    'analytical': 'Analytical & Precise',
    'friendly': 'Friendly & Supportive',
    'expert': 'Domain Expert',
    'coach': 'Mentor & Coach'
  };

  const AVAILABLE_TOOLS = [
    'web_search',
    'calculator',
    'data_analysis',
    'file_processor',
    'email_sender',
    'calendar_manager'
  ];

  useEffect(() => {
    loadAgents();
  }, [brain._id]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/brains/${brain._id}/agents`);
      
      if (response.ok) {
        const result = await response.json();
        setAgents(result.success ? result.data : []);
      } else {
        console.error('Failed to fetch agents');
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    try {
      if (!newAgent.agent_name.trim() || !newAgent.role_description.trim() || !newAgent.system_prompt.trim()) {
        alert('Agent name, role description, and system prompt are required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/brains/${brain._id}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAgent,
          user_id: user?.id
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setAgents([...agents, result.data]);
        setShowCreateAgentModal(false);
        setNewAgent({
          agent_name: '',
          role_description: '',
          system_prompt: '',
          personality: 'professional',
          temperature: 0.7,
          model: 'gpt-3.5-turbo',
          tools: []
        });
        alert('Agent created successfully!');
      } else {
        alert(result.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent: ' + error.message);
    }
  };

  const updateAgent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${selectedAgent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedAgent),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setAgents(agents.map(agent => 
          agent._id === selectedAgent._id ? result.data : agent
        ));
        setShowEditAgentModal(false);
        setSelectedAgent(null);
        alert('Agent updated successfully!');
      } else {
        alert(result.error || 'Failed to update agent');
      }
    } catch (error) {
      console.error('Failed to update agent:', error);
      alert('Failed to update agent: ' + error.message);
    }
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent? This will also delete all its documents and conversation history.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAgents(agents.filter(agent => agent._id !== agentId));
        alert('Agent deleted successfully');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete agent');
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert('Failed to delete agent: ' + error.message);
    }
  };

  const uploadDocument = async (agentId, file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`Document uploaded successfully! Created ${result.data.chunks_created} text chunks.`);
        // Refresh agent data
        loadAgents();
      } else {
        alert(result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const chatWithAgent = async (agentId, message) => {
    try {
      setChatState(prev => ({
        ...prev,
        loading: true,
        messages: [...prev.messages, { type: 'user', content: message }]
      }));

      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setChatState(prev => ({
          ...prev,
          loading: false,
          messages: [...prev.messages, { type: 'agent', content: result.data.response }],
          currentMessage: ''
        }));
      } else {
        alert(result.error || 'Failed to get response from agent');
        setChatState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to chat with agent:', error);
      alert('Failed to chat with agent: ' + error.message);
      setChatState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSendMessage = () => {
    if (chatState.currentMessage.trim() && selectedAgent) {
      chatWithAgent(selectedAgent._id, chatState.currentMessage.trim());
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.role_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="brain-detail-view">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Brains
        </button>
        
        <div className="brain-info">
          <div className="brain-title">
            <h1>{brain.name}</h1>
            <span className="brain-badge">{brain.purpose || 'General Purpose'}</span>
          </div>
          <p className="brain-description">{brain.description}</p>
        </div>

        <div className="brain-stats">
          <div className="stat">
            <Bot size={20} />
            <span>{agents.length} Agents</span>
          </div>
          <div className="stat">
            <FileText size={20} />
            <span>{brain.document_count || 0} Documents</span>
          </div>
          <div className="stat">
            <MessageCircle size={20} />
            <span>{brain.usage_stats?.total_conversations || 0} Conversations</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="brain-tabs">
        <button 
          className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          <Bot size={16} />
          Agents ({agents.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'collaboration' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaboration')}
        >
          <Users size={16} />
          Inter-Agent Communication
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'agents' && (
          <div className="agents-section">
            <div className="section-header">
              <div className="search-box">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="create-agent-btn"
                onClick={() => setShowCreateAgentModal(true)}
              >
                <Plus size={16} />
                Create Agent
              </button>
            </div>

            <div className="agents-grid">
              {loading ? (
                <div className="loading-state">
                  <Bot className="loading-icon" />
                  <p>Loading agents...</p>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="empty-state">
                  <Bot className="empty-icon" />
                  <h3>No agents found</h3>
                  <p>
                    {searchTerm ? 'Try adjusting your search terms' : 'Create your first agent to get started!'}
                  </p>
                  {!searchTerm && (
                    <button 
                      className="create-first-agent-btn"
                      onClick={() => setShowCreateAgentModal(true)}
                    >
                      <Plus size={16} />
                      Create Your First Agent
                    </button>
                  )}
                </div>
              ) : (
                filteredAgents.map((agent) => (
                  <div key={agent._id} className="agent-card">
                    <div className="agent-header">
                      <div className="agent-info">
                        <Bot size={20} className="agent-icon" />
                        <div>
                          <h3>{agent.agent_name}</h3>
                          <p className="agent-role">{agent.role_description}</p>
                        </div>
                      </div>
                      <div className="agent-actions">
                        <button 
                          className="action-btn chat-btn"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setChatState({ messages: [], currentMessage: '', loading: false });
                            setShowChatModal(true);
                          }}
                          title="Chat with agent"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button 
                          className="action-btn upload-btn"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowDocumentModal(true);
                          }}
                          title="Upload document"
                        >
                          <Upload size={14} />
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowEditAgentModal(true);
                          }}
                          title="Edit agent"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => deleteAgent(agent._id)}
                          title="Delete agent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="agent-details">
                      <div className="agent-personality">
                        <span className="personality-badge">
                          {PERSONALITIES[agent.personality] || agent.personality}
                        </span>
                        <span className="model-badge">{agent.model}</span>
                      </div>
                      
                      <div className="agent-stats">
                        <div className="stat-item">
                          <FileText size={12} />
                          <span>{agent.documents?.length || 0} docs</span>
                        </div>
                        <div className="stat-item">
                          <Zap size={12} />
                          <span>{agent.tools?.length || 0} tools</span>
                        </div>
                        <div className="stat-item">
                          <Activity size={12} />
                          <span>{agent.status || 'Active'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="agent-prompt">
                      <p>{agent.system_prompt.substring(0, 150)}...</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="collaboration-section">
            <div className="section-header">
              <h3>Inter-Agent Communication</h3>
              <p>Monitor and facilitate communication between agents in this brain</p>
            </div>
            <div className="communication-placeholder">
              <MessageCircle size={48} />
              <h4>Coming Soon</h4>
              <p>Agent-to-agent communication features will be available here</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateAgentModal && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>Create New Agent</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateAgentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Agent Name *</label>
                  <input
                    type="text"
                    value={newAgent.agent_name}
                    onChange={(e) => setNewAgent({...newAgent, agent_name: e.target.value})}
                    placeholder="e.g., Content Writer, Research Assistant"
                  />
                </div>

                <div className="form-group">
                  <label>Personality</label>
                  <select
                    value={newAgent.personality}
                    onChange={(e) => setNewAgent({...newAgent, personality: e.target.value})}
                  >
                    {Object.entries(PERSONALITIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Role Description *</label>
                <input
                  type="text"
                  value={newAgent.role_description}
                  onChange={(e) => setNewAgent({...newAgent, role_description: e.target.value})}
                  placeholder="Briefly describe what this agent does"
                />
              </div>

              <div className="form-group">
                <label>System Prompt *</label>
                <textarea
                  value={newAgent.system_prompt}
                  onChange={(e) => setNewAgent({...newAgent, system_prompt: e.target.value})}
                  placeholder="Define the agent's behavior, expertise, and how it should respond..."
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Model</label>
                  <select
                    value={newAgent.model}
                    onChange={(e) => setNewAgent({...newAgent, model: e.target.value})}
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newAgent.temperature}
                    onChange={(e) => setNewAgent({...newAgent, temperature: parseFloat(e.target.value)})}
                  />
                  <span>{newAgent.temperature}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Available Tools</label>
                <div className="tools-selection">
                  {AVAILABLE_TOOLS.map(tool => (
                    <label key={tool} className="tool-checkbox">
                      <input
                        type="checkbox"
                        checked={newAgent.tools.includes(tool)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAgent({...newAgent, tools: [...newAgent.tools, tool]});
                          } else {
                            setNewAgent({...newAgent, tools: newAgent.tools.filter(t => t !== tool)});
                          }
                        }}
                      />
                      {tool.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateAgentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="create-btn"
                onClick={createAgent}
              >
                <Bot size={16} />
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditAgentModal && selectedAgent && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>Edit Agent: {selectedAgent.agent_name}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditAgentModal(false);
                  setSelectedAgent(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Agent Name *</label>
                  <input
                    type="text"
                    value={selectedAgent.agent_name}
                    onChange={(e) => setSelectedAgent({...selectedAgent, agent_name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Personality</label>
                  <select
                    value={selectedAgent.personality}
                    onChange={(e) => setSelectedAgent({...selectedAgent, personality: e.target.value})}
                  >
                    {Object.entries(PERSONALITIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Role Description *</label>
                <input
                  type="text"
                  value={selectedAgent.role_description}
                  onChange={(e) => setSelectedAgent({...selectedAgent, role_description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>System Prompt *</label>
                <textarea
                  value={selectedAgent.system_prompt}
                  onChange={(e) => setSelectedAgent({...selectedAgent, system_prompt: e.target.value})}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Model</label>
                  <select
                    value={selectedAgent.model}
                    onChange={(e) => setSelectedAgent({...selectedAgent, model: e.target.value})}
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedAgent.temperature}
                    onChange={(e) => setSelectedAgent({...selectedAgent, temperature: parseFloat(e.target.value)})}
                  />
                  <span>{selectedAgent.temperature}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowEditAgentModal(false);
                  setSelectedAgent(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={updateAgent}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && selectedAgent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Upload Document to {selectedAgent.agent_name}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedAgent(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="upload-area">
                <Upload size={48} />
                <p>Drag and drop a file here, or click to browse</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      uploadDocument(selectedAgent._id, e.target.files[0]);
                      setShowDocumentModal(false);
                      setSelectedAgent(null);
                    }
                  }}
                />
              </div>
              {uploading && <p>Uploading and processing document...</p>}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedAgent && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>Chat with {selectedAgent.agent_name}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowChatModal(false);
                  setSelectedAgent(null);
                  setChatState({ messages: [], currentMessage: '', loading: false });
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content chat-content">
              <div className="chat-messages">
                {chatState.messages.map((message, index) => (
                  <div key={index} className={`message ${message.type}`}>
                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                ))}
                {chatState.loading && (
                  <div className="message agent">
                    <div className="message-content typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  value={chatState.currentMessage}
                  onChange={(e) => setChatState(prev => ({...prev, currentMessage: e.target.value}))}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={chatState.loading}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={chatState.loading || !chatState.currentMessage.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainDetailView;
