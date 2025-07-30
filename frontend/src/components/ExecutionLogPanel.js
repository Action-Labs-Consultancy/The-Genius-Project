import React, { useState, useEffect } from 'react';
import './ExecutionLogPanel.css';

const ExecutionLogPanel = ({ 
  executionLog = [], 
  isCollapsed = false, 
  onToggleCollapse,
  onClearLog 
}) => {
  const logContainerRef = React.useRef(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⏳';
      case 'pending': return '⌛';
      default: return '⚪';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'running': return '#ffc107';
      case 'pending': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const duration = new Date(endTime) - new Date(startTime);
    return `${duration}ms`;
  };

  return (
    <div className={`execution-log-panel ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="log-header">
        <div className="log-header-left">
          <button 
            className="collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Log' : 'Collapse Log'}
          >
            {isCollapsed ? '⬆️' : '⬇️'}
          </button>
          <h3>Execution Log</h3>
          <span className="log-count">({executionLog.length} entries)</span>
        </div>
        
        <div className="log-header-right">          
          <button 
            className="clear-log-btn"
            onClick={onClearLog}
            title="Clear Log"
            disabled={executionLog.length === 0}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div 
          className="log-content" 
          ref={logContainerRef}
        >
          {executionLog.length === 0 ? (
            <div className="empty-log">
              <p>No execution logs yet. Run a workflow to see logs here.</p>
            </div>
          ) : (
            <div className="log-entries">
              {executionLog.map((entry, index) => (
                <div 
                  key={entry.id || index} 
                  className={`log-entry ${entry.status}`}
                >
                  <div className="log-entry-header">
                    <span 
                      className="status-icon"
                      style={{ color: getStatusColor(entry.status) }}
                    >
                      {getStatusIcon(entry.status)}
                    </span>
                    
                    <span className="node-info">
                      <strong>{entry.nodeLabel || entry.nodeId}</strong>
                      <span className="node-type">({entry.nodeType})</span>
                    </span>
                    
                    <span className="timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    
                    {entry.duration && (
                      <span className="duration">
                        {formatDuration(entry.startTime, entry.endTime)}
                      </span>
                    )}
                  </div>
                  
                  {entry.message && (
                    <div className="log-message">
                      {entry.message}
                    </div>
                  )}
                  
                  {entry.output && (
                    <div className="log-output">
                      <strong>Output:</strong>
                      <pre>{typeof entry.output === 'string' ? entry.output : JSON.stringify(entry.output, null, 2)}</pre>
                    </div>
                  )}
                  
                  {entry.error && (
                    <div className="log-error">
                      <strong>Error:</strong> {entry.error}
                    </div>
                  )}
                  
                  {entry.executionOrder && (
                    <div className="execution-order">
                      Step {entry.executionOrder}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutionLogPanel;
