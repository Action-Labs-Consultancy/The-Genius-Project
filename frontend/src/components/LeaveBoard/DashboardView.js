import React from 'react';
import './LeaveBoard.css';
import { Calendar, Clock, Users, TrendingUp, AlertCircle, PlusCircle, Download, CheckCircle, XCircle } from 'lucide-react';
import { DashboardSkeleton } from './LoadingSkeletons';
import { ErrorState, EmptyLeaveRequests, EmptyPendingRequests, EmptyWhoIsOff } from './StateComponents';

const DashboardView = ({ 
  user, 
  isHR, 
  leaveBalances, 
  leaveRequests, 
  allRequests, 
  publicHolidays, 
  whoIsOffToday, 
  teamLeaves,
  onRequestLeave,
  onApproveReject,
  getLeaveTypeColor,
  getStatusColor,
  loading = false,
  error = null
}) => {
  const pendingRequests = isHR ? allRequests?.filter(r => r.status === 'pending') || [] : leaveRequests.filter(r => r.status === 'pending');
  const recentRequests = isHR ? allRequests?.slice(0, 6) || [] : leaveRequests.slice(0, 6);
  const upcomingHolidays = publicHolidays.slice(0, 3);

  // Show loading skeleton
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorState
        title="Unable to Load Dashboard"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="dashboard-view fade-in">
      {/* Clean Welcome Section with Request Leave Button */}
      <div className="welcome-section-clean">
        <div className="welcome-content">
          <div className="welcome-title-clean">Dashboard</div>
          <div className="welcome-desc-clean">Your leave management overview</div>
        </div>
        <button className="request-leave-btn-clean" onClick={onRequestLeave}>
          <PlusCircle className="btn-icon" />
          Request Leave
        </button>
      </div>

      {/* Main Dashboard Content - Side by Side Layout */}
      <div className="dashboard-grid-horizontal">
        {/* Leave Balance Cards - Each in separate box, animated, colored */}
        <div className="balance-cards-grid">
          {/* Vacation */}
          <div className="balance-card animated balance-vacation"
            style={{ background: '#111', color: '#2196F3', border: '3px solid #2196F3', borderRadius: '18px' }}>
            <div className="balance-type">Vacation</div>
            <div className="balance-value">{
              typeof leaveBalances.vacation === 'number' 
                ? leaveBalances.vacation.toFixed(1) 
                : (leaveBalances.vacation || '20.0')
            }</div>
          </div>
          {/* Sick Leave */}
          <div className="balance-card animated balance-sick"
            style={{ background: '#111', color: '#43A047', border: '3px solid #43A047', borderRadius: '18px' }}>
            <div className="balance-type">Sick Leave</div>
            <div className="balance-value">{leaveBalances.sick || 15}</div>
          </div>
          {/* Maternity */}
          <div className="balance-card animated balance-maternity"
            style={{ background: '#111', color: '#FF69B4', border: '3px solid #FF69B4', borderRadius: '18px' }}>
            <div className="balance-type">Maternity</div>
            <div className="balance-value">{leaveBalances.maternity || 60}</div>
          </div>
          {/* Personal */}
          <div className="balance-card animated balance-personal"
            style={{ background: '#111', color: '#9C27B0', border: '3px solid #9C27B0', borderRadius: '18px' }}>
            <div className="balance-type">Personal</div>
            <div className="balance-value">{leaveBalances.personal || 5}</div>
          </div>
          {/* Compensation Days */}
          <div className="balance-card animated balance-compensation"
            style={{ background: '#111', color: '#FFD600', border: '3px solid #FFD600', borderRadius: '18px' }}>
            <div className="balance-type">Compensation</div>
            <div className="balance-value">{leaveBalances.compensation || 0}</div>
            {leaveBalances.compensationComments && leaveBalances.compensationComments.length > 0 && (
              <div className="compensation-comments">
                {leaveBalances.compensationComments.map((comment, idx) => (
                  <div key={idx} className="compensation-comment">{comment}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Requests Card */}
        <div className="dashboard-card hover-lift">
          <div className="card-header">
            <h3>Recent Requests</h3>
          </div>
          <div className="card-content">
            {recentRequests.length === 0 ? (
              <div className="no-requests">
                <AlertCircle size={48} className="no-requests-icon" />
                <p>No recent requests</p>
              </div>
            ) : (
              <div className="requests-list">
                {recentRequests.map((request) => (
                  <div key={request.id || request._id} className="request-item slide-up">
                    <div className="request-info">
                      <div className="request-header">
                        <span className="request-user">{request.employee_name || request.employee || user.name}</span>
                        <div className={`request-status status-${request.status}`}>
                          {request.status === 'approved' && <CheckCircle className="status-icon" />}
                          {request.status === 'rejected' && <XCircle className="status-icon" />}
                          {request.status === 'pending' && <Clock className="status-icon" />}
                          <span className="status-text">{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                        </div>
                      </div>
                      <div className="request-details">
                        <span className="request-type">{request.leave_type || request.type}</span>
                        <span className="request-dates">
                          {new Date(request.start_date || request.startDate).toLocaleDateString()} - 
                          {new Date(request.end_date || request.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isHR && request.status === 'pending' && (
                      <div className="request-actions">
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => onApproveReject(request.id || request._id, 'approved')}
                        >
                          <CheckCircle className="btn-icon" />
                        </button>
                        <button 
                          className="action-btn reject-btn"
                          onClick={() => onApproveReject(request.id || request._id, 'rejected')}
                        >
                          <XCircle className="btn-icon" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Who's Off Today Card */}
        <div className="dashboard-card hover-lift">
          <div className="card-header">
            <h3>Who's Off Today</h3>
            <div className="card-actions">
              <span className="off-count">{whoIsOffToday.length}</span>
            </div>
          </div>
          <div className="card-content">
            {whoIsOffToday.length === 0 ? (
              <EmptyWhoIsOff />
            ) : (
              <div className="off-today-list">
                {whoIsOffToday.map((person) => (
                  <div key={person.id || person.user_id} className="off-item slide-up">
                    <div className="off-info">
                      <span className="off-name">{person.name}</span>
                      <span className="off-type">{person.leave_type}</span>
                    </div>
                    <div className="off-duration">
                      {person.is_full_day ? 'Full Day' : 'Partial'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Export function for requests data
  function exportRequestsData(requests) {
    const csvContent = [
      ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Status', 'Duration'],
      ...requests.map(request => [
        request.employee_name || request.employee || 'Unknown',
        request.leave_type || request.type || 'N/A',
        request.start_date || request.startDate || 'N/A',
        request.end_date || request.endDate || 'N/A',
        request.status || 'N/A',
        request.duration || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

export default DashboardView;
