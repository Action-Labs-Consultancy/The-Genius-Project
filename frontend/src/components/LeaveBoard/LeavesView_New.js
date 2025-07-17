import React, { useState, useMemo } from 'react';
import { FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Download } from 'lucide-react';
import { LeavesViewSkeleton } from './LoadingSkeletons';
import { ErrorState, EmptyLeaveRequests } from './StateComponents';

const LeavesView = ({ 
  user, 
  leaveRequests, 
  leaveBalances, 
  onRequestLeave,
  getLeaveTypeColor,
  getStatusColor,
  loading = false,
  error = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let filtered = leaveRequests.filter(request => {
      const matchesSearch = request.leave_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.leave_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort requests
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'date_desc':
          return new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date);
        case 'date_asc':
          return new Date(a.created_at || a.start_date) - new Date(b.created_at || b.start_date);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'type':
          return a.leave_type.localeCompare(b.leave_type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [leaveRequests, searchTerm, statusFilter, typeFilter, sortBy]);

  const groupedRequests = {
    pending: filteredRequests.filter(r => r.status === 'pending'),
    approved: filteredRequests.filter(r => r.status === 'approved'),
    rejected: filteredRequests.filter(r => r.status === 'rejected')
  };

  const leaveTypes = [...new Set(leaveRequests.map(r => r.leave_type))];

  // Show loading skeleton
  if (loading) {
    return <LeavesViewSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorState
        title="Unable to Load Leaves"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const StatusIcon = ({ status }) => {
    switch(status) {
      case 'approved': return <CheckCircle className="status-icon approved" />;
      case 'rejected': return <XCircle className="status-icon rejected" />;
      default: return <AlertCircle className="status-icon pending" />;
    }
  };

  return (
    <div className="leaves-view fade-in">
      <div className="leaves-header">
        <div className="header-content">
          <h2>My Leave Requests</h2>
          <p>Track and manage all your leave requests</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={() => {/* Export function */}}>
            <Download className="btn-icon" />
            Export
          </button>
          <button className="primary-btn pulse" onClick={onRequestLeave}>
            <FileText className="btn-icon" />
            New Request
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="leaves-controls">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {leaveTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="status">By Status</option>
            <option value="type">By Type</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="leaves-stats">
        <div className="stat-item hover-lift">
          <div className="stat-number">{groupedRequests.pending.length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-item hover-lift">
          <div className="stat-number">{groupedRequests.approved.length}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-item hover-lift">
          <div className="stat-number">{groupedRequests.rejected.length}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-item hover-lift">
          <div className="stat-number">{Object.values(leaveBalances).reduce((sum, val) => sum + val, 0)}</div>
          <div className="stat-label">Total Balance</div>
        </div>
      </div>

      {/* Requests List */}
      <div className="leaves-content">
        {filteredRequests.length === 0 ? (
          leaveRequests.length === 0 ? (
            <EmptyLeaveRequests onRequestLeave={onRequestLeave} />
          ) : (
            <div className="no-results">
              <Search size={48} className="no-results-icon" />
              <h3>No requests found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )
        ) : (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request.id || request._id} className="request-card slide-up hover-lift">
                <div className="request-header">
                  <div className="request-type-badge" style={{ backgroundColor: getLeaveTypeColor(request.leave_type) }}>
                    {request.leave_type}
                  </div>
                  <div className="request-status">
                    <StatusIcon status={request.status} />
                    <span className={`status-text ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
                
                <div className="request-content">
                  <div className="request-dates">
                    <Calendar className="date-icon" />
                    <div className="date-range">
                      <div className="date-start">{new Date(request.start_date).toLocaleDateString()}</div>
                      <div className="date-separator">to</div>
                      <div className="date-end">{new Date(request.end_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="request-duration">
                    <Clock className="duration-icon" />
                    <span className="duration-text">
                      {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {request.reason && (
                    <div className="request-reason">
                      <p>"{request.reason}"</p>
                    </div>
                  )}
                </div>
                
                <div className="request-footer">
                  <div className="request-meta">
                    <span className="submitted-date">
                      Submitted: {new Date(request.created_at || request.start_date).toLocaleDateString()}
                    </span>
                    {request.manager_name && (
                      <span className="manager-name">
                        Manager: {request.manager_name}
                      </span>
                    )}
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="request-actions">
                      <button className="edit-btn" onClick={() => {/* Edit function */}}>
                        Edit
                      </button>
                      <button className="cancel-btn" onClick={() => {/* Cancel function */}}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeavesView;
