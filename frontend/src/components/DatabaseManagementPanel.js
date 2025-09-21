import React, { useState, useEffect } from 'react';

// Database Management Panel for n8n Interface
const DatabaseManagementPanel = ({ isOpen, onClose }) => {
  const [rollbackStatus, setRollbackStatus] = useState('checking');
  const [backups, setBackups] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [selectedBackup, setSelectedBackup] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [recoveryType, setRecoveryType] = useState('latest');

  // Check system status
  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/database/status');
      const status = await response.json();
      setSystemStatus(status);
      setRollbackStatus(status.rollbackReady ? 'ready' : 'not-ready');
    } catch (error) {
      console.error('Failed to check system status:', error);
      setRollbackStatus('error');
    }
  };

  // Load available backups
  const loadBackups = async () => {
    try {
      const response = await fetch('/api/database/backups');
      const backupList = await response.json();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  // Execute emergency rollback
  const executeEmergencyRollback = async () => {
    const confirmed = window.confirm(
      '⚠️ EMERGENCY ROLLBACK WARNING ⚠️\n\n' +
      'This will stop n8n and rollback the database.\n' +
      'All workflows will be temporarily unavailable.\n\n' +
      'Continue with emergency rollback?'
    );
    
    if (!confirmed) return;

    setRollbackStatus('executing');
    
    try {
      const response = await fetch('/api/database/emergency-rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: recoveryType,
          targetTime: recoveryType === 'specific-time' ? targetTime : undefined,
          selectedBackup: recoveryType === 'backup' ? selectedBackup : undefined
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setRollbackStatus('completed');
        alert('✅ Emergency rollback completed successfully!\n\nDatabase has been restored.');
      } else {
        setRollbackStatus('failed');
        alert('❌ Emergency rollback failed!\n\nCheck system logs for details.');
      }
    } catch (error) {
      setRollbackStatus('failed');
      alert(`❌ Rollback error: ${error.message}`);
    }
  };

  // Take immediate backup
  const takeBackup = async () => {
    try {
      const response = await fetch('/api/database/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual', reason: 'n8n-interface-backup' })
      });
      
      if (response.ok) {
        alert('✅ Backup completed successfully!');
        loadBackups(); // Refresh backup list
      } else {
        alert('❌ Backup failed!');
      }
    } catch (error) {
      alert(`❌ Backup error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkSystemStatus();
      loadBackups();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="database-management-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="database-management-panel" style={{
        background: '#1a1a1a',
        border: '2px solid #fbbf24',
        borderRadius: '12px',
        padding: '24px',
        width: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        color: 'white'
      }}>
        <div className="panel-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #374151',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, color: '#fbbf24' }}>🛡️ Database Management</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* System Status */}
        <div className="status-section" style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#fbbf24', marginBottom: '12px' }}>System Status</h3>
          <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="status-item" style={{ 
              background: '#111827', 
              padding: '12px', 
              borderRadius: '6px',
              border: `1px solid ${systemStatus.postgresql ? '#10b981' : '#dc2626'}`
            }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>PostgreSQL</div>
              <div style={{ color: systemStatus.postgresql ? '#10b981' : '#dc2626' }}>
                {systemStatus.postgresql ? '✅ Running' : '❌ Offline'}
              </div>
            </div>
            
            <div className="status-item" style={{ 
              background: '#111827', 
              padding: '12px', 
              borderRadius: '6px',
              border: `1px solid ${systemStatus.walArchiving ? '#10b981' : '#dc2626'}`
            }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>WAL Archiving</div>
              <div style={{ color: systemStatus.walArchiving ? '#10b981' : '#dc2626' }}>
                {systemStatus.walArchiving ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Rollback */}
        <div className="emergency-section" style={{ 
          marginBottom: '24px',
          background: '#7f1d1d',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #dc2626'
        }}>
          <h3 style={{ color: '#fca5a5', marginBottom: '12px' }}>🚨 Emergency Rollback</h3>
          
          <div className="recovery-options" style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: '#e5e7eb' }}>
                <input 
                  type="radio" 
                  value="latest" 
                  checked={recoveryType === 'latest'}
                  onChange={(e) => setRecoveryType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Latest available point
              </label>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: '#e5e7eb' }}>
                <input 
                  type="radio" 
                  value="specific-time" 
                  checked={recoveryType === 'specific-time'}
                  onChange={(e) => setRecoveryType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Specific date/time
              </label>
              {recoveryType === 'specific-time' && (
                <input
                  type="datetime-local"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    color: 'white',
                    width: '100%'
                  }}
                />
              )}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: '#e5e7eb' }}>
                <input 
                  type="radio" 
                  value="backup" 
                  checked={recoveryType === 'backup'}
                  onChange={(e) => setRecoveryType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Specific backup
              </label>
              {recoveryType === 'backup' && (
                <select
                  value={selectedBackup}
                  onChange={(e) => setSelectedBackup(e.target.value)}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    color: 'white',
                    width: '100%'
                  }}
                >
                  <option value="">Select backup...</option>
                  {backups.map(backup => (
                    <option key={backup.id} value={backup.id}>
                      {backup.name} - {new Date(backup.created).toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <button
            onClick={executeEmergencyRollback}
            disabled={rollbackStatus === 'executing'}
            style={{
              background: rollbackStatus === 'executing' ? '#9ca3af' : '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: rollbackStatus === 'executing' ? 'not-allowed' : 'pointer',
              width: '100%',
              fontWeight: 'bold'
            }}
          >
            {rollbackStatus === 'executing' ? '🔄 Rolling back...' : '🚨 EXECUTE EMERGENCY ROLLBACK'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions" style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#fbbf24', marginBottom: '12px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={takeBackup}
              style={{
                background: '#065f46',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              💾 Take Backup Now
            </button>
            
            <button
              onClick={checkSystemStatus}
              style={{
                background: '#1e40af',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔍 Check Status
            </button>
          </div>
        </div>

        {/* Recent Backups */}
        <div className="backups-section">
          <h3 style={{ color: '#fbbf24', marginBottom: '12px' }}>Recent Backups</h3>
          <div className="backups-list" style={{ maxHeight: '200px', overflow: 'auto' }}>
            {backups.slice(0, 5).map(backup => (
              <div 
                key={backup.id} 
                className="backup-item" 
                style={{
                  background: '#111827',
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: '1px solid #374151'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#e5e7eb' }}>{backup.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {new Date(backup.created).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Size: {backup.size} | Type: {backup.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagementPanel;
