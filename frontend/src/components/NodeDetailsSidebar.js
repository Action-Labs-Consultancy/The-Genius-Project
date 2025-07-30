import React, { useState, useEffect } from 'react';
import { NODE_SCHEMAS, validateNodeParameters, getNodeDefaults } from '../nodeSchemas';
import './NodeDetailsSidebar.css';

const NodeDetailsSidebar = ({ 
  selectedNode, 
  onNodeUpdate, 
  onClose, 
  isVisible,
  edges,
  nodes,
  onExecuteNode
}) => {
  const [nodeData, setNodeData] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [availableBrains, setAvailableBrains] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    if (selectedNode) {
      const schema = NODE_SCHEMAS[selectedNode.data?.nodeType || selectedNode.type];
      const nodeType = selectedNode.data?.nodeType || selectedNode.type;
      const defaults = getNodeDefaults(nodeType);
      
      setNodeData({
        ...defaults,
        ...selectedNode.data,
        config: {
          ...defaults,
          ...(selectedNode.data.config || {})
        }
      });

      // Load brain and agent options for AI nodes
      if (nodeType === 'brain' || nodeType === 'ai') {
        loadAvailableBrains();
      }
      if (nodeType === 'agent') {
        loadAvailableBrains(); // Need brains first to get agents
        loadAvailableAgents();
      }
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedNode && nodeData.config) {
      const nodeType = selectedNode.data?.nodeType || selectedNode.type;
      const errors = validateNodeParameters(nodeType, nodeData.config);
      setValidationErrors(errors);
    }
  }, [selectedNode, nodeData.config]);

  const loadAvailableBrains = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/brains`);
      if (response.ok) {
        const result = await response.json();
        const brains = result.data || result;
        const brainOptions = brains.map(brain => ({
          value: brain._id,
          label: brain.name,
          description: brain.description
        }));
        setAvailableBrains(brainOptions);
        console.log('✅ Loaded brains:', brainOptions.length);
      } else {
        console.error('Failed to load brains:', response.status);
      }
    } catch (error) {
      console.error('Failed to load brains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/brains`);
      if (response.ok) {
        const result = await response.json();
        const brains = result.data || result;
        
        // Get agents from all brains
        const allAgents = [];
        for (const brain of brains) {
          try {
            const agentResponse = await fetch(`${API_BASE_URL}/api/brains/${brain._id}/agents`);
            if (agentResponse.ok) {
              const agentResult = await agentResponse.json();
              const agents = agentResult.data || agentResult;
              agents.forEach(agent => {
                allAgents.push({
                  value: agent._id,
                  label: `${agent.agent_name} (${brain.name})`,
                  brainId: brain._id,
                  brainName: brain.name,
                  description: agent.role_description
                });
              });
            }
          } catch (err) {
            console.warn(`Failed to load agents for brain ${brain.name}:`, err);
          }
        }
        
        setAvailableAgents(allAgents);
        console.log('✅ Loaded agents:', allAgents.length);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParameterChange = (paramName, value) => {
    const updatedNodeData = {
      ...nodeData,
      config: {
        ...nodeData.config,
        [paramName]: value
      }
    };
    
    setNodeData(updatedNodeData);
    
    // Update the node immediately
    if (onNodeUpdate) {
      onNodeUpdate(selectedNode.id, updatedNodeData);
    }
  };

  const handleBasicPropertyChange = (property, value) => {
    const updatedNodeData = {
      ...nodeData,
      [property]: value
    };
    
    setNodeData(updatedNodeData);
    
    if (onNodeUpdate) {
      onNodeUpdate(selectedNode.id, updatedNodeData);
    }
  };

  const renderParameterInput = (paramName, paramConfig, value) => {
    const inputId = `param-${paramName}`;
    
    switch (paramConfig.type) {
      case 'text':
        return (
          <input
            id={inputId}
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={paramConfig.placeholder}
            className="parameter-input"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            id={inputId}
            value={value || ''}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={paramConfig.placeholder}
            className="parameter-textarea"
            rows={4}
          />
        );
      
      case 'number':
        return (
          <input
            id={inputId}
            type="number"
            value={value || ''}
            onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value) || '')}
            placeholder={paramConfig.placeholder}
            min={paramConfig.min}
            max={paramConfig.max}
            step={paramConfig.step}
            className="parameter-input"
          />
        );
      
      case 'select':
        let options = [];
        
        // Handle brain selection
        if (paramName === 'brainId') {
          options = availableBrains;
        }
        // Handle agent selection  
        else if (paramName === 'agentId') {
          options = availableAgents;
        }
        // Handle regular select options
        else if (paramConfig.options) {
          options = paramConfig.options.map(opt => ({ value: opt, label: opt }));
        }
        
        return (
          <div className="parameter-select-container">
            <select
              id={inputId}
              value={value || ''}
              onChange={(e) => handleParameterChange(paramName, e.target.value)}
              className="parameter-select"
              disabled={isLoading && (paramName === 'brainId' || paramName === 'agentId')}
            >
              <option value="">
                {isLoading && (paramName === 'brainId' || paramName === 'agentId') 
                  ? `Loading ${paramName === 'brainId' ? 'brains' : 'agents'}...`
                  : `Select ${paramConfig.label}`}
              </option>
              {options.map(option => (
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label}
                </option>
              ))}
            </select>
            {(paramName === 'brainId' || paramName === 'agentId') && options.length === 0 && !isLoading && (
              <div className="parameter-help">
                No {paramName === 'brainId' ? 'brains' : 'agents'} available. 
                Create some in the Brains page first.
              </div>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <label className="parameter-checkbox">
            <input
              id={inputId}
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleParameterChange(paramName, e.target.checked)}
            />
            <span className="checkmark"></span>
          </label>
        );
      
      case 'json':
        return (
          <textarea
            id={inputId}
            value={value || '{}'}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={paramConfig.placeholder}
            className="parameter-textarea json-input"
            rows={3}
          />
        );
      
      default:
        return (
          <input
            id={inputId}
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={paramConfig.placeholder}
            className="parameter-input"
          />
        );
    }
  };

  const getConnectedNodes = () => {
    if (!selectedNode) return { inputs: [], outputs: [] };
    
    const inputs = edges
      .filter(edge => edge.target === selectedNode.id)
      .map(edge => nodes.find(node => node.id === edge.source))
      .filter(Boolean);
    
    const outputs = edges
      .filter(edge => edge.source === selectedNode.id)
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(Boolean);
    
    return { inputs, outputs };
  };

  const handleTestNode = async () => {
    if (!selectedNode || validationErrors.length > 0) return;
    
    setIsLoading(true);
    try {
      await onExecuteNode(selectedNode.id);
    } catch (error) {
      console.error('Node test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedNode || !isVisible) {
    return null;
  }

  const schema = NODE_SCHEMAS[selectedNode.data?.nodeType || selectedNode.type];
  const { inputs, outputs } = getConnectedNodes();
  const hasErrors = validationErrors.length > 0;

  return (
    <div className="node-details-sidebar">
      <div className="sidebar-header">
        <div className="node-info">
          <div className="node-icon">
            {selectedNode.type === 'ai' ? '🤖' : 
             selectedNode.type === 'httpRequest' ? '🌐' :
             selectedNode.type === 'database' ? 'DB' : '⚙️'}
          </div>
          <div className="node-title">
            <h3>{schema?.label || selectedNode.type}</h3>
            <span className="node-id">ID: {selectedNode.id}</span>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="sidebar-content">
        {/* Basic Properties */}
        <div className="section">
          <h4>Basic Properties</h4>
          <div className="parameter-group">
            <label htmlFor="node-label">Node Label</label>
            <input
              id="node-label"
              type="text"
              value={nodeData.label || ''}
              onChange={(e) => handleBasicPropertyChange('label', e.target.value)}
              className="parameter-input"
              placeholder="Enter node label"
            />
          </div>
          
          <div className="parameter-group">
            <label>Node Type</label>
            <div className="readonly-field">{selectedNode.type}</div>
          </div>

          {schema?.description && (
            <div className="parameter-group">
              <label>Description</label>
              <div className="description">{schema.description}</div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {hasErrors && (
          <div className="section error-section">
            <h4>⚠️ Configuration Errors</h4>
            <ul className="error-list">
              {validationErrors.map((error, index) => (
                <li key={index} className="error-item">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Parameters */}
        {schema?.requiredParams && Object.keys(schema.requiredParams).length > 0 && (
          <div className="section">
            <h4>Required Parameters</h4>
            {Object.entries(schema.requiredParams).map(([paramName, paramConfig]) => (
              <div key={paramName} className="parameter-group required">
                <label htmlFor={`param-${paramName}`}>
                  {paramConfig.label} <span className="required-indicator">*</span>
                </label>
                {renderParameterInput(paramName, paramConfig, nodeData.config?.[paramName])}
                {paramConfig.placeholder && (
                  <div className="parameter-hint">{paramConfig.placeholder}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Optional Parameters */}
        {schema?.optionalParams && Object.keys(schema.optionalParams).length > 0 && (
          <div className="section">
            <h4>Optional Parameters</h4>
            {Object.entries(schema.optionalParams).map(([paramName, paramConfig]) => (
              <div key={paramName} className="parameter-group">
                <label htmlFor={`param-${paramName}`}>{paramConfig.label}</label>
                {renderParameterInput(paramName, paramConfig, nodeData.config?.[paramName])}
                {paramConfig.placeholder && (
                  <div className="parameter-hint">{paramConfig.placeholder}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Connections */}
        <div className="section">
          <h4>Connections</h4>
          
          <div className="connection-group">
            <label>Input Connections</label>
            <div className="connection-list">
              {inputs.length > 0 ? (
                inputs.map(node => (
                  <div key={node.id} className="connection-item">
                    <span className="connection-icon">←</span>
                    <span className="connection-label">{node.data.label || node.type}</span>
                    <span className="connection-id">({node.id})</span>
                  </div>
                ))
              ) : (
                <div className="no-connections">No input connections</div>
              )}
            </div>
          </div>

          <div className="connection-group">
            <label>Output Connections</label>
            <div className="connection-list">
              {outputs.length > 0 ? (
                outputs.map(node => (
                  <div key={node.id} className="connection-item">
                    <span className="connection-icon">→</span>
                    <span className="connection-label">{node.data.label || node.type}</span>
                    <span className="connection-id">({node.id})</span>
                  </div>
                ))
              ) : (
                <div className="no-connections">No output connections</div>
              )}
            </div>
          </div>
        </div>

        {/* Node Status */}
        {nodeData.status && (
          <div className="section">
            <h4>Execution Status</h4>
            <div className={`status-indicator ${nodeData.status}`}>
              {nodeData.status === 'success' ? '✅ Success' :
               nodeData.status === 'error' ? '❌ Error' :
               nodeData.status === 'running' ? '🔄 Running' :
               nodeData.status === 'pending' ? '⏳ Pending' : nodeData.status}
            </div>
            
            {nodeData.lastOutput && (
              <div className="last-output">
                <label>Last Output</label>
                <pre className="output-content">{JSON.stringify(nodeData.lastOutput, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="section actions-section">
          <h4>Actions</h4>
          <div className="action-buttons">
            <button
              className={`action-btn test-btn ${hasErrors ? 'disabled' : ''}`}
              onClick={handleTestNode}
              disabled={hasErrors || isLoading}
            >
              {isLoading ? '🔄 Testing...' : '🧪 Test Node'}
            </button>
            
            <button className="action-btn secondary">
              📋 Copy Configuration
            </button>
            
            <button className="action-btn secondary">
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsSidebar;
