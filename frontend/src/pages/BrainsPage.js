import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Search, 
  Users, 
  Bot, 
  ArrowRight,
  Trash2,
  X,
  List,
  Grid,
  ChevronDown,
  ChevronRight,
  Workflow,
  Zap
} from 'lucide-react';
import BrainDetailView from '../components/BrainDetailView';
import { useNotification } from '../components/ModernNotification';
import { useConfirm } from '../components/ModernConfirm';
import { 
  useMCABrainSystem, 
  MCABrainCard, 
  MCAWorkflowStatus 
} from '../components/MCABrainIntegration';
import { API_BASE_URL } from '../config/api';
import './BrainsPage.css';
import '../components/MCABrainIntegration.css';

const BrainsPage = ({ user }) => {
  const [brains, setBrains] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'detail'
  const [displayMode, setDisplayMode] = useState('grid'); // 'grid' or 'dropdown'
  const [expandedBrains, setExpandedBrains] = useState(new Set());
  const [mcaMode, setMcaMode] = useState(false); // Toggle MCA mode

  // MCA Brain System Integration
  const {
    mcaBrains,
    mcaSessions,
    activeWorkflows,
    initializeMCABrain,
    createMCAAgentsFromBrainData,
    executeMCAWorkflow,
    getMCAAnalytics
  } = useMCABrainSystem();

  // Modern notification hooks
  const { notification, showNotification, NotificationComponent } = useNotification();
  const { confirm, showConfirm, ConfirmComponent } = useConfirm();

  const [newBrain, setNewBrain] = useState({
    name: '',
    description: '',
    purpose: '',
    initial_prompt: 'You are an intelligent AI assistant. Work collaboratively with other agents in this brain to accomplish complex tasks efficiently.'
  });

  useEffect(() => {
    loadBrains();
    loadAllAgents();
  }, []);

  useEffect(() => {
    // Initialize MCA brains when brains data changes
    if (brains.length > 0) {
      initializeMCABrains();
    }
  }, [brains]);

  const initializeMCABrains = async () => {
    for (const brain of brains) {
      // Initialize MCA brain if not already done
      if (!mcaBrains.has(brain._id)) {
        const mcaBrain = initializeMCABrain(brain);
        
        // Load and create MCA agents for this brain
        try {
          const agentResponse = await fetch(`${API_BASE_URL}/api/brains/${brain._id}/agents`);
          if (agentResponse.ok) {
            const agentResult = await agentResponse.json();
            const agentData = agentResult.data || agentResult || [];
            
            const brainWithAgents = { ...brain, agents: agentData };
            createMCAAgentsFromBrainData(brainWithAgents, mcaBrain);
          }
        } catch (error) {
          console.warn(`Failed to load agents for MCA brain ${brain.name}:`, error);
        }
      }
    }
  };

  const handleMCAWorkflow = async (brainId, prompt) => {
    try {
      showNotification({
        type: 'info',
        title: 'MCA Workflow Started',
        message: 'Executing Maker-Checker-Approver workflow...',
        autoClose: true
      });

      const result = await executeMCAWorkflow(brainId, prompt);
      
      showNotification({
        type: 'success',
        title: 'MCA Workflow Completed',
        message: 'Content has been successfully created and approved!',
        autoClose: true
      });

      return result;
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'MCA Workflow Failed',
        message: error.message || 'Workflow execution failed',
        autoClose: true
      });
      throw error;
    }
  };

  const loadBrains = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/brains`);
      
      if (response.ok) {
        const result = await response.json();
        const brainsData = result.success ? result.data : result.brains || [];
        setBrains(Array.isArray(brainsData) ? brainsData : []);
      } else {
        console.error('Failed to fetch brains');
        setBrains([]);
      }
    } catch (error) {
      console.error('Failed to load brains:', error);
      setBrains([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains`);
      if (response.ok) {
        const result = await response.json();
        const brainsData = result.success ? result.data : result.brains || [];
        
        // Get agents from all brains
        const allAgents = [];
        for (const brain of brainsData) {
          try {
            const agentResponse = await fetch(`${API_BASE_URL}/api/brains/${brain._id}/agents`);
            if (agentResponse.ok) {
              const agentResult = await agentResponse.json();
              const agents = agentResult.data || agentResult;
              agents.forEach(agent => {
                allAgents.push({
                  ...agent,
                  brainId: brain._id,
                  brainName: brain.name
                });
              });
            }
          } catch (err) {
            console.warn(`Failed to load agents for brain ${brain.name}:`, err);
          }
        }
        setAgents(allAgents);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const createBrain = async () => {
    try {
      if (!newBrain.name.trim() || !newBrain.description.trim()) {
        showNotification({
          type: 'warning',
          title: 'Missing Information',
          message: 'Brain name and description are required to create a new brain.',
          autoClose: true
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/brains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBrain.name,
          description: newBrain.description,
          system_prompt: newBrain.initial_prompt,
          purpose: newBrain.purpose
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setBrains([...brains, result.data]);
        setShowCreateModal(false);
        setNewBrain({
          name: '',
          description: '',
          purpose: '',
          initial_prompt: 'You are an intelligent AI assistant. Work collaboratively with other agents in this brain to accomplish complex tasks efficiently.'
        });
        showNotification({
          type: 'success',
          title: 'Brain Created!',
          message: `Successfully created brain "${newBrain.name}". You can now add agents to it.`,
          autoClose: true
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Creation Failed',
          message: result.error || 'Failed to create brain. Please try again.',
          autoClose: true
        });
      }
    } catch (error) {
      console.error('Failed to create brain:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create brain: ' + error.message,
        autoClose: true
      });
    }
  };

  const deleteBrain = async (brainId) => {
    const confirmed = await showConfirm({
      type: 'danger',
      title: 'Delete Brain',
      message: 'Are you sure you want to delete this brain? All agents and documents within it will be permanently deleted.',
      confirmText: 'Delete Brain',
      cancelText: 'Cancel'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/brains/${brainId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setBrains(brains.filter(brain => brain._id !== brainId));
        showNotification({
          type: 'success',
          title: 'Brain Deleted',
          message: 'Brain has been successfully deleted along with all its agents and documents.',
          autoClose: true
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Deletion Failed',
          message: result.error || 'Failed to delete brain. Please try again.',
          autoClose: true
        });
      }
    } catch (error) {
      console.error('Failed to delete brain:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to delete brain: ' + error.message,
        autoClose: true
      });
    }
  };

  const handleBrainSelect = (brain) => {
    setSelectedBrain(brain);
    setViewMode('detail');
  };

  const handleBackToBrains = () => {
    setSelectedBrain(null);
    setViewMode('overview');
    loadBrains(); // Refresh the brains list
    loadAllAgents(); // Refresh the agents list
  };

  const toggleBrainExpansion = (brainId) => {
    const newExpanded = new Set(expandedBrains);
    if (newExpanded.has(brainId)) {
      newExpanded.delete(brainId);
    } else {
      newExpanded.add(brainId);
    }
    setExpandedBrains(newExpanded);
  };

  const getAgentsForBrain = (brainId) => {
    return agents.filter(agent => agent.brainId === brainId);
  };

  const toggleExpandBrain = (brainId) => {
    const newExpandedBrains = new Set(expandedBrains);
    if (newExpandedBrains.has(brainId)) {
      newExpandedBrains.delete(brainId);
    } else {
      newExpandedBrains.add(brainId);
    }
    setExpandedBrains(newExpandedBrains);
  };

  const filteredBrains = brains.filter(brain =>
    brain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brain.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewMode === 'detail' && selectedBrain) {
    return (
      <BrainDetailView 
        brain={selectedBrain} 
        user={user} 
        onBack={handleBackToBrains}
      />
    );
  }

  if (loading) {
    return (
      <div className="brains-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading brains...
        </div>
      </div>
    );
  }

  return (
    <div className="brains-page">
      {/* Header */}
      <div className="brains-header">
        <div className="header-content">
          <h1 className="page-title">
            <Brain size={32} />
            AI Brains
            {mcaMode && <span className="mca-mode-indicator">MCA Mode</span>}
          </h1>
          <p className="page-subtitle">
            Create and manage AI brain systems with specialized agents
            {mcaMode && " • Maker-Checker-Approver workflows enabled"}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className={`mca-toggle-btn ${mcaMode ? 'active' : ''}`}
            onClick={() => setMcaMode(!mcaMode)}
            title="Toggle MCA Workflow Mode"
          >
            <Workflow size={16} />
            {mcaMode ? 'Disable MCA' : 'Enable MCA'}
          </button>
          <button 
            className="create-brain-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create Brain
          </button>
        </div>
      </div>

      {/* MCA Workflow Status */}
      {mcaMode && (
        <MCAWorkflowStatus 
          activeWorkflows={activeWorkflows}
          mcaSessions={mcaSessions}
        />
      )}

      {/* Search */}
      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search brains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button 
          className={`toggle-btn ${displayMode === 'grid' ? 'active' : ''}`}
          onClick={() => setDisplayMode('grid')}
          title="Grid View"
        >
          <Grid size={16} />
        </button>
        <button 
          className={`toggle-btn ${displayMode === 'dropdown' ? 'active' : ''}`}
          onClick={() => setDisplayMode('dropdown')}
          title="Dropdown View"
        >
          <List size={16} />
        </button>
      </div>

      {/* Brains List (Dropdown View) */}
      {displayMode === 'dropdown' && (
        <div className="brains-list">
          {filteredBrains.length === 0 ? (
            <div className="empty-state">
              <Brain className="empty-icon" />
              <h3 className="empty-title">
                {searchTerm ? 'No brains found' : 'No brains created yet'}
              </h3>
              <p className="empty-description">
                {searchTerm 
                  ? 'Try adjusting your search terms to find the brain you\'re looking for'
                  : 'Create your first AI brain to start building intelligent agent systems'
                }
              </p>
              {!searchTerm && (
                <button 
                  className="create-first-brain-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={18} />
                  Create Your First Brain
                </button>
              )}
            </div>
          ) : (
            <div className="brains-accordion">
              {filteredBrains.map((brain) => (
                <div key={brain._id} className="brain-accordion-item">
                  <div className="brain-accordion-header" onClick={() => toggleExpandBrain(brain._id)}>
                    <div className="brain-title">
                      <Brain size={24} className="brain-icon" />
                      <div className="brain-info">
                        <h3 className="brain-name">{brain.name}</h3>
                        <p className="brain-purpose">{brain.purpose || 'General purpose brain'}</p>
                      </div>
                    </div>
                    <div className="accordion-toggle">
                      {expandedBrains.has(brain._id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                  </div>

                  {expandedBrains.has(brain._id) && (
                    <div className="brain-accordion-content">
                      <div className="brain-description">
                        <p>{brain.description}</p>
                      </div>

                      <div className="brain-stats">
                        <div className="stat-item">
                          <Users size={16} />
                          <span>{brain.agent_count || 0} agents</span>
                        </div>
                        <div className="stat-item">
                          <span className="status-badge active">Active</span>
                        </div>
                      </div>

                      <div className="brain-footer">
                        <div className="brain-created">
                          Created {new Date(brain.created_at).toLocaleDateString()}
                        </div>
                        <button 
                          className="enter-brain-btn"
                          onClick={() => handleBrainSelect(brain)}
                        >
                          Enter Brain
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brains Grid (Grid View) */}
      {displayMode === 'grid' && (
        <div className="brains-container">
          {filteredBrains.length === 0 ? (
            <div className="empty-state">
              <Brain className="empty-icon" />
              <h3 className="empty-title">
                {searchTerm ? 'No brains found' : 'No brains created yet'}
              </h3>
              <p className="empty-description">
                {searchTerm 
                  ? 'Try adjusting your search terms to find the brain you\'re looking for'
                  : 'Create your first AI brain to start building intelligent agent systems'
                }
              </p>
              {!searchTerm && (
                <button 
                  className="create-first-brain-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={18} />
                  Create Your First Brain
                </button>
              )}
            </div>
          ) : mcaMode ? (
            // MCA Mode: Enhanced brain cards with workflow capabilities
            <div className="brains-grid mca-enhanced">
              {filteredBrains.map((brain) => (
                <MCABrainCard
                  key={brain._id}
                  brain={brain}
                  onExecuteWorkflow={handleMCAWorkflow}
                  mcaAnalytics={getMCAAnalytics(brain._id)}
                />
              ))}
            </div>
          ) : (
            // Standard Mode: Original brain cards
            <div className="brains-grid">
              {filteredBrains.map((brain) => (
                <div key={brain._id} className="brain-card">
                  <div className="brain-header">
                    <div className="brain-title">
                      <Brain size={24} className="brain-icon" />
                      <div className="brain-info">
                        <h3 className="brain-name">{brain.name}</h3>
                        <p className="brain-purpose">{brain.purpose || 'General purpose brain'}</p>
                      </div>
                    </div>
                    <div className="brain-actions">
                      {mcaBrains.has(brain._id) && (
                        <button 
                          className="action-btn mca-ready-btn"
                          title="MCA Ready"
                        >
                          <Zap size={16} />
                        </button>
                      )}
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBrain(brain._id);
                        }}
                        title="Delete brain"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="brain-description">
                    <p>{brain.description}</p>
                  </div>

                  <div className="brain-stats">
                    <div className="stat-item">
                      <Users size={16} />
                      <span>{brain.agent_count || 0} agents</span>
                    </div>
                    <div className="stat-item">
                      <span className="status-badge active">Active</span>
                    </div>
                  </div>

                  <div className="brain-footer">
                    <div className="brain-created">
                      Created {new Date(brain.created_at).toLocaleDateString()}
                    </div>
                    <button 
                      className="enter-brain-btn"
                      onClick={() => handleBrainSelect(brain)}
                    >
                      Enter Brain
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Brain Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Brain</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Brain Name *</label>
                <input
                  type="text"
                  value={newBrain.name}
                  onChange={(e) => setNewBrain({...newBrain, name: e.target.value})}
                  placeholder="Enter brain name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purpose</label>
                <input
                  type="text"
                  value={newBrain.purpose}
                  onChange={(e) => setNewBrain({...newBrain, purpose: e.target.value})}
                  placeholder="What is this brain designed for?"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  value={newBrain.description}
                  onChange={(e) => setNewBrain({...newBrain, description: e.target.value})}
                  placeholder="Describe what this brain does and its capabilities"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial System Prompt</label>
                <textarea
                  value={newBrain.initial_prompt}
                  onChange={(e) => setNewBrain({...newBrain, initial_prompt: e.target.value})}
                  placeholder="Define the overall behavior and purpose of this brain system"
                  className="form-textarea"
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={createBrain}
              >
                <Plus size={16} />
                Create Brain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Notification and Confirm Components */}
      {NotificationComponent}
      {ConfirmComponent}
    </div>
  );
};

export default BrainsPage;
