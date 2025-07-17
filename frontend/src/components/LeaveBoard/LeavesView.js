import React, { useState, useMemo } from 'react';
import './LeaveBoard.css';
import { FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
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
      // Safe string matching with null/undefined checks
      const leaveType = request.leave_type || '';
      const reason = request.reason || '';
      const status = request.status || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = leaveType.toLowerCase().includes(searchLower) ||
                           reason.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesType = typeFilter === 'all' || leaveType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort requests with safe comparisons
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'date_desc':
          return new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date);
        case 'date_asc':
          return new Date(a.created_at || a.start_date) - new Date(b.created_at || b.start_date);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'type':
          return (a.leave_type || '').localeCompare(b.leave_type || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [leaveRequests, searchTerm, statusFilter, typeFilter, sortBy]);

  const groupedRequests = {
    pending: filteredRequests.filter(r => (r.status || '') === 'pending'),
    approved: filteredRequests.filter(r => (r.status || '') === 'approved'),
    rejected: filteredRequests.filter(r => (r.status || '') === 'rejected')
  };

  const leaveTypes = [...new Set(leaveRequests.map(r => r.leave_type).filter(Boolean))];

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
    <div className="leaves-view-clean">
      {filteredRequests.length === 0 ? (
        <div className="empty-state">No leave requests found.</div>
      ) : (
        filteredRequests.map((request, idx) => (
          <div key={request.id || request._id} className="leave-card-clean">
            <div className="leave-type-clean">{request.leave_type || request.type}</div>
            <div className="leave-dates-clean">{new Date(request.start_date || request.startDate).toLocaleDateString()} - {new Date(request.end_date || request.endDate).toLocaleDateString()}</div>
            <div className={`leave-status-clean ${request.status}`}>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</div>
            {request.reason && <div className="leave-comment-clean">{request.reason}</div>}
          </div>
        ))
      )}
    </div>
  );
};

export default LeavesView;

// Remove welcome section from all tabs except dashboard
