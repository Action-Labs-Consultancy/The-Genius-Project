// MCABrainsPageNew.js - Complete MCA Brain Management System with Full BrainsPage Functionality
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
  Zap,
  Edit,
  Play,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  Copy,
  Star,
  Shield,
  Layers
} from 'lucide-react';
import BrainDetailView from '../components/BrainDetailView';
import { useNotification } from '../components/ModernNotification';
import { useConfirm } from '../components/ModernConfirm';
import { Brain as MCABrainClass } from '../classes/Brain';
import { Agent as MCAAgentClass } from '../classes/Agent';
import { API_BASE_URL } from '../config/api';
import './MCABrainsPage.css';

const MCABrainsPageNew = ({ user }) => {
  // State management
  const [brains, setBrains] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detail', 'workflow'
  const [displayMode, setDisplayMode] = useState('grid'); // 'grid' or 'dropdown'
  const [expandedBrains, setExpandedBrains] = useState(new Set());
  
  // MCA-specific state
  const [mcaBrains, setMCABrains] = useState(new Map());
  const [mcaSessions, setMCASessions] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowInput, setWorkflowInput] = useState('');
  const [executingWorkflow, setExecutingWorkflow] = useState(false);

  // Form states
  const [newBrain, setNewBrain] = useState({
    name: '',
    description: '',
    purpose: '',
    tone: 'professional',
    style: 'clear and concise',
    initial_prompt: 'You are an intelligent AI assistant designed for marketing content generation. Work collaboratively with other agents in this brain to accomplish complex tasks efficiently while following the MCA protocol.',
    mcaProtocol: {
      version: '1.0',
      creativityLevel: 'moderate',
      thoroughness: 'detailed',
      factChecking: true,
      followTemplates: true,
      maintainBrandVoice: true,
      rules: [
        'Follow the Maker-Checker-Approver workflow strictly',
        'Maintain professional tone throughout the process',
        'Verify all facts and claims before approval',
        'Ensure brand voice consistency across all content'
      ],
      behaviors: {
        errorChecking: true,
        qualityAssurance: true,
        creativityLevel: 'moderate',
        collaborationStyle: 'respectful'
      },
      forbidden: [
        'No data simulation or fabrication',
        'Must follow official documentation only',
        'No speculative content without clear disclaimers',
        'No bypassing of approval workflow'
      ]
    }
  });

  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'maker',
    capabilities: [],
    brain_id: '',
    system_prompt: '',
    mcaProtocol: {
      creativityLevel: 'moderate',
      errorChecking: true,
      collaborationLevel: 'high'
    }
  });

  // Notification and confirm hooks
  const { notification, showNotification, NotificationComponent } = useNotification();
  const { confirm, showConfirm, ConfirmComponent } = useConfirm();

  useEffect(() => {
    loadMCABrains();
    loadAllAgents();
  }, []);

  useEffect(() => {
    // Initialize MCA brain classes when data changes
    if (brains.length > 0) {
      initializeMCABrainClasses();
    }
  }, [brains, agents]);

  // Initialize MCA Brain Classes from backend data
  const initializeMCABrainClasses = () => {
    const newMCABrains = new Map();
    
    brains.forEach(brainData => {
      try {
        const mcaBrain = new MCABrainClass(
          brainData.name,
          brainData.tone || 'professional',
          brainData.style || 'clear and concise',
          brainData.description,
          brainData.mcaProtocol
        );
        
        // Add agents to the brain
        const brainAgents = agents.filter(agent => agent.brain_id === brainData._id);
        brainAgents.forEach(agentData => {
          const mcaAgent = new MCAAgentClass(
            agentData.name,
            agentData.role || 'maker',
            mcaBrain,
            agentData.capabilities || [],
            agentData.mcaProtocol
          );
          mcaBrain.addAgent(mcaAgent);
        });
        
        newMCABrains.set(brainData._id, {
          data: brainData,
          instance: mcaBrain,
          agents: brainAgents
        });
      } catch (error) {
        console.warn(`Failed to initialize MCA brain for ${brainData.name}:`, error);
      }
    });
    
    setMCABrains(newMCABrains);
  };

  // Load MCA Brains from backend
  const loadMCABrains = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mca-brains`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setBrains(result.brains || []);
        setMCASessions(result.sessions || []);
      } else {
        console.warn('MCA API not available, falling back to regular brains API');
        await loadRegularBrains();
      }
    } catch (error) {
      console.warn('Error with MCA API, falling back to regular brains API:', error);
      await loadRegularBrains();
    } finally {
      setLoading(false);
    }
  };

  // Fallback to regular brains API
  const loadRegularBrains = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setBrains(result.data || []);
      }
    } catch (error) {
      console.error('Error loading regular brains:', error);
      showNotification({
        type: 'error',
        title: 'Loading Failed',
        message: 'Failed to load brains data. Please check your connection.',
        autoClose: true
      });
    }
  };

  // Load all agents
  const loadAllAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setAgents(result.data || []);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  // Create MCA Brain
  const createMCABrain = async () => {
    if (!newBrain.name.trim()) {
      showNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please provide a name for the brain.',
        autoClose: true
      });
      return;
    }

    try {
      // First try MCA API
      const mcaResponse = await fetch(`${API_BASE_URL}/api/mca-brains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBrain.name,
          description: newBrain.description,
          purpose: newBrain.purpose,
          tone: newBrain.tone,
          style: newBrain.style,
          mcaProtocol: newBrain.mcaProtocol,
          system_prompt: newBrain.initial_prompt
        })
      });

      const mcaResult = await mcaResponse.json();
      
      if (mcaResponse.ok && mcaResult.success) {
        setBrains(prev => [...prev, mcaResult.brain]);
        resetNewBrainForm();
        setShowCreateModal(false);
        
        showNotification({
          type: 'success',
          title: 'MCA Brain Created!',
          message: `Successfully created MCA brain "${newBrain.name}" with enhanced protocol capabilities.`,
          autoClose: true
        });
      } else {
        // Fallback to regular brain creation
        await createRegularBrain();
      }
    } catch (error) {
      console.warn('MCA brain creation failed, falling back to regular brain:', error);
      await createRegularBrain();
    }
  };

  // Fallback regular brain creation
  const createRegularBrain = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBrain.name,
          description: newBrain.description,
          purpose: newBrain.purpose,
          system_prompt: newBrain.initial_prompt
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setBrains(prev => [...prev, result.data]);
        resetNewBrainForm();
        setShowCreateModal(false);
        
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
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create brain: ' + error.message,
        autoClose: true
      });
    }
  };

  // Create MCA Agent
  const createMCAAgent = async () => {
    if (!newAgent.name.trim() || !newAgent.brain_id) {
      showNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please provide a name and select a brain for the agent.',
        autoClose: true
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgent.name,
          role: newAgent.role,
          brain_id: newAgent.brain_id,
          capabilities: newAgent.capabilities,
          system_prompt: newAgent.system_prompt || `You are a ${newAgent.role} agent specialized in marketing content generation. Follow the MCA protocol strictly.`,
          mcaProtocol: newAgent.mcaProtocol
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setAgents(prev => [...prev, result.data]);
        resetNewAgentForm();
        setShowCreateAgentModal(false);
        
        showNotification({
          type: 'success',
          title: 'MCA Agent Created!',
          message: `Successfully created ${newAgent.role} agent "${newAgent.name}".`,
          autoClose: true
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Creation Failed',
          message: result.error || 'Failed to create agent. Please try again.',
          autoClose: true
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create agent: ' + error.message,
        autoClose: true
      });
    }
  };

  // Execute MCA Workflow
  const executeMCAWorkflow = async (brainId) => {
    if (!workflowInput.trim()) {
      showNotification({
        type: 'error',
        title: 'Missing Input',
        message: 'Please provide input for the MCA workflow.',
        autoClose: true
      });
      return;
    }

    setExecutingWorkflow(true);
    const sessionId = `mca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get MCA brain instance
      const mcaBrainData = mcaBrains.get(brainId);
      if (!mcaBrainData || !mcaBrainData.instance) {
        throw new Error('MCA Brain not properly initialized');
      }

      const mcaBrain = mcaBrainData.instance;
      
      // Start workflow session
      const workflowSession = {
        id: sessionId,
        brainId: brainId,
        brainName: mcaBrainData.data.name,
        input: workflowInput,
        status: 'running',
        startTime: new Date(),
        steps: []
      };

      setActiveWorkflows(prev => [...prev, workflowSession]);

      // Execute MCA workflow using the Brain class
      const result = await mcaBrain.executeFullMCAWorkflow(workflowInput);
      
      // Update session with results
      const completedSession = {
        ...workflowSession,
        status: 'completed',
        endTime: new Date(),
        result: result,
        steps: result.steps || []
      };

      setActiveWorkflows(prev => 
        prev.map(session => 
          session.id === sessionId ? completedSession : session
        )
      );

      setMCASessions(prev => [...prev, completedSession]);
      
      showNotification({
        type: 'success',
        title: 'MCA Workflow Completed!',
        message: `Successfully executed MCA workflow with ${result.steps?.length || 0} steps.`,
        autoClose: true
      });

      setWorkflowInput('');
      setShowWorkflowModal(false);

    } catch (error) {
      console.error('MCA Workflow execution failed:', error);
      
      // Update session with error
      setActiveWorkflows(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'failed', error: error.message, endTime: new Date() }
            : session
        )
      );

      showNotification({
        type: 'error',
        title: 'Workflow Failed',
        message: error.message || 'MCA workflow execution failed.',
        autoClose: true
      });
    } finally {
      setExecutingWorkflow(false);
    }
  };

  // Delete Brain with confirmation
  const deleteBrain = async (brainId) => {
    const brainToDelete = brains.find(brain => brain._id === brainId);
    const brainAgents = getAgentsForBrain(brainId);
    
    const confirmed = await showConfirm({
      type: 'danger',
      title: 'Delete MCA Brain',
      message: `Are you sure you want to delete "${brainToDelete?.name}"? This will permanently delete ${brainAgents.length} agents, all workflows, and sessions.`,
      confirmText: 'Delete Brain',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      // Try MCA API first
      const mcaResponse = await fetch(`${API_BASE_URL}/api/mca-brains/${brainId}`, {
        method: 'DELETE'
      });

      if (mcaResponse.ok) {
        const mcaResult = await mcaResponse.json();
        if (mcaResult.success) {
          updateAfterDelete(brainId, brainToDelete?.name);
          return;
        }
      }

      // Fallback to regular API
      const response = await fetch(`${API_BASE_URL}/api/brains/${brainId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        updateAfterDelete(brainId, brainToDelete?.name);
      } else {
        showNotification({
          type: 'error',
          title: 'Deletion Failed',
          message: result.error || 'Failed to delete brain. Please try again.',
          autoClose: true
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to delete brain: ' + error.message,
        autoClose: true
      });
    }
  };

  const updateAfterDelete = (brainId, brainName) => {
    setBrains(prev => prev.filter(brain => brain._id !== brainId));
    setAgents(prev => prev.filter(agent => agent.brain_id !== brainId));
    setMCABrains(prev => {
      const newMap = new Map(prev);
      newMap.delete(brainId);
      return newMap;
    });
    
    showNotification({
      type: 'success',
      title: 'Brain Deleted',
      message: `"${brainName}" has been successfully deleted along with all its agents and workflows.`,
      autoClose: true
    });
  };

  // Delete Agent
  const deleteAgent = async (agentId) => {
    const agentToDelete = agents.find(agent => agent._id === agentId);
    
    const confirmed = await showConfirm({
      type: 'danger',
      title: 'Delete Agent',
      message: `Are you sure you want to delete agent "${agentToDelete?.name}"?`,
      confirmText: 'Delete Agent',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setAgents(prev => prev.filter(agent => agent._id !== agentId));
        
        showNotification({
          type: 'success',
          title: 'Agent Deleted',
          message: `Agent "${agentToDelete?.name}" has been successfully deleted.`,
          autoClose: true
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Deletion Failed',
          message: result.error || 'Failed to delete agent. Please try again.',
          autoClose: true
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to delete agent: ' + error.message,
        autoClose: true
      });
    }
  };

  // Reset forms
  const resetNewBrainForm = () => {
    setNewBrain({
      name: '',
      description: '',
      purpose: '',
      tone: 'professional',
      style: 'clear and concise',
      initial_prompt: 'You are an intelligent AI assistant designed for marketing content generation. Work collaboratively with other agents in this brain to accomplish complex tasks efficiently while following the MCA protocol.',
      mcaProtocol: {
        version: '1.0',
        creativityLevel: 'moderate',
        thoroughness: 'detailed',
        factChecking: true,
        followTemplates: true,
        maintainBrandVoice: true,
        rules: [
          'Follow the Maker-Checker-Approver workflow strictly',
          'Maintain professional tone throughout the process',
          'Verify all facts and claims before approval',
          'Ensure brand voice consistency across all content'
        ],
        behaviors: {
          errorChecking: true,
          qualityAssurance: true,
          creativityLevel: 'moderate',
          collaborationStyle: 'respectful'
        },
        forbidden: [
          'No data simulation or fabrication',
          'Must follow official documentation only',
          'No speculative content without clear disclaimers',
          'No bypassing of approval workflow'
        ]
      }
    });
  };

  const resetNewAgentForm = () => {
    setNewAgent({
      name: '',
      role: 'maker',
      capabilities: [],
      brain_id: '',
      system_prompt: '',
      mcaProtocol: {
        creativityLevel: 'moderate',
        errorChecking: true,
        collaborationLevel: 'high'
      }
    });
  };

  // Search functionality
  const searchMCABrains = (brains, searchTerm) => {
    if (!searchTerm.trim()) return brains;
    
    return brains.filter(brain =>
      brain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brain.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brain.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Utility functions
  const getAgentsForBrain = (brainId) => {
    return agents.filter(agent => agent.brain_id === brainId);
  };

  const getMCAAnalytics = (brainId) => {
    const brainSessions = mcaSessions.filter(session => session.brainId === brainId);
    const activeSessions = activeWorkflows.filter(workflow => workflow.brainId === brainId);
    const brainAgents = getAgentsForBrain(brainId);

    return {
      totalSessions: brainSessions.length,
      activeSessions: activeSessions.length,
      successRate: brainSessions.length > 0 
        ? (brainSessions.filter(s => s.status === 'completed').length / brainSessions.length) * 100 
        : 0,
      agentCount: brainAgents.length,
      makerCount: brainAgents.filter(a => a.role === 'maker').length,
      checkerCount: brainAgents.filter(a => a.role === 'checker').length,
      approverCount: brainAgents.filter(a => a.role === 'approver').length
    };
  };

  const toggleBrainExpansion = (brainId) => {
    setExpandedBrains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brainId)) {
        newSet.delete(brainId);
      } else {
        newSet.add(brainId);
      }
      return newSet;
    });
  };

  // Filter and search
  const filteredBrains = searchMCABrains(brains, searchTerm);

  // Render functions
  const renderBrainCard = (brain) => {
    const analytics = getMCAAnalytics(brain._id);
    const brainAgents = getAgentsForBrain(brain._id);
    const isExpanded = expandedBrains.has(brain._id);
    
    return (
      <div key={brain._id} className="mca-brain-card">
        <div className="brain-card-header">
          <div className="brain-info">
            <div className="brain-icon">
              <Brain size={24} />
            </div>
            <div className="brain-details">
              <h3>{brain.name}</h3>
              <p className="brain-description">{brain.description}</p>
              <div className="brain-stats">
                <span className="stat">
                  <Users size={14} />
                  {analytics.agentCount} agents
                </span>
                <span className="stat">
                  <Workflow size={14} />
                  {analytics.totalSessions} sessions
                </span>
                <span className="stat">
                  <CheckCircle size={14} />
                  {analytics.successRate.toFixed(0)}% success
                </span>
              </div>
            </div>
          </div>
          
          <div className="brain-actions">
            <button
              onClick={() => {
                setSelectedBrain(brain);
                setShowWorkflowModal(true);
              }}
              className="action-btn primary"
              title="Execute MCA Workflow"
            >
              <Play size={16} />
            </button>
            
            <button
              onClick={() => toggleBrainExpansion(brain._id)}
              className="action-btn"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            <button
              onClick={() => {
                setSelectedBrain(brain);
                setViewMode('detail');
              }}
              className="action-btn"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            
            <button
              onClick={() => deleteBrain(brain._id)}
              className="action-btn danger"
              title="Delete Brain"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="brain-expanded-content">
            <div className="agents-section">
              <div className="section-header">
                <h4>Agents ({brainAgents.length})</h4>
                <button
                  onClick={() => {
                    setNewAgent(prev => ({ ...prev, brain_id: brain._id }));
                    setShowCreateAgentModal(true);
                  }}
                  className="add-agent-btn"
                >
                  <Plus size={14} />
                  Add Agent
                </button>
              </div>
              
              <div className="agents-grid">
                {brainAgents.map(agent => (
                  <div key={agent._id} className="agent-card">
                    <div className="agent-info">
                      <Bot size={16} />
                      <span className="agent-name">{agent.name}</span>
                      <span className={`agent-role role-${agent.role}`}>
                        {agent.role}
                      </span>
                    </div>
                    <div className="agent-actions">
                      <button
                        onClick={() => deleteAgent(agent._id)}
                        className="action-btn danger small"
                        title="Delete Agent"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {brainAgents.length === 0 && (
                <div className="empty-state">
                  <Bot size={32} />
                  <p>No agents yet. Add agents to start using MCA workflows.</p>
                </div>
              )}
            </div>
            
            <div className="mca-protocol-section">
              <h4>MCA Protocol</h4>
              <div className="protocol-info">
                <div className="protocol-item">
                  <span className="protocol-label">Creativity Level:</span>
                  <span className="protocol-value">{brain.mcaProtocol?.creativityLevel || 'moderate'}</span>
                </div>
                <div className="protocol-item">
                  <span className="protocol-label">Thoroughness:</span>
                  <span className="protocol-value">{brain.mcaProtocol?.thoroughness || 'detailed'}</span>
                </div>
                <div className="protocol-item">
                  <span className="protocol-label">Fact Checking:</span>
                  <span className="protocol-value">{brain.mcaProtocol?.factChecking ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCreateBrainModal = () => {
    if (!showCreateModal) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content large">
          <div className="modal-header">
            <h2>Create MCA Brain</h2>
            <button onClick={() => setShowCreateModal(false)} className="close-btn">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label>Brain Name *</label>
              <input
                type="text"
                value={newBrain.name}
                onChange={(e) => setNewBrain(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter brain name"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newBrain.description}
                onChange={(e) => setNewBrain(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the brain's purpose and capabilities"
                rows={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Tone</label>
                <select
                  value={newBrain.tone}
                  onChange={(e) => setNewBrain(prev => ({ ...prev, tone: e.target.value }))}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Style</label>
                <select
                  value={newBrain.style}
                  onChange={(e) => setNewBrain(prev => ({ ...prev, style: e.target.value }))}
                >
                  <option value="clear and concise">Clear and Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="creative">Creative</option>
                  <option value="analytical">Analytical</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Purpose</label>
              <input
                type="text"
                value={newBrain.purpose}
                onChange={(e) => setNewBrain(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="What is this brain designed to accomplish?"
              />
            </div>
            
            <div className="form-group">
              <label>Initial System Prompt</label>
              <textarea
                value={newBrain.initial_prompt}
                onChange={(e) => setNewBrain(prev => ({ ...prev, initial_prompt: e.target.value }))}
                placeholder="Define the brain's core behavior and instructions"
                rows={4}
              />
            </div>
            
            <div className="mca-protocol-config">
              <h3>MCA Protocol Configuration</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Creativity Level</label>
                  <select
                    value={newBrain.mcaProtocol.creativityLevel}
                    onChange={(e) => setNewBrain(prev => ({
                      ...prev,
                      mcaProtocol: { ...prev.mcaProtocol, creativityLevel: e.target.value }
                    }))}
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Thoroughness</label>
                  <select
                    value={newBrain.mcaProtocol.thoroughness}
                    onChange={(e) => setNewBrain(prev => ({
                      ...prev,
                      mcaProtocol: { ...prev.mcaProtocol, thoroughness: e.target.value }
                    }))}
                  >
                    <option value="basic">Basic</option>
                    <option value="detailed">Detailed</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newBrain.mcaProtocol.factChecking}
                    onChange={(e) => setNewBrain(prev => ({
                      ...prev,
                      mcaProtocol: { ...prev.mcaProtocol, factChecking: e.target.checked }
                    }))}
                  />
                  Enable Fact Checking
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newBrain.mcaProtocol.followTemplates}
                    onChange={(e) => setNewBrain(prev => ({
                      ...prev,
                      mcaProtocol: { ...prev.mcaProtocol, followTemplates: e.target.checked }
                    }))}
                  />
                  Follow Templates
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newBrain.mcaProtocol.maintainBrandVoice}
                    onChange={(e) => setNewBrain(prev => ({
                      ...prev,
                      mcaProtocol: { ...prev.mcaProtocol, maintainBrandVoice: e.target.checked }
                    }))}
                  />
                  Maintain Brand Voice
                </label>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button onClick={() => setShowCreateModal(false)} className="btn secondary">
              Cancel
            </button>
            <button onClick={createMCABrain} className="btn primary">
              <Brain size={16} />
              Create MCA Brain
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateAgentModal = () => {
    if (!showCreateAgentModal) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create MCA Agent</h2>
            <button onClick={() => setShowCreateAgentModal(false)} className="close-btn">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label>Agent Name *</label>
              <input
                type="text"
                value={newAgent.name}
                onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter agent name"
                autoFocus
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={newAgent.role}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="maker">Maker</option>
                  <option value="checker">Checker</option>
                  <option value="approver">Approver</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Brain *</label>
                <select
                  value={newAgent.brain_id}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, brain_id: e.target.value }))}
                >
                  <option value="">Select a brain</option>
                  {brains.map(brain => (
                    <option key={brain._id} value={brain._id}>
                      {brain.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>System Prompt</label>
              <textarea
                value={newAgent.system_prompt}
                onChange={(e) => setNewAgent(prev => ({ ...prev, system_prompt: e.target.value }))}
                placeholder="Define the agent's specific behavior and responsibilities"
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label>Capabilities</label>
              <input
                type="text"
                value={newAgent.capabilities.join(', ')}
                onChange={(e) => setNewAgent(prev => ({ 
                  ...prev, 
                  capabilities: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                }))}
                placeholder="Enter capabilities separated by commas"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button onClick={() => setShowCreateAgentModal(false)} className="btn secondary">
              Cancel
            </button>
            <button onClick={createMCAAgent} className="btn primary">
              <Bot size={16} />
              Create Agent
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflowModal = () => {
    if (!showWorkflowModal || !selectedBrain) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content large">
          <div className="modal-header">
            <h2>Execute MCA Workflow - {selectedBrain.name}</h2>
            <button onClick={() => setShowWorkflowModal(false)} className="close-btn">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="workflow-info">
              <p>This will execute a complete Maker-Checker-Approver workflow using the agents in this brain.</p>
              <div className="brain-agents-summary">
                {getAgentsForBrain(selectedBrain._id).map(agent => (
                  <span key={agent._id} className={`agent-badge role-${agent.role}`}>
                    {agent.name} ({agent.role})
                  </span>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Workflow Input *</label>
              <textarea
                value={workflowInput}
                onChange={(e) => setWorkflowInput(e.target.value)}
                placeholder="Enter the task or content request for the MCA workflow..."
                rows={6}
                autoFocus
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button onClick={() => setShowWorkflowModal(false)} className="btn secondary">
              Cancel
            </button>
            <button 
              onClick={() => executeMCAWorkflow(selectedBrain._id)} 
              className="btn primary"
              disabled={executingWorkflow}
            >
              {executingWorkflow ? (
                <>
                  <Clock size={16} className="spinning" />
                  Executing...
                </>
              ) : (
                <>
                  <Workflow size={16} />
                  Execute MCA Workflow
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mca-brains-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading MCA Brains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mca-brains-page">
      <NotificationComponent />
      <ConfirmComponent />
      
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h1>
              <Layers size={28} />
              MCA Brain Management
            </h1>
            <p>Manage your Maker-Checker-Approver workflow brains and agents</p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn primary"
            >
              <Plus size={16} />
              Create MCA Brain
            </button>
          </div>
        </div>
        
        <div className="page-controls">
          <div className="search-container">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search MCA brains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="view-controls">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`view-btn ${displayMode === 'grid' ? 'active' : ''}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`view-btn ${displayMode === 'list' ? 'active' : ''}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {filteredBrains.length === 0 ? (
          <div className="empty-state">
            <Brain size={64} />
            <h3>No MCA Brains Found</h3>
            <p>
              {searchTerm 
                ? `No brains match "${searchTerm}". Try a different search term.`
                : 'Create your first MCA brain to start building intelligent content workflows.'
              }
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn primary"
            >
              <Plus size={16} />
              Create Your First MCA Brain
            </button>
          </div>
        ) : (
          <div className={`brains-container ${displayMode}`}>
            {filteredBrains.map(renderBrainCard)}
          </div>
        )}
        
        {activeWorkflows.length > 0 && (
          <div className="active-workflows">
            <h3>Active Workflows</h3>
            <div className="workflows-list">
              {activeWorkflows.map(workflow => (
                <div key={workflow.id} className="workflow-item">
                  <div className="workflow-info">
                    <span className="workflow-brain">{workflow.brainName}</span>
                    <span className={`workflow-status status-${workflow.status}`}>
                      {workflow.status}
                    </span>
                  </div>
                  <div className="workflow-progress">
                    {workflow.status === 'running' && (
                      <div className="progress-spinner"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {renderCreateBrainModal()}
      {renderCreateAgentModal()}
      {renderWorkflowModal()}

      {viewMode === 'detail' && selectedBrain && (
        <BrainDetailView 
          brain={selectedBrain}
          onClose={() => {
            setViewMode('overview');
            setSelectedBrain(null);
          }}
        />
      )}
    </div>
  );
};

export default MCABrainsPageNew;
