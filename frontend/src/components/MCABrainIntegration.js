// MCABrainIntegration.js - Enhanced Brains Page with MCA Workflow Integration
import React, { useState, useEffect } from 'react';

export const useMCABrainSystem = () => {
  const [mcaBrains, setMcaBrains] = useState(new Map());
  const [mcaSessions, setMcaSessions] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);

  // Initialize MCA Brain from regular brain data
  const initializeMCABrain = (brainData, customProtocol = null) => {
    const mcaBrain = {
      id: brainData._id,
      name: brainData.name || 'MCA Brain',
      description: brainData.description || 'Marketing Content Generation',
      protocol: customProtocol,
      agents: brainData.agents || [],
      created: new Date().toISOString()
    };

    // Store the mapping between backend brain ID and MCA brain
    setMcaBrains(prev => new Map(prev.set(brainData._id, mcaBrain)));
    
    return mcaBrain;
  };

  // Create MCA agents from existing brain agents
  const createMCAAgentsFromBrainData = (brainData, mcaBrain) => {
    const agents = brainData.agents || [];
    const mcaAgents = [];

    // Auto-assign roles based on agent names/descriptions or create default roles
    const roleMapping = {
      'maker': ['content', 'creator', 'writer', 'maker'],
      'checker': ['checker', 'reviewer', 'quality', 'validator'],
      'approver': ['approver', 'manager', 'final', 'approve']
    };

    // Try to map existing agents to MCA roles
    agents.forEach(agent => {
      const name = agent.name.toLowerCase();
      let assignedRole = 'maker'; // default role

      for (const [role, keywords] of Object.entries(roleMapping)) {
        if (keywords.some(keyword => name.includes(keyword))) {
          assignedRole = role;
          break;
        }
      }

      const mcaAgent = {
        name: agent.name,
        role: assignedRole,
        brainId: mcaBrain.id,
        capabilities: agent.capabilities || []
      };
      
      mcaAgents.push(mcaAgent);
    });

    // Ensure we have at least one of each role
    const roles = ['maker', 'checker', 'approver'];
    const existingRoles = mcaAgents.map(agent => agent.role);
    
    roles.forEach(role => {
      if (!existingRoles.includes(role)) {
        const defaultAgent = {
          name: `Default ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          role: role,
          brainId: mcaBrain.id,
          capabilities: [`${role}_capabilities`]
        };
        mcaAgents.push(defaultAgent);
      }
    });

    return mcaAgents;
  };

  // Execute MCA workflow
  const executeMCAWorkflow = async (brainId, prompt, customOptions = {}) => {
    const mcaBrain = mcaBrains.get(brainId);
    if (!mcaBrain) {
      throw new Error('MCA Brain not initialized for this brain ID');
    }

    const sessionId = `mca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Track the workflow session
    const workflowSession = {
      id: sessionId,
      brainId: brainId,
      prompt: prompt,
      status: 'running',
      startTime: new Date(),
      steps: []
    };

    setActiveWorkflows(prev => [...prev, workflowSession]);

    try {
      // For now, use simplified workflow execution
      const result = {
        sessionId: sessionId,
        prompt: prompt,
        status: 'completed',
        output: 'MCA Workflow executed successfully',
        timestamp: new Date().toISOString()
      };
      
      // Update session with success
      setActiveWorkflows(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'completed', result: result, endTime: new Date() }
            : session
        )
      );

      // Add to session history
      setMcaSessions(prev => [...prev, { ...workflowSession, status: 'completed', result: result, endTime: new Date() }]);

      return result;
    } catch (error) {
      // Update session with error
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

  // Get MCA brain analytics
  const getMCAAnalytics = (brainId) => {
    const mcaBrain = mcaBrains.get(brainId);
    if (!mcaBrain) return null;

    const brainSessions = mcaSessions.filter(session => session.brainId === brainId);
    const activeSessions = activeWorkflows.filter(workflow => workflow.brainId === brainId);

    return {
      totalSessions: brainSessions.length,
      activeSessions: activeSessions.length,
      successRate: brainSessions.length > 0 
        ? (brainSessions.filter(s => s.status === 'completed').length / brainSessions.length) * 100 
        : 0,
      averageExecutionTime: brainSessions.length > 0 
        ? brainSessions
            .filter(s => s.endTime && s.startTime)
            .reduce((acc, s) => acc + (s.endTime - s.startTime), 0) / brainSessions.length 
        : 0,
      agentCount: mcaBrain.agents ? mcaBrain.agents.length : 0,
      protocolVersion: mcaBrain.protocol ? mcaBrain.protocol.version || '1.0' : '1.0'
    };
  };

  return {
    mcaBrains,
    mcaSessions,
    activeWorkflows,
    initializeMCABrain,
    createMCAAgentsFromBrainData,
    executeMCAWorkflow,
    getMCAAnalytics
  };
};

// MCA Brain Card Component
export const MCABrainCard = ({ brain, onExecuteWorkflow, mcaAnalytics }) => {
  const [showMCAPanel, setShowMCAPanel] = useState(false);
  const [workflowPrompt, setWorkflowPrompt] = useState('');
  const [executing, setExecuting] = useState(false);

  const handleExecuteWorkflow = async () => {
    if (!workflowPrompt.trim()) return;
    
    setExecuting(true);
    try {
      await onExecuteWorkflow(brain._id, workflowPrompt);
      setWorkflowPrompt('');
      setShowMCAPanel(false);
    } catch (error) {
      console.error('MCA Workflow execution failed:', error);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="mca-brain-card">
      <div className="brain-card-header">
        <h3>{brain.name}</h3>
        <div className="mca-indicators">
          <span className="mca-badge">MCA Ready</span>
          {mcaAnalytics && (
            <span className="success-rate">
              {mcaAnalytics.successRate.toFixed(0)}% success
            </span>
          )}
        </div>
      </div>

      <div className="brain-card-content">
        <p className="brain-description">{brain.description}</p>
        
        {mcaAnalytics && (
          <div className="mca-stats">
            <div className="stat-item">
              <span className="stat-label">Agents:</span>
              <span className="stat-value">{mcaAnalytics.agentCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sessions:</span>
              <span className="stat-value">{mcaAnalytics.totalSessions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active:</span>
              <span className="stat-value">{mcaAnalytics.activeSessions}</span>
            </div>
          </div>
        )}
      </div>

      <div className="brain-card-actions">
        <button 
          className="mca-workflow-btn"
          onClick={() => setShowMCAPanel(!showMCAPanel)}
        >
          {showMCAPanel ? 'Cancel' : 'Start MCA Workflow'}
        </button>
      </div>

      {showMCAPanel && (
        <div className="mca-workflow-panel">
          <textarea
            value={workflowPrompt}
            onChange={(e) => setWorkflowPrompt(e.target.value)}
            placeholder="Enter your content generation request (e.g., 'Create a social media campaign for new product launch')..."
            className="workflow-prompt-input"
            rows="3"
          />
          <div className="workflow-panel-actions">
            <button 
              onClick={handleExecuteWorkflow}
              disabled={executing || !workflowPrompt.trim()}
              className="execute-workflow-btn"
            >
              {executing ? 'Executing...' : 'Execute MCA Workflow'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// MCA Workflow Status Component
export const MCAWorkflowStatus = ({ activeWorkflows, mcaSessions }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mca-workflow-status">
      <div className="status-header">
        <h3>MCA Workflow Status</h3>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="toggle-details-btn"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="status-overview">
        <div className="status-stat">
          <span className="status-label">Active Workflows:</span>
          <span className="status-value">{activeWorkflows.length}</span>
        </div>
        <div className="status-stat">
          <span className="status-label">Total Sessions:</span>
          <span className="status-value">{mcaSessions.length}</span>
        </div>
      </div>

      {showDetails && (
        <div className="workflow-details">
          {activeWorkflows.length > 0 && (
            <div className="active-workflows">
              <h4>Active Workflows</h4>
              {activeWorkflows.map(workflow => (
                <div key={workflow.id} className="workflow-item">
                  <div className="workflow-info">
                    <span className="workflow-id">{workflow.id}</span>
                    <span className="workflow-status">{workflow.status}</span>
                  </div>
                  <div className="workflow-prompt">{workflow.prompt}</div>
                </div>
              ))}
            </div>
          )}

          {mcaSessions.length > 0 && (
            <div className="session-history">
              <h4>Recent Sessions</h4>
              {mcaSessions.slice(-5).map(session => (
                <div key={session.id} className="session-item">
                  <div className="session-info">
                    <span className="session-status">{session.status}</span>
                    <span className="session-time">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="session-prompt">{session.prompt}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
