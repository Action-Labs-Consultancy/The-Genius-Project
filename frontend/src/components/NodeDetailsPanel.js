import React, { useState, useEffect } from 'react';
import './NodeDetailsPanel.css';

const DATA_TYPES = [
  { value: 'string', label: 'String', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Boolean', icon: '✓' },
  { value: 'object', label: 'Object', icon: '{}' },
  { value: 'array', label: 'Array', icon: '[]' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'binary', label: 'Binary', icon: '💾' }
];

const NODE_PARAMETER_TEMPLATES = {
  httpRequest: {
    method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
    url: { type: 'string', required: true, placeholder: 'https://api.example.com/data' },
    headers: { type: 'object', default: '{}' },
    body: { type: 'text', placeholder: 'Request body (JSON)' },
    timeout: { type: 'number', default: 30000, unit: 'ms' },
    followRedirects: { type: 'boolean', default: true },
    authentication: { type: 'select', options: ['none', 'basic', 'bearer', 'apikey'], default: 'none' }
  },
  setVariable: {
    variable: { type: 'string', required: true, placeholder: 'variableName' },
    value: { type: 'string', required: true, placeholder: 'Variable value' },
    dataType: { type: 'select', options: DATA_TYPES.map(dt => dt.value), default: 'string' },
    scope: { type: 'select', options: ['workflow', 'global', 'temporary'], default: 'workflow' }
  },
  ifCondition: {
    conditions: { type: 'array', default: [] },
    operator: { type: 'select', options: ['AND', 'OR'], default: 'AND' }
  },
  delay: {
    duration: { type: 'number', required: true, default: 1000, unit: 'ms' },
    type: { type: 'select', options: ['fixed', 'random'], default: 'fixed' },
    maxDuration: { type: 'number', unit: 'ms', condition: 'type=random' }
  },
  database: {
    operation: { type: 'select', options: ['select', 'insert', 'update', 'delete'], default: 'select' },
    collection: { type: 'string', required: true, placeholder: 'Collection/Table name' },
    query: { type: 'object', placeholder: '{}' },
    data: { type: 'object', condition: 'operation=insert,update' }
  },
  ai: {
    provider: { type: 'select', options: ['openai', 'anthropic', 'local'], default: 'openai' },
    model: { type: 'string', default: 'gpt-3.5-turbo' },
    prompt: { type: 'text', required: true, placeholder: 'AI prompt template' },
    temperature: { type: 'number', default: 0.7, min: 0, max: 2, step: 0.1 },
    maxTokens: { type: 'number', default: 1000 }
  },
  email: {
    to: { type: 'string', required: true, placeholder: 'recipient@example.com' },
    subject: { type: 'string', required: true, placeholder: 'Email subject' },
    body: { type: 'text', required: true, placeholder: 'Email body' },
    type: { type: 'select', options: ['plain', 'html'], default: 'plain' }
  }
};

const NodeDetailsPanel = ({ selectedNode, nodes, edges, onNodeUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState('parameters');
  const [nodeParams, setNodeParams] = useState({});
  const [nodeConnections, setNodeConnections] = useState({ incoming: [], outgoing: [] });

  useEffect(() => {
    if (selectedNode) {
      setNodeParams(selectedNode.data.params || {});
      
      // Calculate connections
      const incoming = edges.filter(edge => edge.target === selectedNode.id);
      const outgoing = edges.filter(edge => edge.source === selectedNode.id);
      setNodeConnections({ incoming, outgoing });
    }
  }, [selectedNode, edges]);

  const updateParameter = (key, value) => {
    const newParams = { ...nodeParams, [key]: value };
    setNodeParams(newParams);
    
    if (onNodeUpdate) {
      onNodeUpdate({
        ...selectedNode,
        data: {
          ...selectedNode.data,
          params: newParams
        }
      });
    }
  };

  const renderParameterInput = (key, config) => {
    const currentValue = nodeParams[key] || config.default || '';

    switch (config.type) {
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => updateParameter(key, e.target.value)}
            className="param-select"
          >
            {config.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'boolean':
        return (
          <label className="param-checkbox">
            <input
              type="checkbox"
              checked={currentValue}
              onChange={(e) => updateParameter(key, e.target.checked)}
            />
            <span className="checkmark"></span>
          </label>
        );
      
      case 'number':
        return (
          <div className="param-number-group">
            <input
              type="number"
              value={currentValue}
              onChange={(e) => updateParameter(key, parseFloat(e.target.value) || 0)}
              min={config.min}
              max={config.max}
              step={config.step}
              className="param-number"
            />
            {config.unit && <span className="param-unit">{config.unit}</span>}
          </div>
        );
      
      case 'text':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => updateParameter(key, e.target.value)}
            placeholder={config.placeholder}
            className="param-textarea"
            rows="4"
          />
        );
      
      case 'object':
        return (
          <textarea
            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateParameter(key, parsed);
              } catch {
                updateParameter(key, e.target.value);
              }
            }}
            placeholder={config.placeholder}
            className="param-textarea code"
            rows="4"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => updateParameter(key, e.target.value)}
            placeholder={config.placeholder}
            className="param-input"
            required={config.required}
          />
        );
    }
  };

  const getNodeIcon = (nodeType) => {
    const iconMap = {
      httpRequest: '🌐', setVariable: '📝', ifCondition: '?', delay: '⏱',
      database: 'DB', ai: '🤖', email: '✉', start: '▶', end: '🏁'
    };
    return iconMap[nodeType] || '⚪';
  };

  const getConnectionNodeName = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.data.label || node.type : nodeId;
  };

  if (!selectedNode) return null;

  const parameterTemplate = NODE_PARAMETER_TEMPLATES[selectedNode.type] || {};

  return (
    <div className="node-details-panel">
      <div className="panel-header">
        <div className="node-info">
          <span className="node-icon">{getNodeIcon(selectedNode.type)}</span>
          <div>
            <h3>{selectedNode.data.label || selectedNode.type}</h3>
            <span className="node-id">ID: {selectedNode.id}</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-tabs">
        <button 
          className={`tab ${activeTab === 'parameters' ? 'active' : ''}`}
          onClick={() => setActiveTab('parameters')}
        >
          Parameters
        </button>
        <button 
          className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          Connections
        </button>
        <button 
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data Types
        </button>
        <button 
          className={`tab ${activeTab === 'execution' ? 'active' : ''}`}
          onClick={() => setActiveTab('execution')}
        >
          Execution
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'parameters' && (
          <div className="parameters-tab">
            <div className="basic-info">
              <div className="param-group">
                <label>Node Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => onNodeUpdate({
                    ...selectedNode,
                    data: { ...selectedNode.data, label: e.target.value }
                  })}
                  className="param-input"
                />
              </div>
              <div className="param-group">
                <label>Node Type</label>
                <span className="param-value readonly">{selectedNode.type}</span>
              </div>
            </div>

            <div className="custom-parameters">
              <h4>Node Configuration</h4>
              {Object.keys(parameterTemplate).length === 0 ? (
                <p className="no-params">No configurable parameters for this node type.</p>
              ) : (
                Object.entries(parameterTemplate).map(([key, config]) => (
                  <div key={key} className="param-group">
                    <label>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      {config.required && <span className="required">*</span>}
                    </label>
                    {renderParameterInput(key, config)}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="connections-tab">
            <div className="connection-section">
              <h4>Incoming Connections ({nodeConnections.incoming.length})</h4>
              {nodeConnections.incoming.length === 0 ? (
                <p className="no-connections">No incoming connections</p>
              ) : (
                <div className="connection-list">
                  {nodeConnections.incoming.map(edge => (
                    <div key={edge.id} className="connection-item incoming">
                      <span className="connection-icon">←</span>
                      <span className="connection-node">{getConnectionNodeName(edge.source)}</span>
                      <span className="connection-id">({edge.id})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="connection-section">
              <h4>Outgoing Connections ({nodeConnections.outgoing.length})</h4>
              {nodeConnections.outgoing.length === 0 ? (
                <p className="no-connections">No outgoing connections</p>
              ) : (
                <div className="connection-list">
                  {nodeConnections.outgoing.map(edge => (
                    <div key={edge.id} className="connection-item outgoing">
                      <span className="connection-icon">→</span>
                      <span className="connection-node">{getConnectionNodeName(edge.target)}</span>
                      <span className="connection-id">({edge.id})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-tab">
            <h4>Data Types</h4>
            <div className="data-types-list">
              {DATA_TYPES.map(dataType => (
                <div key={dataType.value} className="data-type-item">
                  <span className="data-type-icon">{dataType.icon}</span>
                  <span className="data-type-name">{dataType.label}</span>
                  <span className="data-type-value">{dataType.value}</span>
                </div>
              ))}
            </div>

            <div className="data-flow">
              <h4>Data Flow</h4>
              <div className="data-info">
                <p>Input Data: {nodeConnections.incoming.length > 0 ? 'Available' : 'None'}</p>
                <p>Output Data: {nodeConnections.outgoing.length > 0 ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'execution' && (
          <div className="execution-tab">
            <div className="execution-status">
              <h4>Execution Status</h4>
              <div className="status-indicator">
                <span className={`status-icon ${selectedNode.data.status || 'pending'}`}>
                  {selectedNode.data.status === 'success' ? '✅' : 
                   selectedNode.data.status === 'error' ? '❌' : '⏳'}
                </span>
                <span className="status-text">
                  {selectedNode.data.status || 'Not executed'}
                </span>
              </div>
            </div>

            {selectedNode.data.error && (
              <div className="execution-error">
                <h4>Error Details</h4>
                <div className="error-message">
                  {selectedNode.data.error}
                </div>
              </div>
            )}

            {selectedNode.data.lastExecution && (
              <div className="execution-history">
                <h4>Last Execution</h4>
                <p>Time: {selectedNode.data.lastExecution}</p>
                {selectedNode.data.executionTime && (
                  <p>Duration: {selectedNode.data.executionTime}ms</p>
                )}
              </div>
            )}

            <div className="execution-controls">
              <button className="test-node-btn">Test This Node</button>
              <button className="reset-status-btn">Reset Status</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
