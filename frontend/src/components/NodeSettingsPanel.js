import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const NodeSettingsPanel = ({ node, onUpdateNode, onClose, embedded = false }) => {
  const [config, setConfig] = useState(node.data.config || {});
  const [label, setLabel] = useState(node.data.label || '');

  useEffect(() => {
    setConfig(node.data.config || {});
    setLabel(node.data.label || '');
  }, [node]);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdateNode(node.id, { 
      label, 
      config,
      ...node.data
    });
  };

  const renderConfigFields = () => {
    switch (node.data.nodeType) {
      case 'httpRequest':
        return (
          <>
            <div className="field-group">
              <label>URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            
            <div className="field-group">
              <label>Method</label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            
            <div className="field-group">
              <label>Headers (JSON)</label>
              <textarea
                value={JSON.stringify(config.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    handleConfigChange('headers', JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, keep as string for now
                  }
                }}
                placeholder='{"Content-Type": "application/json"}'
                rows={4}
              />
            </div>
            
            {['POST', 'PUT', 'PATCH'].includes(config.method) && (
              <div className="field-group">
                <label>Body (JSON)</label>
                <textarea
                  value={JSON.stringify(config.body || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      handleConfigChange('body', JSON.parse(e.target.value));
                    } catch (err) {
                      // Invalid JSON, keep as string for now
                    }
                  }}
                  placeholder='{"key": "value"}'
                  rows={6}
                />
              </div>
            )}
          </>
        );
        
      case 'setVariable':
        return (
          <>
            <div className="field-group">
              <label>Variable Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="variableName"
              />
            </div>
            
            <div className="field-group">
              <label>Value</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                placeholder="Enter value or {{variable}}"
              />
            </div>
            
            <div className="help-text">
              Use {'{{variableName}}'} to reference other variables
            </div>
          </>
        );
        
      case 'ifCondition':
        return (
          <>
            <div className="field-group">
              <label>Left Operand</label>
              <input
                type="text"
                value={config.leftOperand || ''}
                onChange={(e) => handleConfigChange('leftOperand', e.target.value)}
                placeholder="value or {{variable}}"
              />
            </div>
            
            <div className="field-group">
              <label>Operator</label>
              <select
                value={config.operator || '=='}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
              >
                <option value="==">equals (==)</option>
                <option value="!=">not equals (!=)</option>
                <option value=">">{`greater than (>)`}</option>
                <option value="<">{`less than (<)`}</option>
                <option value=">=">{`greater or equal (>=)`}</option>
                <option value="<=">{`less or equal (<=)`}</option>
                <option value="contains">contains</option>
              </select>
            </div>
            
            <div className="field-group">
              <label>Right Operand</label>
              <input
                type="text"
                value={config.rightOperand || ''}
                onChange={(e) => handleConfigChange('rightOperand', e.target.value)}
                placeholder="value or {{variable}}"
              />
            </div>
            
            <div className="help-text">
              Use {'{{variableName}}'} to reference variables. Connect the bottom handles to different paths.
            </div>
          </>
        );
        
      case 'delay':
        return (
          <div className="field-group">
            <label>Delay (seconds)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={config.seconds || 1}
              onChange={(e) => handleConfigChange('seconds', parseFloat(e.target.value))}
            />
          </div>
        );
        
      case 'log':
        return (
          <div className="field-group">
            <label>Log Message</label>
            <textarea
              value={config.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
              placeholder="Enter log message. Use {{variable}} for dynamic content."
              rows={3}
            />
            <div className="help-text">
              Use {'{{variableName}}'} to include variable values
            </div>
          </div>
        );
        
      case 'customScript':
        return (
          <>
            <div className="field-group">
              <label>Language</label>
              <select
                value={config.language || 'javascript'}
                onChange={(e) => handleConfigChange('language', e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
            </div>
            
            <div className="field-group">
              <label>Code</label>
              <textarea
                value={config.code || ''}
                onChange={(e) => handleConfigChange('code', e.target.value)}
                placeholder="// Enter your code here"
                rows={8}
                style={{ fontFamily: 'Monaco, Consolas, monospace' }}
              />
            </div>
            
            <div className="help-text">
              Access context variables and return results. Execution is simulated in demo mode.
            </div>
          </>
        );
        
      case 'loop':
        return (
          <>
            <div className="field-group">
              <label>Items to Loop</label>
              <textarea
                value={Array.isArray(config.items) ? config.items.join('\n') : config.items || ''}
                onChange={(e) => {
                  const items = e.target.value.split('\n').filter(item => item.trim());
                  handleConfigChange('items', items);
                }}
                placeholder="Enter items (one per line) or use {{arrayVariable}}"
                rows={5}
              />
            </div>
            
            <div className="help-text">
              Enter items one per line, or use {'{{arrayVariable}}'} to reference an array variable
            </div>
          </>
        );
        
      case 'webhook':
        return (
          <div className="field-group">
            <label>Webhook URL Pattern</label>
            <input
              type="text"
              value={config.pattern || ''}
              onChange={(e) => handleConfigChange('pattern', e.target.value)}
              placeholder="/webhook/trigger"
            />
            <div className="help-text">
              In demo mode, webhook completion is simulated
            </div>
          </div>
        );
        
      case 'brain':
        return (
          <>
            <div className="field-group">
              <label>Brain Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="AI Brain Name"
              />
            </div>
            
            <div className="field-group">
              <label>AI Model</label>
              <select
                value={config.model || 'gpt-3.5-turbo'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            
            <div className="field-group">
              <label>Temperature</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              />
              <div className="help-text">Controls creativity (0 = focused, 1 = creative)</div>
            </div>
            
            <div className="field-group">
              <label>Memory Namespace</label>
              <input
                type="text"
                value={config.memoryNamespace || ''}
                onChange={(e) => handleConfigChange('memoryNamespace', e.target.value)}
                placeholder="default"
              />
              <div className="help-text">Pinecone namespace for storing memories</div>
            </div>
            
            <div className="field-group">
              <label>System Prompt</label>
              <textarea
                value={config.systemPrompt || ''}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful AI assistant."
                rows={4}
              />
            </div>
          </>
        );
        
      case 'agent':
        return (
          <>
            <div className="field-group">
              <label>Agent Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="AI Agent Name"
              />
            </div>
            
            <div className="field-group">
              <label>Agent Role</label>
              <input
                type="text"
                value={config.role || ''}
                onChange={(e) => handleConfigChange('role', e.target.value)}
                placeholder="assistant, analyst, researcher, etc."
              />
            </div>
            
            <div className="field-group">
              <label>AI Model</label>
              <select
                value={config.model || 'gpt-3.5-turbo'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            
            <div className="field-group">
              <label>Temperature</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="field-group">
              <label>Memory Namespace</label>
              <input
                type="text"
                value={config.memoryNamespace || ''}
                onChange={(e) => handleConfigChange('memoryNamespace', e.target.value)}
                placeholder="agent_default"
              />
              <div className="help-text">Pinecone namespace for agent memory</div>
            </div>
            
            <div className="field-group">
              <label>Available Tools (JSON Array)</label>
              <textarea
                value={JSON.stringify(config.tools || [], null, 2)}
                onChange={(e) => {
                  try {
                    handleConfigChange('tools', JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, keep as string for now
                  }
                }}
                placeholder='["web_search", "calculator", "file_handler"]'
                rows={3}
              />
            </div>
          </>
        );
        
      case 'webhook':
        return (
          <div className="field-group">
            <label>Webhook URL Pattern</label>
            <input
              type="text"
              value={config.pattern || ''}
              onChange={(e) => handleConfigChange('pattern', e.target.value)}
              placeholder="/webhook/trigger"
            />
            <div className="help-text">
              In demo mode, webhook completion is simulated
            </div>
          </div>
        );
        
      default:
        return (
          <div className="help-text">
            No configuration options for this node type.
          </div>
        );
    }
  };

  return (
    <div className={`node-settings-panel ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <div className="panel-header">
          <h3>Node Settings</h3>
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="panel-content">
        <div className="field-group">
          <label>Node Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter node label"
          />
        </div>
        
        <div className="field-group">
          <label>Node Type</label>
          <div className="node-type-display">
            <span className="node-type-badge" style={{ background: node.data.color }}>
              {node.data.nodeType}
            </span>
          </div>
        </div>
        
        <div className="field-group">
          <label>Node ID</label>
          <div className="node-id-display">
            {node.id}
          </div>
        </div>

        {/* Execution Status */}
        {node.data.executionStatus && node.data.executionStatus !== 'idle' && (
          <div className="field-group">
            <label>Execution Status</label>
            <div className={`execution-status ${node.data.executionStatus}`}>
              {node.data.executionStatus === 'running' && '🔄 Running'}
              {node.data.executionStatus === 'success' && '✅ Success'}
              {node.data.executionStatus === 'error' && '❌ Error'}
              {node.data.executionStatus === 'pending' && '⏳ Pending'}
            </div>
            {node.data.executionError && (
              <div className="error-message">
                {node.data.executionError}
              </div>
            )}
          </div>
        )}
        
        <hr />
        
        <h4>Configuration</h4>
        {renderConfigFields()}
      </div>
      
      <div className="panel-footer">
        <button onClick={handleSave} className="save-btn">
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default NodeSettingsPanel;
