import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from './config/api';
import './LogsPage.css';

const fetchLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${API_BASE_URL}/api/logs?${params.toString()}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('API Error:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};

const createSampleLogs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logs/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error creating sample logs:', error);
    return false;
  }
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    user: '', 
    role: '', 
    project: '', 
    task: '', 
    event_type: '', 
    start_date: '', 
    end_date: '' 
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchLogs(filters);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    let interval;
    loadLogs();
    
    if (autoRefresh) {
      interval = setInterval(loadLogs, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filters, autoRefresh]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ user: '', role: '', project: '', task: '', event_type: '', start_date: '', end_date: '' });
  };

  const handleCreateSampleLogs = async () => {
    const success = await createSampleLogs();
    if (success) {
      alert('Sample logs created successfully!');
      loadLogs();
    } else {
      alert('Failed to create sample logs');
    }
  };

  return (
    <div className="logs-page">
      <div className="logs-header">
        <h1>System Activity Logs</h1>
        <div className="logs-actions">
          <button onClick={handleCreateSampleLogs} className="btn-secondary">
            Create Sample Logs
          </button>
          <button onClick={loadLogs} className="btn-primary">
            Refresh
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <input 
            name="user" 
            placeholder="Filter by User" 
            value={filters.user} 
            onChange={handleFilterChange} 
          />
          <input 
            name="role" 
            placeholder="Filter by Role" 
            value={filters.role} 
            onChange={handleFilterChange} 
          />
          <input 
            name="project" 
            placeholder="Filter by Project" 
            value={filters.project} 
            onChange={handleFilterChange} 
          />
          <input 
            name="task" 
            placeholder="Filter by Task" 
            value={filters.task} 
            onChange={handleFilterChange} 
          />
          <input 
            name="event_type" 
            placeholder="Filter by Event Type" 
            value={filters.event_type} 
            onChange={handleFilterChange} 
          />
          <input 
            name="start_date" 
            type="date" 
            title="Start Date"
            value={filters.start_date} 
            onChange={handleFilterChange} 
          />
          <input 
            name="end_date" 
            type="date" 
            title="End Date"
            value={filters.end_date} 
            onChange={handleFilterChange} 
          />
        </div>
        
        <div className="filters-controls">
          <label className="auto-refresh-control">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
            />
            Auto-refresh (10s)
          </label>
          <button onClick={clearFilters} className="btn-clear">
            Clear Filters
          </button>
        </div>
      </div>

      <div className="logs-content">
        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : (
          <>
            <div className="logs-count">
              {logs.length} log{logs.length !== 1 ? 's' : ''} found
            </div>
            
            <div className="table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Project</th>
                    <th>Task</th>
                    <th>Event Type</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log._id || index}>
                      <td>{log.user || '-'}</td>
                      <td>{log.role || '-'}</td>
                      <td>{log.action || '-'}</td>
                      <td className="description-cell">{log.description || '-'}</td>
                      <td>{log.project || '-'}</td>
                      <td>{log.task || '-'}</td>
                      <td>
                        <span className={`event-type ${log.event_type}`}>
                          {log.event_type || '-'}
                        </span>
                      </td>
                      <td className="timestamp-cell">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {logs.length === 0 && !loading && (
                <div className="no-logs">
                  <p>No logs found matching your criteria.</p>
                  <p>Try adjusting your filters or create some sample logs to get started.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
