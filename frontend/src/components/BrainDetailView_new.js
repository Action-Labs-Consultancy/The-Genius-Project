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
  Eye,
  Download,
  X
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
        body: JSON.stringify(newAgent)
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
      if (!selectedAgent) return;

      const response = await fetch(`${API_BASE_URL}/api/agents/${selectedAgent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAgent)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setAgents(agents.map(agent => 
          agent._id === selectedAgent._id ? { ...agent, ...newAgent } : agent
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
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setAgents(agents.filter(agent => agent._id !== agentId));
        alert('Agent deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete agent');
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert('Failed to delete agent: ' + error.message);
    }
  };

  const uploadDocument = async (file) => {
    if (!selectedAgent) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/agents/${selectedAgent._id}/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Reload agents to get updated document count
        loadAgents();
        setShowDocumentModal(false);
        alert('Document uploaded successfully!');
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

  const loadAgentDocuments = async (agent) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agent._id}/documents`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSelectedAgent({ ...agent, documents: result.data.documents });
        setShowDocumentViewModal(true);
      } else {
        alert('Failed to load documents');
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      alert('Failed to load documents');
    }
  };

  const deleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${selectedAgent._id}/documents/${documentId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Reload agent documents
        loadAgentDocuments(selectedAgent);
        // Reload agents to update document count
        loadAgents();
        alert('Document deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.role_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="brain-detail-view">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading agents...
        </div>
      </div>
    );
  }

  return (
    <div className="brain-detail-view">
      {/* Header */}
      <div className="brain-detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>Back to Brains</span>
          </button>
          <div className="brain-info">
            <h1 className="brain-title">
              <Bot size={32} />
              {brain.name}
            </h1>
            <p className="brain-description">{brain.description}</p>
          </div>
        </div>
        <div className="brain-stats">
          <div className="stat-card">
            <div className="stat-number">{agents.length}</div>
            <div className="stat-label">Agents</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {agents.reduce((total, agent) => total + (agent.documents?.length || 0), 0)}
            </div>
            <div className="stat-label">Documents</div>
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
            <div className="agents-controls">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
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

            {filteredAgents.length === 0 ? (
              <div className="empty-state">
                <Bot className="empty-icon" />
                <h3 className="empty-title">
                  {searchTerm ? 'No agents found' : 'No agents created yet'}
                </h3>
                <p className="empty-description">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Create your first agent to get started with this brain'
                  }
                </p>
                {!searchTerm && (
                  <button 
                    className="create-first-agent-btn"
                    onClick={() => setShowCreateAgentModal(true)}
                  >
                    <Plus size={18} />
                    Create Your First Agent
                  </button>
                )}
              </div>
            ) : (
              <div className="agents-grid">
                {filteredAgents.map((agent) => (
                  <div key={agent._id} className="agent-card">
                    <div className="agent-header">
                      <div className="agent-info">
                        <h3 className="agent-name">
                          <Bot size={20} />
                          {agent.agent_name}
                        </h3>
                        <p className="agent-role">{agent.role_description}</p>
                      </div>
                      <div className="agent-actions">
                        <button 
                          className="action-btn view-docs-btn"
                          onClick={() => loadAgentDocuments(agent)}
                          title="View documents"
                        >
                          <Eye size={14} />
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
                            setNewAgent({
                              agent_name: agent.agent_name,
                              role_description: agent.role_description,
                              system_prompt: agent.system_prompt,
                              personality: agent.personality,
                              temperature: agent.temperature,
                              model: agent.model,
                              tools: agent.tools
                            });
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

                    <div className="agent-stats">
                      <div className="stat-item">
                        <FileText size={12} />
                        <span>{agent.documents?.length || 0} docs</span>
                      </div>
                      <div className="stat-item">
                        <span className="personality-badge">
                          {PERSONALITIES[agent.personality] || agent.personality}
                        </span>
                      </div>
                    </div>

                    <div className="agent-prompt">
                      <p>{agent.system_prompt.substring(0, 120)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Agent</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateAgentModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Agent Name *</label>
                <input
                  type="text"
                  value={newAgent.agent_name}
                  onChange={(e) => setNewAgent({...newAgent, agent_name: e.target.value})}
                  placeholder="Enter agent name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Description *</label>
                <textarea
                  value={newAgent.role_description}
                  onChange={(e) => setNewAgent({...newAgent, role_description: e.target.value})}
                  placeholder="Describe what this agent does"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Prompt *</label>
                <textarea
                  value={newAgent.system_prompt}
                  onChange={(e) => setNewAgent({...newAgent, system_prompt: e.target.value})}
                  placeholder="Define the agent's behavior and instructions"
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Personality</label>
                  <select
                    value={newAgent.personality}
                    onChange={(e) => setNewAgent({...newAgent, personality: e.target.value})}
                    className="form-select"
                  >
                    {Object.entries(PERSONALITIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Model</label>
                  <select
                    value={newAgent.model}
                    onChange={(e) => setNewAgent({...newAgent, model: e.target.value})}
                    className="form-select"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateAgentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={createAgent}
              >
                <Plus size={16} />
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditAgentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Agent</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEditAgentModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Agent Name *</label>
                <input
                  type="text"
                  value={newAgent.agent_name}
                  onChange={(e) => setNewAgent({...newAgent, agent_name: e.target.value})}
                  placeholder="Enter agent name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Description *</label>
                <textarea
                  value={newAgent.role_description}
                  onChange={(e) => setNewAgent({...newAgent, role_description: e.target.value})}
                  placeholder="Describe what this agent does"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Prompt *</label>
                <textarea
                  value={newAgent.system_prompt}
                  onChange={(e) => setNewAgent({...newAgent, system_prompt: e.target.value})}
                  placeholder="Define the agent's behavior and instructions"
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Personality</label>
                  <select
                    value={newAgent.personality}
                    onChange={(e) => setNewAgent({...newAgent, personality: e.target.value})}
                    className="form-select"
                  >
                    {Object.entries(PERSONALITIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Model</label>
                  <select
                    value={newAgent.model}
                    onChange={(e) => setNewAgent({...newAgent, model: e.target.value})}
                    className="form-select"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEditAgentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={updateAgent}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDocumentModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p>Upload documents for <strong>{selectedAgent?.agent_name}</strong></p>
              
              <div className="upload-area">
                <Upload size={48} />
                <h4>Drop files here or click to browse</h4>
                <p>Supported formats: PDF, DOC, DOCX, TXT, MD</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => e.target.files[0] && uploadDocument(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="btn btn-primary">
                  Choose File
                </label>
              </div>

              {uploading && (
                <div className="upload-progress">
                  <div className="loading-spinner"></div>
                  <span>Uploading and processing document...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {showDocumentViewModal && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>Documents - {selectedAgent?.agent_name}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDocumentViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {selectedAgent?.documents?.length > 0 ? (
                <div className="documents-list">
                  {selectedAgent.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <div className="document-info">
                        <FileText size={20} />
                        <div>
                          <div className="document-name">{doc.filename || doc.name}</div>
                          <div className="document-meta">
                            Size: {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown'} • 
                            Uploaded: {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <div className="document-actions">
                        <button 
                          className="btn btn-danger"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-documents">
                  <FileText size={48} />
                  <h4>No documents uploaded</h4>
                  <p>Upload documents to give this agent access to specific knowledge</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainDetailView;
