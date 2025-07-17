import React from 'react';
import { Calendar, Clock, Users, TrendingUp, AlertCircle, PlusCircle } from 'lucide-react';
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
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card hover-lift">
          <div className="stat-icon">
            <Calendar className="icon" />
          </div>
          <div className="stat-content">
            <h3>{Object.values(leaveBalances).reduce((sum, val) => sum + val, 0)}</h3>
            <p>Total Leave Balance</p>
          </div>
        </div>
        
        <div className="stat-card hover-lift">
          <div className="stat-icon">
            <Clock className="icon" />
          </div>
          <div className="stat-content">
            <h3>{pendingRequests.length}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        
        <div className="stat-card hover-lift">
          <div className="stat-icon">
            <Users className="icon" />
          </div>
          <div className="stat-content">
            <h3>{whoIsOffToday.length}</h3>
            <p>On Leave Today</p>
          </div>
        </div>
        
        <div className="stat-card hover-lift">
          <div className="stat-icon">
            <TrendingUp className="icon" />
          </div>
          <div className="stat-content">
            <h3>{upcomingHolidays.length}</h3>
            <p>Upcoming Holidays</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-grid">
        {/* Leave Balance Card */}
        <div className="dashboard-card hover-lift">
          <div className="card-header">
            <h3>Leave Balance</h3>
            <div className="card-actions">
              <button className="action-btn" onClick={onRequestLeave}>
                <PlusCircle size={16} />
                Request Leave
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="balance-grid">
              {Object.entries(leaveBalances).map(([type, balance]) => (
                <div key={type} className="balance-item">
                  <div className="balance-type">{type.replace('_', ' ')}</div>
                  <div className="balance-value">{balance}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Requests Card */}
        <div className="dashboard-card hover-lift">
          <div className="card-header">
            <h3>Recent Requests</h3>
            <div className="card-actions">
              <span className="requests-count">{recentRequests.length}</span>
            </div>
          </div>
          <div className="card-content">
            {recentRequests.length === 0 ? (
              <EmptyLeaveRequests onRequestLeave={onRequestLeave} />
            ) : (
              <div className="requests-list">
                {recentRequests.map((request) => (
                  <div key={request.id || request._id} className="request-item slide-up">
                    <div className="request-info">
                      <div className="request-header">
                        <span className="request-user">{request.user_name || user.name}</span>
                        <span className={`request-status ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="request-details">
                        <span className="request-type">{request.leave_type}</span>
                        <span className="request-dates">
                          {new Date(request.start_date).toLocaleDateString()} - 
                          {new Date(request.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isHR && request.status === 'pending' && (
                      <div className="request-actions">
                        <button 
                          className="btn btn-approve"
                          onClick={() => onApproveReject(request.id || request._id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-reject"
                          onClick={() => onApproveReject(request.id || request._id, 'rejected')}
                        >
                          Reject
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

        {/* Upcoming Holidays Card */}
        <div className="dashboard-card hover-lift">
          <div className="card-header">
            <h3>Upcoming Holidays</h3>
            <div className="card-actions">
              <span className="holidays-count">{upcomingHolidays.length}</span>
            </div>
          </div>
          <div className="card-content">
            {upcomingHolidays.length === 0 ? (
              <div className="no-holidays">
                <Calendar size={48} className="no-holidays-icon" />
                <p>No upcoming holidays</p>
              </div>
            ) : (
              <div className="holidays-list">
                {upcomingHolidays.map((holiday) => (
                  <div key={holiday.id || holiday.date} className="holiday-item slide-up">
                    <div className="holiday-info">
                      <span className="holiday-name">{holiday.name}</span>
                      <span className="holiday-date">
                        {new Date(holiday.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="holiday-type">{holiday.type || 'Public Holiday'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
