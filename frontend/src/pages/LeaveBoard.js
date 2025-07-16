import React, { useState, useEffect } from 'react';
import './LeaveBoard.css';
import { API_BASE_URL } from '../config/api';

const LeaveBoard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch leave balances and requests from backend
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const balancesRes = await fetch(`${API_BASE_URL}/api/leave/balances?user_id=${user?.id}`);
        const balances = balancesRes.ok ? await balancesRes.json() : {};
        setLeaveBalances(balances);
        const requestsRes = await fetch(`${API_BASE_URL}/api/leave/requests?user_id=${user?.id}`);
        const requests = requestsRes.ok ? await requestsRes.json() : [];
        setLeaveRequests(requests);
        // Optionally fetch team leaves for calendar
        const teamRes = await fetch(`${API_BASE_URL}/api/leave/team?user_id=${user?.id}`);
        const team = teamRes.ok ? await teamRes.json() : [];
        setTeamLeaves(team);
      } catch (e) {
        setLeaveBalances({});
        setLeaveRequests([]);
        setTeamLeaves([]);
      }
      setLoading(false);
    }
    if (user?.id) fetchData();
  }, [user]);

  // Approve/Reject handler for HR
  const handleApproveReject = async (requestId, action) => {
    try {
      const req = leaveRequests.find(r => r.id === requestId || r._id === requestId);
      if (!req) return;

      const res = await fetch(`${API_BASE_URL}/api/leave/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          manager_id: user.id,
          action_date: new Date().toISOString()
        })
      });

      if (res.ok) {
        // Real-time updates: refresh all data immediately
        await Promise.all([
          refreshLeaveRequests(),
          refreshLeaveBalances(req.user_id),
          refreshTeamLeaves()
        ]);
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
    }
  };

  // Helper functions for real-time updates
  const refreshLeaveRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave/requests?user_id=${user?.id}`);
      if (response.ok) {
        const requests = await response.json();
        setLeaveRequests(requests);
      }
    } catch (error) {
      console.error('Error refreshing leave requests:', error);
    }
  };

  const refreshLeaveBalances = async (targetUserId = null) => {
    try {
      const userId = targetUserId || user?.id;
      const response = await fetch(`${API_BASE_URL}/api/leave/balances?user_id=${userId}`);
      if (response.ok) {
        const balances = await response.json();
        setLeaveBalances(balances);
      }
    } catch (error) {
      console.error('Error refreshing leave balances:', error);
    }
  };

  const refreshTeamLeaves = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave/team?user_id=${user?.id}`);
      if (response.ok) {
        const team = await response.json();
        setTeamLeaves(team);
      }
    } catch (error) {
      console.error('Error refreshing team leaves:', error);
    }
  };

  // Submit leave request handler
  const handleRequestSubmit = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          employee_name: user.name || user.username,
          type: formData.type,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
          submitted_date: new Date().toISOString()
        })
      });

      if (response.ok) {
        const newRequest = await response.json();
        setShowRequestForm(false);
        
        // Real-time updates: refresh all data
        await Promise.all([
          refreshLeaveRequests(),
          refreshLeaveBalances(),
          refreshTeamLeaves()
        ]);
        
        // Show success message
        console.log('Leave request submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
    }
  };

  // Helper: is HR
  const isHR = user?.department?.toLowerCase() === 'hr' || user?.is_admin;

  // Helper function to get leave type color
  const getLeaveTypeColor = (type) => {
    switch(type) {
      case 'vacation': return '#2196F3';
      case 'sick': return '#f44336';
      case 'personal': return '#9C27B0';
      case 'maternity': return '#E91E63';
      case 'unpaid': return '#607D8B';
      default: return '#ccc';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'pending': return '#FF9800';
      default: return '#ccc';
    }
  };

  return (
    <div className="leaveboard-container">
      <div className="leaveboard-header">
        <h1 className="leaveboard-title">Leave Board</h1>
        <div className="leaveboard-tabs">
          <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar</button>
          <button className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Requests</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
          <div className="dashboard-top-row">
            <div className="request-leave-hero">
              <button className="request-leave-btn" onClick={() => setShowRequestForm(true)}>
                <span className="icon">➕</span> Request Leave
              </button>
            </div>
            <div className="balance-section compact">
              <h3>Leave Balances</h3>
              <div className="balance-cards compact">
                {Object.entries(leaveBalances).map(([type, balance]) => (
                  <div key={type} className="balance-card compact">
                    <div className="balance-type">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div className="balance-number">{balance}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-bottom-row">
            <div className="recent-requests compact">
              <h3>Recent Requests</h3>
              {leaveRequests.length === 0 ? (
                <div className="no-requests">
                  No requests found
                  <span className="tooltip">You haven’t submitted any leave requests yet. Click “Request Leave” to get started.</span>
                </div>
              ) : (
                <div className="request-list compact">
                  {leaveRequests.slice(0, 6).map(request => (
                    <div key={request.id} className="request-item compact">
                      <div className="request-info">
                        <span className="request-employee">{request.employee}</span>
                        <span className="request-type">{request.type}</span>
                        <span className="request-dates">{request.startDate} - {request.endDate}</span>
                      </div>
                      <div className="request-status" style={{ backgroundColor: getStatusColor(request.status) }}>{request.status}</div>
                      {/* No approve/reject buttons in dashboard recent requests */}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="team-availability">
              <h3>Team Availability</h3>
              <div className="availability-list">
                {teamLeaves.map((leave, idx) => (
                  <div key={idx} className="availability-item">
                    <span className="availability-employee">{leave.employee}</span>
                    <span className="availability-type" style={{ backgroundColor: getLeaveTypeColor(leave.type) }}>{leave.type}</span>
                    <span className="availability-dates">{leave.start} - {leave.end}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="calendar-content">
          <CalendarView 
            teamLeaves={teamLeaves}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            getLeaveTypeColor={getLeaveTypeColor}
          />
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-content">
          <div className="requests-header">
            <h3>Leave Requests {isHR && '(HR View - All Requests)'}</h3>
            <div className="requests-stats">
              <span className="stat-item">
                <span className="stat-number">{leaveRequests.filter(r => r.status === 'pending').length}</span>
                <span className="stat-label">Pending</span>
              </span>
              <span className="stat-item">
                <span className="stat-number">{leaveRequests.filter(r => r.status === 'approved').length}</span>
                <span className="stat-label">Approved</span>
              </span>
              <span className="stat-item">
                <span className="stat-number">{leaveRequests.filter(r => r.status === 'rejected').length}</span>
                <span className="stat-label">Rejected</span>
              </span>
            </div>
          </div>
          
          <div className="requests-manager">
            <div className="requests-list">
              {leaveRequests.length === 0 ? (
                <div className="no-requests">
                  <div className="no-requests-icon">📋</div>
                  <h4>No leave requests found</h4>
                  <p>{isHR ? 'No team members have submitted leave requests yet.' : 'You haven\'t submitted any leave requests yet.'}</p>
                  {!isHR && (
                    <button 
                      className="request-leave-btn-alt" 
                      onClick={() => setShowRequestForm(true)}
                    >
                      ➕ Request Leave
                    </button>
                  )}
                </div>
              ) : (
                leaveRequests.map(request => (
                  <div key={request.id || request._id} className="request-card">
                    <div className="request-header">
                      <div className="request-employee-info">
                        <div className="request-employee">{request.employee_name || request.employee}</div>
                        <div className="request-type-badge" style={{ backgroundColor: getLeaveTypeColor(request.type) }}>
                          {request.type}
                        </div>
                      </div>
                      <div className="request-status-badge" style={{ backgroundColor: getStatusColor(request.status) }}>
                        {request.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <div className="detail-row">
                        <div className="detail-item">
                          <span className="detail-label">📅 Duration:</span>
                          <span className="detail-value">{request.duration || 1} days</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">🗓️ Dates:</span>
                          <span className="detail-value">{request.start_date || request.startDate} to {request.end_date || request.endDate}</span>
                        </div>
                      </div>
                      {request.reason && (
                        <div className="detail-item reason">
                          <span className="detail-label">💬 Reason:</span>
                          <span className="detail-value">{request.reason}</span>
                        </div>
                      )}
                      {request.submitted_date && (
                        <div className="detail-item">
                          <span className="detail-label">📤 Submitted:</span>
                          <span className="detail-value">{new Date(request.submitted_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {isHR && request.status === 'pending' && (
                      <div className="request-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveReject(request.id || request._id, 'approved')}
                        >
                          ✅ Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleApproveReject(request.id || request._id, 'rejected')}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showRequestForm && (
        <LeaveRequestForm 
          onSubmit={handleRequestSubmit}
          onCancel={() => setShowRequestForm(false)}
          leaveBalances={leaveBalances}
        />
      )}
    </div>
  );
};

// Calendar View Component
const CalendarView = ({ teamLeaves, selectedDate, onDateSelect, getLeaveTypeColor }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  };

  // Helper to check if a day is Friday (5) or Saturday (6)
  const isWeekend = (day) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.getDay() === 5 || date.getDay() === 6;
  };

  const hasLeave = (day) => {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return teamLeaves.some(leave => {
      const startDate = leave.start_date || leave.start;
      const endDate = leave.end_date || leave.end;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const getLeaveForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return teamLeaves.filter(leave => {
      const startDate = leave.start_date || leave.start;
      const endDate = leave.end_date || leave.end;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button 
          className="nav-btn"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          ←
        </button>
        <h2>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
        <button 
          className="nav-btn"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          →
        </button>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((day, index) => (
            <div 
              key={index} 
              className={`calendar-day ${day ? 'has-day' : 'empty'} ${hasLeave(day) ? 'has-leave' : ''} ${isWeekend(day) ? 'weekend' : ''}`}
              onClick={() => day && onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
            >
              {day && (
                <>
                  <span className="day-number">{day}</span>
                  {getLeaveForDay(day).map((leave, idx) => (
                    <div 
                      key={idx} 
                      className="leave-indicator"
                      style={{ backgroundColor: getLeaveTypeColor(leave.type) }}
                      title={`${leave.employee} - ${leave.type}`}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Request Form Component
const LeaveRequestForm = ({ onSubmit, onCancel, leaveBalances }) => {
  const [formData, setFormData] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    attachments: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    onSubmit({
      ...formData,
      duration
    });
  };

  return (
    <div className="modal-overlay">
      <div className="request-form">
        <h3>Request Leave</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Leave Type</label>
            <select 
              value={formData.type} 
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              required
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Day</option>
              <option value="maternity">Maternity/Paternity</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
            <small>Available: {leaveBalances[formData.type]} days</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <textarea 
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              placeholder="Please provide a reason for your leave request..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Attachments (Optional)</label>
            <input 
              type="file" 
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFormData({...formData, attachments: Array.from(e.target.files)})}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Requests Manager Component
export default LeaveBoard;
