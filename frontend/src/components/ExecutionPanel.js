import React from 'react';
import { X, Play, CheckCircle, XCircle, Clock, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';

const ExecutionPanel = ({ 
  isExecuting, 
  executionResult, 
  executionLogs, 
  onClose, 
  isBottomPanel = false,
  showExecutionPanel = true,
  onToggle 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'error':
        return <XCircle size={16} className="status-icon error" />;
      case 'running':
        return <Clock size={16} className="status-icon running" />;
      default:
        return <AlertCircle size={16} className="status-icon pending" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatOutput = (output) => {
    if (typeof output === 'object') {
      return JSON.stringify(output, null, 2);
    }
    return String(output || '');
  };

  return (
    <div className={`execution-panel ${isBottomPanel ? 'bottom-panel' : ''} ${!showExecutionPanel ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <h3>
          <Play size={16} />
          Execution Logs {isBottomPanel ? '- Live Updates' : ''}
          {isExecuting && <span className="executing-indicator">⚡ Running</span>}
        </h3>
        <div className="panel-controls">
          {isBottomPanel && onToggle && (
            <button onClick={onToggle} className="toggle-btn" title="Toggle panel">
              {showExecutionPanel ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="close-btn">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {showExecutionPanel && (
        <div className="panel-content">
          {isExecuting && (
            <div className="execution-status executing">
              <div className="status-indicator pulsing"></div>
              <span>Executing workflow...</span>
            </div>
          )}

          {executionLogs && executionLogs.length > 0 && (
            <div className="execution-log">
              <div className="log-entries">
                {executionLogs.map((entry, index) => (
                  <div key={index} className={`log-entry ${entry.status || entry.level}`}>
                    <div className="log-header">
                      <div className="log-title">
                        {getStatusIcon(entry.status || entry.level)}
                        <span className="node-type">{entry.node_type || entry.level}</span>
                        <span className="node-id">{entry.node_id || 'System'}</span>
                      </div>
                      <div className="log-timestamp">
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>

                    <div className="log-message">
                      <span>{entry.message || entry.output}</span>
                    </div>

                    {entry.output && typeof entry.output === 'object' && (
                      <div className="log-output">
                        <strong>Output:</strong>
                        <pre>{formatOutput(entry.output)}</pre>
                      </div>
                    )}

                    {entry.error && (
                      <div className="log-error">
                        <strong>Error:</strong>
                        <span>{entry.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {executionResult && (
            <>
              <div className={`execution-summary ${executionResult.status}`}>
                {getStatusIcon(executionResult.status)}
                <div>
                  <strong>Status: {executionResult.status}</strong>
                  {executionResult.iterations && (
                    <div className="execution-meta">
                      Processed {executionResult.iterations} nodes
                    </div>
                  )}
                </div>
              </div>

              {executionResult.error && (
                <div className="error-message">
                  <XCircle size={16} />
                  <span>{executionResult.error}</span>
                </div>
              )}
            </>
          )}

          {!isExecuting && !executionResult && (!executionLogs || executionLogs.length === 0) && (
            <div className="no-execution">
              <AlertCircle size={32} />
              <p>No execution logs yet. Run a workflow to see logs here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutionPanel;
