import React, { useState } from 'react';
import { Handle } from 'reactflow';

const GroupNode = ({ data, id }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const groupedNodes = data.groupedNodes || [];
  const nodeCount = groupedNodes.length;

  return (
    <div className="group-node">
      <div className="group-node-header" onClick={toggleExpanded}>
        <span className="group-node-title">{data.label || 'Group'}</span>
        <span className="group-node-count">({nodeCount} nodes)</span>
        <span className="group-node-toggle">
          {isExpanded ? '▼' : '▶'}
        </span>
        {nodeCount > 0 && data.onUngroup && (
          <button className="ungroup-btn" onClick={e => { e.stopPropagation(); data.onUngroup(id); }} style={{marginLeft: 12, background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer'}}>Ungroup</button>
        )}
      </div>
      
      {isExpanded && (
        <div className="group-node-content">
          {groupedNodes.map(node => (
            <div key={node.id} className="grouped-node-item">
              <div className="grouped-node-type">{node.type}</div>
              <div className="grouped-node-label">
                {node.data?.label || node.id}
              </div>
            </div>
          ))}
          
          {nodeCount === 0 && (
            <div className="empty-group">No nodes in group</div>
          )}
        </div>
      )}

      {/* Handles for connections */}
      <Handle
        type="target"
        position="left"
        style={{
          background: '#555',
          width: '12px',
          height: '12px',
          border: '2px solid #fff'
        }}
      />
      <Handle
        type="source"
        position="right"
        style={{
          background: '#555',
          width: '12px',
          height: '12px',
          border: '2px solid #fff'
        }}
      />
    </div>
  );
};

export default GroupNode;
