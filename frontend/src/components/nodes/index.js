import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// HTTP Request Node
export const HttpRequestNode = memo(({ data, isConnectable }) => {
  return (
    <div className="custom-node http-request-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="node-header">
        <div className="node-icon">🌐</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-method">{data.method || 'GET'}</div>
        <div className="node-url">{data.url || 'No URL set'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

// Log Message Node
export const LogMessageNode = memo(({ data, isConnectable }) => {
  return (
    <div className="custom-node log-message-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="node-header">
        <div className="node-icon">📝</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-level">{data.level || 'info'}</div>
        <div className="node-message">
          {data.message ? 
            (data.message.length > 30 ? 
              `${data.message.substring(0, 30)}...` : 
              data.message
            ) : 
            'No message set'
          }
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

// If Condition Node
export const IfConditionNode = memo(({ data, isConnectable }) => {
  return (
    <div className="custom-node if-condition-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="node-header">
        <div className="node-icon">🔀</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-condition">
          {data.condition ? 
            (data.condition.length > 25 ? 
              `${data.condition.substring(0, 25)}...` : 
              data.condition
            ) : 
            'No condition set'
          }
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        style={{ background: '#10b981' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ background: '#ef4444' }}
        isConnectable={isConnectable}
      />
      <div className="condition-labels">
        <span className="true-label">TRUE</span>
        <span className="false-label">FALSE</span>
      </div>
    </div>
  );
});

// Delay Node
export const DelayNode = memo(({ data, isConnectable }) => {
  const getDurationText = () => {
    const duration = data.duration || 1000;
    const unit = data.unit || 'ms';
    
    if (unit === 'ms') return `${duration}ms`;
    if (unit === 's') return `${duration}s`;
    if (unit === 'm') return `${duration}m`;
    return `${duration}${unit}`;
  };

  return (
    <div className="custom-node delay-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="node-header">
        <div className="node-icon">⏰</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-duration">{getDurationText()}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

// Export all nodes
const CustomNodes = {
  HttpRequestNode,
  LogMessageNode,
  IfConditionNode,
  DelayNode,
};

export default CustomNodes;
