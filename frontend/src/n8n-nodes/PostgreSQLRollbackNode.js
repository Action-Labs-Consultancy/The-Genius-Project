import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

// PostgreSQL Rollback Node for n8n Interface
const PostgreSQLRollbackNode = ({ data, selected }) => {
  const [rollbackStatus, setRollbackStatus] = useState('ready');
  const [targetTime, setTargetTime] = useState('');
  const [lastBackup, setLastBackup] = useState('');

  // Execute rollback operation
  const executeRollback = async () => {
    setRollbackStatus('executing');
    
    try {
      const response = await fetch('/api/database/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: data.operation || 'point-in-time',
          targetTime: targetTime || 'latest',
          confirmSafety: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setRollbackStatus('completed');
        data.onStatusUpdate?.({ status: 'completed', result });
      } else {
        setRollbackStatus('failed');
        data.onStatusUpdate?.({ status: 'failed', error: 'Rollback failed' });
      }
    } catch (error) {
      setRollbackStatus('failed');
      data.onStatusUpdate?.({ status: 'failed', error: error.message });
    }
  };

  // Check rollback readiness
  const checkReadiness = async () => {
    try {
      const response = await fetch('/api/database/rollback/status');
      const status = await response.json();
      setLastBackup(status.lastBackup);
      return status.ready;
    } catch (error) {
      console.error('Failed to check rollback readiness:', error);
      return false;
    }
  };

  React.useEffect(() => {
    checkReadiness();
  }, []);

  const getStatusColor = () => {
    switch (rollbackStatus) {
      case 'ready': return '#10b981';
      case 'executing': return '#f59e0b';
      case 'completed': return '#059669';
      case 'failed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (rollbackStatus) {
      case 'ready': return '🛡️';
      case 'executing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div 
      className={`n8n-node postgresql-rollback-node ${selected ? 'selected' : ''}`}
      style={{
        background: '#1a1a1a',
        border: `2px solid ${getStatusColor()}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        color: 'white'
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="node-header" style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '16px', marginRight: '8px' }}>
          {getStatusIcon()}
        </span>
        <span style={{ fontWeight: 'bold' }}>PostgreSQL Rollback</span>
      </div>
      
      <div className="node-content" style={{ fontSize: '12px' }}>
        <div className="rollback-field" style={{ marginBottom: '6px' }}>
          <span style={{ color: '#9ca3af' }}>Operation:</span>
          <span style={{ marginLeft: '8px', color: '#fbbf24' }}>
            {data.operation || 'Point-in-Time Recovery'}
          </span>
        </div>
        
        <div className="rollback-field" style={{ marginBottom: '6px' }}>
          <span style={{ color: '#9ca3af' }}>Status:</span>
          <span style={{ marginLeft: '8px', color: getStatusColor() }}>
            {rollbackStatus.charAt(0).toUpperCase() + rollbackStatus.slice(1)}
          </span>
        </div>
        
        {data.operation === 'point-in-time' && (
          <div className="rollback-field" style={{ marginBottom: '6px' }}>
            <span style={{ color: '#9ca3af' }}>Target:</span>
            <span style={{ marginLeft: '8px', color: '#60a5fa' }}>
              {data.targetTime || 'Latest available'}
            </span>
          </div>
        )}
        
        {lastBackup && (
          <div className="rollback-field" style={{ fontSize: '10px', color: '#6b7280' }}>
            Last backup: {new Date(lastBackup).toLocaleString()}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default PostgreSQLRollbackNode;
