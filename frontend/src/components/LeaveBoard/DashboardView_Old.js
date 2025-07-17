import React from 'react';
import { Calendar, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardSkeleton } from './LoadingSkeletons';
import { ErrorState, EmptyLeaveRequests, EmptyPendingRequests, EmptyWhoIsOff } from './StateComponents';
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
          </div>
          <div className="stat-content">
            <h3>{pendingRequests.length}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Users className="icon" />
          </div>
          <div className="stat-content">
            <h3>{whoIsOffToday.length}</h3>
            <p>Off Today</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp className="icon" />
          </div>
          <div className="stat-content">
            <h3>{upcomingHolidays.length}</h3>
            <p>Upcoming Holidays</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Leave Balance Cards */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Leave Balance</h3>
            <div className="card-actions">
              <button className="action-btn" onClick={onRequestLeave}>
                Request Leave
              </button>
            </div>
          </div>
          <div className="leave-balances">
            {Object.entries(leaveBalances).map(([type, balance]) => (
              <div key={type} className="balance-item">
                <div className="balance-header">
                  <span className="balance-type">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span className="balance-number">{balance}</span>
                </div>
                <div className="balance-bar">
                  <div 
                    className="balance-fill"
                    style={{ 
                      width: `${Math.min((balance / 20) * 100, 100)}%`,
                      backgroundColor: getLeaveTypeColor(type)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Requests</h3>
            <div className="card-actions">
              <span className="requests-count">{recentRequests.length}</span>
            </div>
          </div>
          <div className="requests-list">
            {recentRequests.length === 0 ? (
              <div className="empty-state">
                <AlertCircle className="empty-icon" />
                <p>No recent requests</p>
              </div>
            ) : (
              recentRequests.map(request => (
                <div key={request.id || request._id} className="request-item">
                  <div className="request-avatar">
                    <div className="avatar-circle" style={{ backgroundColor: getLeaveTypeColor(request.type) }}>
                      {(request.employee_name || request.employee || '').charAt(0)}
                    </div>
                  </div>
                  <div className="request-info">
                    <div className="request-name">{request.employee_name || request.employee}</div>
                    <div className="request-details">
                      <span className="request-type">{request.type}</span>
                      <span className="request-dates">{request.start_date || request.startDate}</span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <span className={`status-badge ${request.status}`}>
                      {request.status}
                    </span>
                    {isHR && request.status === 'pending' && (
                      <div className="action-buttons">
                        <button 
                          className="approve-btn"
                          onClick={() => onApproveReject(request.id || request._id, 'approved')}
                        >
                          ✓
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => onApproveReject(request.id || request._id, 'rejected')}
                        >
                          ✗
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Who's Off Today */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Who's Off Today</h3>
            <div className="card-actions">
              <span className="off-count">{whoIsOffToday.length}</span>
            </div>
          </div>
          <div className="off-today-list">
            {whoIsOffToday.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-icon" />
                <p>Everyone's in office today!</p>
              </div>
            ) : (
              whoIsOffToday.map((person, idx) => (
                <div key={idx} className="off-person">
                  <div className="person-avatar">
                    <div className="avatar-circle" style={{ backgroundColor: getLeaveTypeColor(person.type) }}>
                      {person.name.charAt(0)}
                    </div>
                  </div>
                  <div className="person-info">
                    <div className="person-name">{person.name}</div>
                    <div className="person-type">{person.type}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Public Holidays */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Upcoming Holidays</h3>
            <div className="card-actions">
              <span className="holidays-count">{upcomingHolidays.length}</span>
            </div>
          </div>
          <div className="holidays-list">
            {upcomingHolidays.length === 0 ? (
              <div className="empty-state">
                <Calendar className="empty-icon" />
                <p>No upcoming holidays</p>
              </div>
            ) : (
              upcomingHolidays.map((holiday, idx) => (
                <div key={idx} className="holiday-item">
                  <div className="holiday-date">
                    <span className="day">{new Date(holiday.date).getDate()}</span>
                    <span className="month">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="holiday-info">
                    <div className="holiday-name">{holiday.name}</div>
                    <div className="holiday-type">{holiday.type}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
