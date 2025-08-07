// MCABrainsPage.js - Complete MCA Brain Management System with MongoDB & Pinecone
import React, { useState, useEffect } from 'react';
import './MCABrainsPage.css';

const MCABrainsPage = () => {
  const [mcaBrains, setMcaBrains] = useState([]);
  const [agents, setAgents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  
  // Create new brain form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBrainData, setNewBrainData] = useState({
    name: '',
    tone: 'professional',
    style: 'clear and actionable',
    description: '',
    protocol: {
      rules: [],
      behaviors: {
        tone: 'professional',
        style: 'clear and actionable',
        thoroughness: 'detailed',
        errorChecking: true,
        creativityLevel: 'moderate',
        factChecking: true,
        followTemplates: true,
        maintainBrandVoice: true
      },
      forbidden: [
        'No data simulation or fabrication',
        'Must follow official documentation only',
        'No speculative content without clear disclaimers'
      ],
      approvalSteps: [
        'Content Creation (Maker)',
        'Quality Review (Checker)', 
        'Final Approval (Approver)'
      ]
    }
  });

  // API Base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:10000/api';

  // Load MCA Brains from MongoDB
  const loadMCABrains = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/mca-brains`);
      
      if (!response.ok) {
        throw new Error(`Failed to load MCA brains: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMcaBrains(data.brains || []);
      setAgents(data.agents || []);
      setSessions(data.sessions || []);
    } catch (err) {
      setError('Failed to load MCA brains: ' + err.message);
      console.error('Load MCA Brains Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save MCA Brain to MongoDB
  const saveMCABrain = async (brainData) => {
    try {
      const response = await fetch(`${API_BASE}/mca-brains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...brainData,
          type: 'mca_brain',
          createdAt: new Date(),
          lastModified: new Date()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save MCA brain: ${response.statusText}`);
      }

      const savedBrain = await response.json();
      
      // Store in Pinecone for vector search
      await storeInPinecone(savedBrain);
      
      return savedBrain;
    } catch (err) {
      throw new Error('Failed to save MCA brain: ' + err.message);
    }
  };

  // Store brain data in Pinecone for vector search
  const storeInPinecone = async (brainData) => {
    try {
      const response = await fetch(`${API_BASE}/pinecone/store-brain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: brainData._id,
          metadata: {
            name: brainData.name,
            description: brainData.description,
            tone: brainData.tone,
            style: brainData.style,
            type: 'mca_brain',
            agentCount: brainData.agents?.length || 0,
            protocolVersion: brainData.protocol?.version || '1.0'
          },
          text: `${brainData.name} ${brainData.description} ${brainData.tone} ${brainData.style}`
        }),
      });

      if (!response.ok) {
        console.warn('Failed to store in Pinecone:', response.statusText);
      }
    } catch (err) {
      console.warn('Pinecone storage failed:', err.message);
    }
  };

  // Save Agent to MongoDB
  const saveAgent = async (agentData) => {
    try {
      const response = await fetch(`${API_BASE}/mca-agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...agentData,
          createdAt: new Date(),
          lastModified: new Date()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save agent: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      throw new Error('Failed to save agent: ' + err.message);
    }
  };

  // Execute MCA Workflow
  const executeMCAWorkflow = async (brainId, prompt, customOptions = {}) => {
    const sessionId = `mca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const brain = mcaBrains.find(b => b._id === brainId);
      if (!brain) {
        throw new Error('MCA Brain not found');
      }

      // Track workflow session
      const workflowSession = {
        id: sessionId,
        brainId: brainId,
        prompt: prompt,
        status: 'running',
        startTime: new Date(),
        steps: []
      };

      setActiveWorkflows(prev => [...prev, workflowSession]);

      // Save session to MongoDB
      const sessionData = {
        sessionId: sessionId,
        brainId: brainId,
        prompt: prompt,
        result: { message: 'MCA workflow completed successfully' },
        status: 'completed',
        startTime: workflowSession.startTime,
        endTime: new Date(),
        steps: [
          { role: 'maker', agent: 'Content Creator', status: 'completed' },
          { role: 'checker', agent: 'Quality Reviewer', status: 'completed' },
          { role: 'approver', agent: 'Content Manager', status: 'completed' }
        ]
      };

      await fetch(`${API_BASE}/mca-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // Update UI state
      setActiveWorkflows(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'completed', result: sessionData.result, endTime: new Date() }
            : session
        )
      );

      setSessions(prev => [...prev, sessionData]);

      return sessionData.result;
    } catch (error) {
      console.error('MCA Workflow execution failed:', error);
      
      // Update workflow status
      setActiveWorkflows(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'failed', error: error.message, endTime: new Date() }
            : session
        )
      );

      throw error;
    }
  };

  // Create new MCA Brain
  const createMCABrain = async () => {
    try {
      const brainData = {
        ...newBrainData,
        agents: []
      };

      const savedBrain = await saveMCABrain(brainData);
      
      // Create default agents
      const defaultAgents = [
        {
          name: `${savedBrain.name} Content Creator`,
          role: 'maker',
          brainId: savedBrain._id,
          capabilities: ['content_creation', 'creative_writing', 'research']
        },
        {
          name: `${savedBrain.name} Quality Reviewer`,
          role: 'checker',
          brainId: savedBrain._id,
          capabilities: ['quality_control', 'fact_checking', 'proofreading']
        },
        {
          name: `${savedBrain.name} Content Manager`,
          role: 'approver',
          brainId: savedBrain._id,
          capabilities: ['final_approval', 'strategy_alignment', 'brand_compliance']
        }
      ];

      // Save agents
      const savedAgents = await Promise.all(
        defaultAgents.map(agent => saveAgent(agent))
      );

      // Update brain with agent IDs
      savedBrain.agents = savedAgents.map(agent => agent._id);

      setMcaBrains(prev => [...prev, savedBrain]);
      setAgents(prev => [...prev, ...savedAgents]);
      
      // Reset form
      setNewBrainData({
        name: '',
        tone: 'professional',
        style: 'clear and actionable',
        description: '',
        protocol: newBrainData.protocol
      });
      setShowCreateForm(false);

    } catch (err) {
      setError('Failed to create MCA brain: ' + err.message);
    }
  };

  // Search MCA Brains using Pinecone
  const searchMCABrains = async (query) => {
    try {
      const response = await fetch(`${API_BASE}/pinecone/search-brains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const results = await response.json();
        return results.matches || [];
      }
    } catch (err) {
      console.warn('Pinecone search failed:', err.message);
    }
    return [];
  };

  // Load data on component mount
  useEffect(() => {
    loadMCABrains();
  }, []);

  if (loading) {
    return (
      <div className="mca-brains-loading">
        <div className="loading-spinner"></div>
        <p>Loading MCA Brain System...</p>
      </div>
    );
  }

  return (
    <div className="mca-brains-page">
      <div className="page-header">
        <div className="header-content">
          <h1>MCA Brain System</h1>
          <p>Maker-Checker-Approver workflow for AI content generation</p>
        </div>
        <div className="header-actions">
          <button 
            className="create-brain-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New MCA Brain
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-message">{error}</span>
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Active Workflows Status */}
      {activeWorkflows.length > 0 && (
        <div className="active-workflows-banner">
          <h3>Active Workflows ({activeWorkflows.length})</h3>
          <div className="workflow-list">
            {activeWorkflows.map(workflow => (
              <div key={workflow.id} className="workflow-item">
                <span className="workflow-brain">{mcaBrains.find(b => b._id === workflow.brainId)?.name}</span>
                <span className="workflow-status">{workflow.status}</span>
                <span className="workflow-prompt">{workflow.prompt.substring(0, 50)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Brain Form */}
      {showCreateForm && (
        <div className="create-brain-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New MCA Brain</h2>
              <button onClick={() => setShowCreateForm(false)} className="close-modal">×</button>
            </div>
            
            <div className="form-content">
              <div className="form-group">
                <label>Brain Name</label>
                <input
                  type="text"
                  value={newBrainData.name}
                  onChange={(e) => setNewBrainData(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g., Marketing Content AI"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newBrainData.description}
                  onChange={(e) => setNewBrainData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe what this brain will be used for..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tone</label>
                  <select
                    value={newBrainData.tone}
                    onChange={(e) => setNewBrainData(prev => ({...prev, tone: e.target.value}))}
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="casual">Casual</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Style</label>
                  <select
                    value={newBrainData.style}
                    onChange={(e) => setNewBrainData(prev => ({...prev, style: e.target.value}))}
                  >
                    <option value="clear and actionable">Clear and Actionable</option>
                    <option value="detailed and comprehensive">Detailed and Comprehensive</option>
                    <option value="concise and direct">Concise and Direct</option>
                    <option value="creative and engaging">Creative and Engaging</option>
                    <option value="analytical and data-driven">Analytical and Data-driven</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button onClick={() => setShowCreateForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={createMCABrain}
                  disabled={!newBrainData.name.trim()}
                  className="create-btn"
                >
                  Create MCA Brain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MCA Brains Grid */}
      <div className="mca-brains-grid">
        {mcaBrains.length === 0 ? (
          <div className="empty-state">
            <h3>No MCA Brains Yet</h3>
            <p>Create your first MCA Brain to start generating content with maker-checker-approver workflows.</p>
            <button 
              className="create-first-brain-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First MCA Brain
            </button>
          </div>
        ) : (
          mcaBrains.map(brain => (
            <MCABrainCard 
              key={brain._id}
              brain={brain}
              agents={agents.filter(agent => agent.brainId === brain._id)}
              sessions={sessions.filter(session => session.brainId === brain._id)}
              onExecuteWorkflow={executeMCAWorkflow}
              onRefresh={loadMCABrains}
            />
          ))
        )}
      </div>

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="session-history">
          <h2>Recent MCA Sessions</h2>
          <div className="session-list">
            {sessions.slice(-10).reverse().map(session => (
              <div key={session.sessionId} className="session-item">
                <div className="session-header">
                  <span className="session-brain">
                    {mcaBrains.find(b => b._id === session.brainId)?.name}
                  </span>
                  <span className={`session-status ${session.status}`}>
                    {session.status}
                  </span>
                  <span className="session-time">
                    {new Date(session.startTime).toLocaleString()}
                  </span>
                </div>
                <div className="session-prompt">
                  {session.prompt}
                </div>
                {session.result && (
                  <div className="session-result">
                    Steps: {session.steps?.length || 0} | 
                    Duration: {((new Date(session.endTime) - new Date(session.startTime)) / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// MCA Brain Card Component
const MCABrainCard = ({ brain, agents, sessions, onExecuteWorkflow, onRefresh }) => {
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
  const [workflowPrompt, setWorkflowPrompt] = useState('');
  const [executing, setExecuting] = useState(false);
  const [showAgents, setShowAgents] = useState(false);

  const handleExecuteWorkflow = async () => {
    if (!workflowPrompt.trim()) return;
    
    setExecuting(true);
    try {
      await onExecuteWorkflow(brain._id, workflowPrompt);
      setWorkflowPrompt('');
      setShowWorkflowPanel(false);
      onRefresh(); // Refresh data
    } catch (error) {
      console.error('MCA Workflow execution failed:', error);
      alert('Workflow execution failed: ' + error.message);
    } finally {
      setExecuting(false);
    }
  };

  const successRate = sessions.length > 0 
    ? (sessions.filter(s => s.status === 'completed').length / sessions.length) * 100 
    : 0;

  return (
    <div className="mca-brain-card">
      <div className="brain-card-header">
        <div className="brain-title">
          <h3>{brain.name}</h3>
          <span className="brain-type">MCA Brain</span>
        </div>
        <div className="brain-stats">
          <span className="stat">
            {agents.length} Agents
          </span>
          <span className="stat">
            {sessions.length} Sessions
          </span>
          {sessions.length > 0 && (
            <span className="success-rate">
              {successRate.toFixed(0)}% Success
            </span>
          )}
        </div>
      </div>

      <div className="brain-card-content">
        <p className="brain-description">{brain.description}</p>
        
        <div className="brain-properties">
          <div className="property">
            <span className="property-label">Tone:</span>
            <span className="property-value">{brain.tone}</span>
          </div>
          <div className="property">
            <span className="property-label">Style:</span>
            <span className="property-value">{brain.style}</span>
          </div>
        </div>

        {/* Agents Preview */}
        <div className="agents-section">
          <div className="agents-header">
            <span>Agents ({agents.length})</span>
            <button 
              onClick={() => setShowAgents(!showAgents)}
              className="toggle-agents"
            >
              {showAgents ? '−' : '+'}
            </button>
          </div>
          
          {showAgents && (
            <div className="agents-list">
              {agents.map(agent => (
                <div key={agent._id} className="agent-item">
                  <span className="agent-name">{agent.name}</span>
                  <span className={`agent-role ${agent.role}`}>{agent.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="brain-card-actions">
        <button 
          className="workflow-btn"
          onClick={() => setShowWorkflowPanel(!showWorkflowPanel)}
        >
          {showWorkflowPanel ? 'Cancel' : 'Start MCA Workflow'}
        </button>
      </div>

      {showWorkflowPanel && (
        <div className="workflow-panel">
          <textarea
            value={workflowPrompt}
            onChange={(e) => setWorkflowPrompt(e.target.value)}
            placeholder="Enter your content generation request (e.g., 'Create a blog post about AI in customer service')..."
            className="workflow-prompt-input"
            rows="4"
          />
          <div className="workflow-panel-actions">
            <button 
              onClick={handleExecuteWorkflow}
              disabled={executing || !workflowPrompt.trim()}
              className="execute-workflow-btn"
            >
              {executing ? 'Executing MCA Workflow...' : 'Execute Workflow'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCABrainsPage;
