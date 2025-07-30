import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, selected, id }) => {
  const IconComponent = data.icon;
  
  const handleGroupToggle = (e) => {
    e.stopPropagation();
    // Dispatch custom event for group toggle
    window.dispatchEvent(new CustomEvent('toggleGroupCollapse', { 
      detail: { groupId: id } 
    }));
  };
  
  return (
    <div 
      className={`custom-node ${selected ? 'selected' : ''} ${data.isGroup ? 'group-node' : ''}`}
      style={{
        borderColor: data.color,
        boxShadow: selected ? `0 0 20px ${data.color}40` : `0 2px 8px ${data.color}20`,
        ...(data.isGroup && {
          width: data.groupData?.size?.width || 200,
          height: data.groupData?.size?.height || 100,
          minWidth: 200,
          minHeight: 80
        })
      }}
    >
      {/* Group specific content */}
      {data.isGroup ? (
        <div className="group-content">
          <div className="group-header">
            <button 
              className="group-toggle"
              onClick={handleGroupToggle}
              title={data.groupData?.collapsed ? 'Expand group' : 'Collapse group'}
            >
              {data.groupData?.collapsed ? '📁' : '📂'}
            </button>
            <span className="group-title">{data.groupData?.name || 'Group'}</span>
          </div>
          <div className="group-stats">
            {data.groupData?.nodes?.length || 0} nodes
            {data.groupData?.collapsed && ' (Hidden)'}
          </div>
          {!data.groupData?.collapsed && (
            <div className="group-description">
              Click folder icon to collapse
            </div>
          )}
        </div>
      ) : (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className="custom-handle input-handle"
            style={{ 
              background: data.color,
              borderColor: data.color 
            }}
          />
          
          <div className="node-content">
            <div className="node-header">
              <div 
                className="node-icon"
                style={{ background: data.color }}
              >
                <IconComponent size={16} color="#fff" />
              </div>
              <div className="node-title">{data.label}</div>
            </div>
            
            {data.config && Object.keys(data.config).length > 0 && (
              <div className="node-preview">
                {data.nodeType === 'httpRequest' && data.config.url && (
                  <div className="config-preview">
                    <span className="method-badge" style={{ background: data.color }}>
                      {data.config.method || 'GET'}
                    </span>
                    <span className="url-preview">{data.config.url}</span>
                  </div>
                )}
                
                {data.nodeType === 'setVariable' && data.config.name && (
                  <div className="config-preview">
                    <span className="var-name">{data.config.name}</span>
                    <span className="var-value">{data.config.value}</span>
                  </div>
                )}
                
                {data.nodeType === 'ifCondition' && data.config.leftOperand && (
                  <div className="config-preview">
                    <span className="condition">
                      {data.config.leftOperand} {data.config.operator} {data.config.rightOperand}
                    </span>
                  </div>
                )}
                
                {data.nodeType === 'delay' && data.config.seconds && (
                  <div className="config-preview">
                    <span className="delay-time">{data.config.seconds}s</span>
                  </div>
                )}
                
                {data.nodeType === 'log' && data.config.message && (
                  <div className="config-preview">
                    <span className="log-message">{data.config.message}</span>
                  </div>
                )}
                
                {data.nodeType === 'brain' && data.config.name && (
                  <div className="config-preview">
                    <span className="brain-name">{data.config.name}</span>
                    <span className="brain-model">{data.config.model}</span>
                  </div>
                )}
                
                {data.nodeType === 'agent' && data.config.name && (
                  <div className="config-preview">
                    <span className="agent-name">{data.config.name}</span>
                    <span className="agent-role">{data.config.role}</span>
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
            
            {/* Node status indicator */}
            {data.executionStatus === 'running' && (
              <div className="node-status-indicator running" title="Running" style={{position: 'absolute', top: 4, right: 4, fontSize: 18}}>
                🔄
              </div>
            )}
            {data.executionStatus === 'success' && (
              <div className="node-status-indicator success" title="Success" style={{position: 'absolute', top: 4, right: 4, fontSize: 18}}>
                ✅
              </div>
            )}
            {data.executionStatus === 'error' && (
              <div className="node-status-indicator error" title={data.executionError || "Error"} style={{position: 'absolute', top: 4, right: 4, fontSize: 18}}>
                ❌
              </div>
            )}
            {data.executionStatus === 'pending' && (
              <div className="node-status-indicator pending" title="Pending" style={{position: 'absolute', top: 4, right: 4, fontSize: 18}}>
                ⏳
              </div>
            )}
          </div>
          
          <Handle
            type="source"
            position={Position.Right}
            className="custom-handle output-handle"
            style={{ 
              background: data.color,
              borderColor: data.color 
            }}
          />
          
          {/* Additional handles for conditional nodes */}
          {data.nodeType === 'ifCondition' && (
            <>
              <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                className="custom-handle condition-handle true-handle"
                style={{ 
                  background: '#10b981',
                  borderColor: '#10b981',
                  bottom: -8,
                  right: '25%'
                }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="custom-handle condition-handle false-handle"
                style={{ 
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  bottom: -8,
                  left: '25%'
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default memo(CustomNode);
