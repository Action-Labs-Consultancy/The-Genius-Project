import React from 'react';
import { X, Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const ExecutionPanel = ({ isExecuting, executionResult, onClose }) => {
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
    <div className="execution-panel">
      <div className="panel-header">
        <h3>
          <Play size={16} />
          Workflow Execution
        </h3>
        <button onClick={onClose} className="close-btn">
          <X size={16} />
        </button>
      </div>

      <div className="panel-content">
        {isExecuting && (
          <div className="execution-status executing">
            <div className="status-indicator pulsing"></div>
            <span>Executing workflow...</span>
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

            {executionResult.execution_log && (
              <div className="execution-log">
                <h4>Execution Log</h4>
                <div className="log-entries">
                  {executionResult.execution_log.map((entry, index) => (
                    <div key={index} className={`log-entry ${entry.status}`}>
                      <div className="log-header">
                        <div className="log-title">
                          {getStatusIcon(entry.status)}
                          <span className="node-type">{entry.node_type}</span>
                          <span className="node-id">{entry.node_id}</span>
                        </div>
                        <div className="log-timestamp">
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>

                      {entry.output && (
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

            {executionResult.final_context && (
              <div className="final-context">
                <h4>Final Context</h4>
                <pre>{JSON.stringify(executionResult.final_context, null, 2)}</pre>
              </div>
            )}
          </>
        )}

        {!isExecuting && !executionResult && (
          <div className="no-execution">
            <AlertCircle size={48} />
            <p>No execution data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionPanel;
