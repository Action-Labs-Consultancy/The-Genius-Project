import React, { useState, useEffect } from 'react';
import './styles.css';

const LogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        limit: 50,
        offset: 0,
        level: '',
        action_type: '',
        user_id: '',
        brain_id: '',
        workflow_id: ''
    });
    const [stats, setStats] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch logs from backend
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    queryParams.append(key, value);
                }
            });

            const response = await fetch(`/api/logs?${queryParams}`);
            const data = await response.json();
            
            if (response.ok) {
                setLogs(data.logs);
                setTotalCount(data.total_count);
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch logs');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    // Fetch log statistics
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/logs/stats');
            const data = await response.json();
            
            if (response.ok) {
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch log stats:', err);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            offset: 0 // Reset to first page when filtering
        }));
    };

    const handlePageChange = (direction) => {
        const newOffset = direction === 'next' 
            ? filters.offset + filters.limit
            : Math.max(0, filters.offset - filters.limit);
        
        setFilters(prev => ({
            ...prev,
            offset: newOffset
        }));
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'error': return '#ff4444';
            case 'warning': return '#ffaa00';
            case 'info': return '#00aaff';
            case 'debug': return '#888888';
            case 'critical': return '#ff0000';
            default: return '#ffffff';
        }
    };

    const getActionTypeColor = (actionType) => {
        if (actionType.includes('brain')) return '#ffeb3b';
        if (actionType.includes('workflow')) return '#2196f3';
        if (actionType.includes('node')) return '#4caf50';
        if (actionType.includes('error')) return '#f44336';
        return '#ffffff';
    };

    if (loading && logs.length === 0) {
        return (
            <div className="logs-page">
                <div className="page-header">
                    <h1>System Logs</h1>
                </div>
                <div className="loading-spinner">Loading logs...</div>
            </div>
        );
    }

    return (
        <div className="logs-page">
            <div className="page-header">
                <h1>System Logs</h1>
                <p>Real-time system activity and audit trail</p>
            </div>

            {/* Statistics Dashboard */}
            {stats && (
                <div className="logs-stats">
                    <div className="stat-card">
                        <h3>Total Logs</h3>
                        <div className="stat-value">{stats.total_logs.toLocaleString()}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Last 24 Hours</h3>
                        <div className="stat-value">{stats.recent_activity_24h}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Log Levels</h3>
                        <div className="level-breakdown">
                            {stats.level_stats.map(level => (
                                <div key={level._id} className="level-item">
                                    <span 
                                        className="level-badge" 
                                        style={{backgroundColor: getLevelColor(level._id)}}
                                    >
                                        {level._id}
                                    </span>
                                    <span>{level.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Top Actions</h3>
                        <div className="action-breakdown">
                            {stats.action_stats.slice(0, 5).map(action => (
                                <div key={action._id} className="action-item">
                                    <span className="action-name">{action._id}</span>
                                    <span className="action-count">{action.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="logs-filters">
                <div className="filter-group">
                    <label>Level:</label>
                    <select 
                        value={filters.level} 
                        onChange={(e) => handleFilterChange('level', e.target.value)}
                    >
                        <option value="">All Levels</option>
                        <option value="debug">Debug</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Action Type:</label>
                    <input
                        type="text"
                        placeholder="e.g., brain_created, workflow_executed"
                        value={filters.action_type}
                        onChange={(e) => handleFilterChange('action_type', e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>User ID:</label>
                    <input
                        type="text"
                        placeholder="Filter by user"
                        value={filters.user_id}
                        onChange={(e) => handleFilterChange('user_id', e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Brain ID:</label>
                    <input
                        type="text"
                        placeholder="Filter by brain"
                        value={filters.brain_id}
                        onChange={(e) => handleFilterChange('brain_id', e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Per Page:</label>
                    <select 
                        value={filters.limit} 
                        onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                </div>

                <button className="btn btn-secondary" onClick={() => setFilters({
                    limit: 50,
                    offset: 0,
                    level: '',
                    action_type: '',
                    user_id: '',
                    brain_id: '',
                    workflow_id: ''
                })}>
                    Clear Filters
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Logs Table */}
            <div className="logs-container">
                <div className="logs-header">
                    <h2>Activity Log</h2>
                    <div className="pagination-info">
                        Showing {filters.offset + 1}-{Math.min(filters.offset + filters.limit, totalCount)} of {totalCount} logs
                    </div>
                </div>

                <div className="logs-table-wrapper">
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Level</th>
                                <th>Action Type</th>
                                <th>Description</th>
                                <th>User</th>
                                <th>Context</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log._id} className={`log-row log-level-${log.level}`}>
                                    <td className="timestamp-cell">
                                        {formatTimestamp(log.timestamp)}
                                    </td>
                                    <td className="level-cell">
                                        <span 
                                            className="level-badge"
                                            style={{backgroundColor: getLevelColor(log.level)}}
                                        >
                                            {log.level.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="action-cell">
                                        <span 
                                            className="action-badge"
                                            style={{backgroundColor: getActionTypeColor(log.action_type)}}
                                        >
                                            {log.action_type}
                                        </span>
                                    </td>
                                    <td className="description-cell">
                                        {log.description}
                                    </td>
                                    <td className="user-cell">
                                        {log.user_id || 'system'}
                                    </td>
                                    <td className="context-cell">
                                        <div className="context-info">
                                            {log.brain_id && <div className="context-item brain">Brain: {log.brain_id.slice(0, 8)}...</div>}
                                            {log.workflow_id && <div className="context-item workflow">Workflow: {log.workflow_id.slice(0, 8)}...</div>}
                                            {log.node_id && <div className="context-item node">Node: {log.node_id.slice(0, 8)}...</div>}
                                        </div>
                                    </td>
                                    <td className="details-cell">
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <details>
                                                <summary>View Metadata</summary>
                                                <pre className="metadata-display">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                    <button 
                        className="btn btn-secondary"
                        onClick={() => handlePageChange('prev')}
                        disabled={filters.offset === 0}
                    >
                        Previous
                    </button>
                    
                    <span className="pagination-info">
                        Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(totalCount / filters.limit)}
                    </span>
                    
                    <button 
                        className="btn btn-secondary"
                        onClick={() => handlePageChange('next')}
                        disabled={filters.offset + filters.limit >= totalCount}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Auto-refresh toggle */}
            <div className="logs-controls">
                <button 
                    className="btn btn-primary"
                    onClick={fetchLogs}
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
        </div>
    );
};

export default LogsPage;
