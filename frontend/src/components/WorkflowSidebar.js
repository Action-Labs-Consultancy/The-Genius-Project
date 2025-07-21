import React from 'react';

const nodeTypes = [
  { type: 'httpRequest', label: 'HTTP Request', icon: '🌐' },
  { type: 'logMessage', label: 'Log Message', icon: '📝' },
  { type: 'ifCondition', label: 'If Condition', icon: '🔀' },
  { type: 'delay', label: 'Delay', icon: '⏰' },
];

export default function WorkflowSidebar({ onAddNode }) {
  return (
    <div className="workflow-sidebar">
      <h3>Node Types</h3>
      {nodeTypes.map(n => (
        <button
          key={n.type}
          className="node-type-btn"
          onClick={() => onAddNode(n.type)}
        >
          <span className="node-type-icon">{n.icon}</span>
          {n.label}
        </button>
      ))}
    </div>
  );
}
