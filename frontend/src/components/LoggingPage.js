import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  User,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle,
  Info,
  Eye
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import './LoggingPage.css';

const LoggingPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);

  const LOG_TYPES = {
    'auth': { label: 'Authentication', color: '#059669', icon: User },
    'api': { label: 'API Call', color: '#2563EB', icon: Activity },
    'error': { label: 'Error', color: '#DC2626', icon: AlertCircle },
    'success': { label: 'Success', color: '#16A34A', icon: CheckCircle },
    'info': { label: 'Information', color: '#6366F1', icon: Info },
    'user_action': { label: 'User Action', color: '#9333EA', icon: User },
    'system': { label: 'System', color: '#64748B', icon: Activity }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error('Failed to fetch logs');
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || log.type === selectedType;
    const matchesUser = !selectedUser || log.user === selectedUser;
    
    let matchesDate = true;
    if (dateFilter) {
      const logDate = new Date(log.timestamp).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      matchesDate = logDate === filterDate;
    }
    
    return matchesSearch && matchesType && matchesUser && matchesDate;
  });

  const getLogTypeInfo = (type) => {
    return LOG_TYPES[type] || LOG_TYPES['info'];
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUniqueUsers = () => {
    const users = [...new Set(logs.map(log => log.user).filter(Boolean))];
    return users.sort();
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Type', 'Details'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.user || 'System',
        log.action || '',
        log.type || '',
        log.details || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="logging-page" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-header" style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <div className="header-content">
          <div className="header-title">
            <Activity className="header-icon" style={{ color: '#6366f1' }} />
            <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px', fontWeight: 600 }}>Activity Logs</h1>
            <span className="log-count" style={{ background: '#e0e7ff', color: '#6366f1', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 500 }}>{filteredLogs.length} of {logs.length} logs</span>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={loadLogs}
              disabled={loading}
              style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}
            >
              <RefreshCw className={loading ? 'spinning' : ''} size={18} />
              Refresh
            </button>
            <button 
              className="export-btn"
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            {Object.entries(LOG_TYPES).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">All Users</option>
            {getUniqueUsers().map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>

          <input
            type="date"
            className="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {(searchTerm || selectedType || selectedUser || dateFilter) && (
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('');
                setSelectedUser('');
                setDateFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="logs-container">
        {loading ? (
          <div className="loading-state">
            <Activity className="loading-icon spinning" />
            <p>Loading activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <Activity className="empty-icon" />
            <p>No logs found matching your filters.</p>
          </div>
        ) : (
          <div className="logs-list">
            {filteredLogs.map((log, index) => {
              const typeInfo = getLogTypeInfo(log.type);
              const TypeIcon = typeInfo.icon;
              const isExpanded = expandedLog === index;
              
              return (
                <div key={index} className="log-entry">
                  <div className="log-main" onClick={() => setExpandedLog(isExpanded ? null : index)}>
                    <div className="log-indicator" style={{ backgroundColor: typeInfo.color }}>
                      <TypeIcon size={16} />
                    </div>
                    
                    <div className="log-content">
                      <div className="log-header">
                        <span className="log-action">{log.action || 'System Action'}</span>
                        <div className="log-meta">
                          <span className="log-type" style={{ color: typeInfo.color }}>
                            {typeInfo.label}
                          </span>
                          <span className="log-separator">•</span>
                          <span className="log-user">
                            <User size={12} />
                            {log.user || 'System'}
                          </span>
                          <span className="log-separator">•</span>
                          <span className="log-time">
                            <Clock size={12} />
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      {log.details && (
                        <div className="log-details-preview">
                          {log.details.length > 100 ? 
                            `${log.details.substring(0, 100)}...` : 
                            log.details
                          }
                        </div>
                      )}
                    </div>

                    <div className="log-expand-btn">
                      <Eye size={16} className={isExpanded ? 'expanded' : ''} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="log-expanded">
                      {log.details && (
                        <div className="expanded-section">
                          <h4>Details</h4>
                          <pre className="log-details-full">{log.details}</pre>
                        </div>
                      )}
                      
                      {log.metadata && (
                        <div className="expanded-section">
                          <h4>Metadata</h4>
                          <pre className="log-metadata">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                      
                      <div className="expanded-section">
                        <h4>Raw Log Data</h4>
                        <pre className="log-raw">{JSON.stringify(log, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoggingPage;
