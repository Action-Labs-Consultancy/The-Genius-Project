import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Plus, Settings } from 'lucide-react';

const AIAgentNode = ({ data, selected, id }) => {
  const [showPortMenu, setShowPortMenu] = useState(null);

  const handlePortAdd = (portType) => {
    if (data.onPortAdd) {
      data.onPortAdd(id, portType);
    }
    setShowPortMenu(null);
  };

  const handleDoubleClick = () => {
    if (data.onEdit) {
      data.onEdit(id);
    }
  };

  const getPortMenu = (portType) => {
    const menuItems = {
      model: [
        { id: 'openai', label: 'OpenAI', type: 'openai' },
        { id: 'gemini', label: 'Gemini', type: 'gemini' },
        { id: 'grok', label: 'Grok', type: 'grok' },
        { id: 'llama', label: 'Llama (Local)', type: 'llama' }
      ],
      memory: [
        { id: 'simple', label: 'Simple Memory', type: 'simple-memory' },
        { id: 'postgresql', label: 'PostgreSQL Chat Memory', type: 'postgresql-memory' },
        { id: 'redis', label: 'Redis Chat Memory', type: 'redis-memory' }
      ],
      tools: [
        { id: 'http', label: 'HTTP Request', type: 'http-tool' },
        { id: 'airtable', label: 'Airtable', type: 'airtable-tool' },
        { id: 'lambda', label: 'AWS Lambda', type: 'lambda-tool' },
        { id: 'workflow', label: 'Call Workflow', type: 'workflow-tool' }
      ]
    };

    return menuItems[portType] || [];
  };

  return (
    <div 
      className={`ai-agent-node ${selected ? 'selected' : ''}`}
      onDoubleClick={handleDoubleClick}
      style={{
        borderColor: data.color || '#6366F1',
        boxShadow: selected ? `0 0 20px ${data.color || '#6366F1'}40` : `0 2px 8px ${data.color || '#6366F1'}20`
      }}
    >
      {/* Prompt Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="prompt"
        className="custom-handle prompt-handle"
        style={{ 
          background: '#10B981',
          borderColor: '#10B981',
          top: '20%'
        }}
      />
      <div className="handle-label left">Prompt</div>

      {/* Model Input Handle with + button */}
      <div className="handle-group top-left">
        <Handle
          type="target"
          position={Position.Top}
          id="model"
          className="custom-handle model-handle"
          style={{ 
            background: '#3B82F6',
            borderColor: '#3B82F6',
            left: '20%'
          }}
        />
        <button 
          className="port-add-btn"
          onClick={() => setShowPortMenu(showPortMenu === 'model' ? null : 'model')}
          style={{ left: '15%', top: '-8px' }}
        >
          <Plus size={10} />
        </button>
        <div className="handle-label top">Model</div>
        
        {showPortMenu === 'model' && (
          <div className="port-menu" style={{ left: '10%', top: '30px' }}>
            {getPortMenu('model').map(item => (
              <button 
                key={item.id}
                className="port-menu-item"
                onClick={() => handlePortAdd({ ...item, port: 'model' })}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Memory Input Handle with + button */}
      <div className="handle-group top-center">
        <Handle
          type="target"
          position={Position.Top}
          id="memory"
          className="custom-handle memory-handle"
          style={{ 
            background: '#8B5CF6',
            borderColor: '#8B5CF6',
            left: '50%'
          }}
        />
        <button 
          className="port-add-btn"
          onClick={() => setShowPortMenu(showPortMenu === 'memory' ? null : 'memory')}
          style={{ left: '45%', top: '-8px' }}
        >
          <Plus size={10} />
        </button>
        <div className="handle-label top">Memory</div>
        
        {showPortMenu === 'memory' && (
          <div className="port-menu" style={{ left: '40%', top: '30px' }}>
            {getPortMenu('memory').map(item => (
              <button 
                key={item.id}
                className="port-menu-item"
                onClick={() => handlePortAdd({ ...item, port: 'memory' })}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tools Input Handle with + button */}
      <div className="handle-group top-right">
        <Handle
          type="target"
          position={Position.Top}
          id="tools"
          className="custom-handle tools-handle"
          style={{ 
            background: '#F59E0B',
            borderColor: '#F59E0B',
            left: '80%'
          }}
        />
        <button 
          className="port-add-btn"
          onClick={() => setShowPortMenu(showPortMenu === 'tools' ? null : 'tools')}
          style={{ left: '75%', top: '-8px' }}
        >
          <Plus size={10} />
        </button>
        <div className="handle-label top">Tools</div>
        
        {showPortMenu === 'tools' && (
          <div className="port-menu" style={{ left: '70%', top: '30px' }}>
            {getPortMenu('tools').map(item => (
              <button 
                key={item.id}
                className="port-menu-item"
                onClick={() => handlePortAdd({ ...item, port: 'tools' })}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Node Content */}
      <div className="node-content">
        <div className="node-header">
          <div 
            className="node-icon"
            style={{ background: data.color || '#6366F1' }}
          >
            <Brain size={20} color="#fff" />
          </div>
          <div className="node-title">AI Agent</div>
          <button 
            className="node-settings-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDoubleClick();
            }}
          >
            <Settings size={14} />
          </button>
        </div>
        
        {data.config && (
          <div className="node-preview">
            {data.config.name && (
              <div className="config-item">
                <strong>Name:</strong> {data.config.name}
              </div>
            )}
            {data.config.temperature && (
              <div className="config-item">
                <strong>Temperature:</strong> {data.config.temperature}
              </div>
            )}
            {data.config.maxTokens && (
              <div className="config-item">
                <strong>Max Tokens:</strong> {data.config.maxTokens}
              </div>
            )}
          </div>
        )}

        {/* Connected Components Display */}
        {data.connections && (
          <div className="connections-display">
            {data.connections.model && (
              <div className="connection-badge model">
                Model: {data.connections.model.type}
              </div>
            )}
            {data.connections.memory && (
              <div className="connection-badge memory">
                Memory: {data.connections.memory.type}
              </div>
            )}
            {data.connections.tools && data.connections.tools.length > 0 && (
              <div className="connection-badge tools">
                Tools: {data.connections.tools.length}
              </div>
            )}
          </div>
        )}
        
        {data.status && (
          <div className={`node-status ${data.status}`}>
            <div className="status-indicator"></div>
            <span>{data.status}</span>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="custom-handle output-handle"
        style={{ 
          background: data.color || '#6366F1',
          borderColor: data.color || '#6366F1'
        }}
      />
      <div className="handle-label right">Response</div>
    </div>
  );
};

export default memo(AIAgentNode);
