import React, { useState, useEffect } from 'react';
import './LeaveBoard.css';
import { API_BASE_URL } from '../config/api';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User,
  Settings,
  FileText,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Bell,
  PlusCircle,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Download
} from 'lucide-react';

// Import new view components
import DashboardView from '../components/LeaveBoard/DashboardView';
import LeavesView from '../components/LeaveBoard/LeavesView';
import ManageTeamView from '../components/LeaveBoard/ManageTeamView';
import AnalyticsView from '../components/LeaveBoard/AnalyticsView';
import SupportView from '../components/LeaveBoard/SupportView';
import AccountView from '../components/LeaveBoard/AccountView';

const LeaveBoard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [whoIsOffToday, setWhoIsOffToday] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Check if user is HR
  const isHR = user?.department?.toLowerCase() === 'hr' || user?.is_admin || user?.role === 'hr';

  // Enhanced fetch function with real-time updates
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const promises = [
          fetch(`${API_BASE_URL}/api/leave/balances?user_id=${user?.id}`),
          fetch(`${API_BASE_URL}/api/leave/requests?user_id=${user?.id}`),
          fetch(`${API_BASE_URL}/api/leave/team?user_id=${user?.id}`),
          fetch(`${API_BASE_URL}/api/leave/public-holidays`),
          fetch(`${API_BASE_URL}/api/leave/who-is-off-today`)
        ];

        // If HR, fetch all requests and team members
        if (isHR) {
          promises.push(
            fetch(`${API_BASE_URL}/api/leave/all-requests`),
            fetch(`${API_BASE_URL}/api/leave/team-members`)
          );
        }

        const responses = await Promise.all(promises);
        const [balancesRes, requestsRes, teamRes, holidaysRes, whoIsOffRes, allRequestsRes, teamMembersRes] = responses;

        // Process responses
        const balances = balancesRes.ok ? await balancesRes.json() : {};
        const requests = requestsRes.ok ? await requestsRes.json() : [];
        const team = teamRes.ok ? await teamRes.json() : [];
        const holidays = holidaysRes.ok ? await holidaysRes.json() : [];
        const whoIsOff = whoIsOffRes.ok ? await whoIsOffRes.json() : [];

        setLeaveBalances(balances);
        setLeaveRequests(requests);
        setTeamLeaves(team);
        setPublicHolidays(holidays);
        setWhoIsOffToday(whoIsOff);

        if (isHR && allRequestsRes && teamMembersRes) {
          const allRequests = allRequestsRes.ok ? await allRequestsRes.json() : [];
          const teamMembers = teamMembersRes.ok ? await teamMembersRes.json() : [];
          setAllRequests(allRequests);
          setTeamMembers(teamMembers);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        setLeaveBalances({});
        setLeaveRequests([]);
        setTeamLeaves([]);
        setPublicHolidays([]);
        setWhoIsOffToday([]);
      }
      setLoading(false);
    }

    if (user?.id) {
      fetchData();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isHR]);

  // Approve/Reject handler for HR
  const handleApproveReject = async (requestId, action) => {
    try {
      const req = leaveRequests.find(r => r.id === requestId || r._id === requestId) ||
                  allRequests.find(r => r.id === requestId || r._id === requestId);
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
      
      if (isHR) {
        const allResponse = await fetch(`${API_BASE_URL}/api/leave/all-requests`);
        if (allResponse.ok) {
          const allRequests = await allResponse.json();
          setAllRequests(allRequests);
        }
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
    <div className="leave-board-app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Calendar className="logo-icon" />
            {!sidebarCollapsed && <span>Leave Board</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Menu /> : <X />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 className="nav-icon" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar className="nav-icon" />
            {!sidebarCollapsed && <span>Calendar</span>}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaves')}
          >
            <FileText className="nav-icon" />
            {!sidebarCollapsed && <span>My Leaves</span>}
          </button>

          {isHR && (
            <button 
              className={`nav-item ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              <Users className="nav-icon" />
              {!sidebarCollapsed && <span>Manage Team</span>}
            </button>
          )}

          {isHR && (
            <button 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp className="nav-icon" />
              {!sidebarCollapsed && <span>Analytics</span>}
            </button>
          )}
          
          <button 
            className={`nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <Bell className="nav-icon" />
            {!sidebarCollapsed && <span>Support</span>}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <User className="nav-icon" />
            {!sidebarCollapsed && <span>My Account</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <div className="content-header">
          <div className="welcome-section">
            <h1>Welcome back, {user?.name || user?.username}!</h1>
            <p>Manage your leave requests and team calendar</p>
          </div>
          <div className="header-actions">
            <button 
              className="quick-action-btn primary"
              onClick={() => setShowRequestForm(true)}
            >
              <PlusCircle className="btn-icon" />
              Request Leave
            </button>
            <button 
              className="quick-action-btn secondary"
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar className="btn-icon" />
              Check Team Calendar
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your leave dashboard...</p>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <div className="tab-content">
            {activeTab === 'dashboard' && (
              <DashboardView 
                user={user}
                isHR={isHR}
                leaveBalances={leaveBalances}
                leaveRequests={leaveRequests}
                allRequests={allRequests}
                publicHolidays={publicHolidays}
                whoIsOffToday={whoIsOffToday}
                teamLeaves={teamLeaves}
                onRequestLeave={() => setShowRequestForm(true)}
                onApproveReject={handleApproveReject}
                getLeaveTypeColor={getLeaveTypeColor}
                getStatusColor={getStatusColor}
              />
            )}
            
            {activeTab === 'calendar' && (
              <CalendarView 
                teamLeaves={teamLeaves}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                getLeaveTypeColor={getLeaveTypeColor}
                isHR={isHR}
                user={user}
              />
            )}
            
            {activeTab === 'leaves' && (
              <LeavesView 
                user={user}
                leaveRequests={leaveRequests}
                leaveBalances={leaveBalances}
                onRequestLeave={() => setShowRequestForm(true)}
                getLeaveTypeColor={getLeaveTypeColor}
                getStatusColor={getStatusColor}
              />
            )}

            {activeTab === 'manage' && isHR && (
              <ManageTeamView 
                allRequests={allRequests}
                teamMembers={teamMembers}
                onApproveReject={handleApproveReject}
                getLeaveTypeColor={getLeaveTypeColor}
                getStatusColor={getStatusColor}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            )}

            {activeTab === 'analytics' && isHR && (
              <AnalyticsView 
                allRequests={allRequests}
                teamMembers={teamMembers}
                getLeaveTypeColor={getLeaveTypeColor}
              />
            )}
            
            {activeTab === 'support' && (
              <SupportView user={user} />
            )}
            
            {activeTab === 'account' && (
              <AccountView user={user} leaveBalances={leaveBalances} />
            )}
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <LeaveRequestForm 
          onSubmit={handleRequestSubmit}
          onCancel={() => setShowRequestForm(false)}
          leaveBalances={leaveBalances}
          user={user}
        />
      )}
    </div>
  );
};

// Keep the existing CalendarView and LeaveRequestForm components
const CalendarView = ({ teamLeaves, selectedDate, onDateSelect, getLeaveTypeColor, isHR, user }) => {
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
const LeaveRequestForm = ({ onSubmit, onCancel, leaveBalances, user }) => {
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
            <small>Available: {leaveBalances[formData.type] || 0} days</small>
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

export default LeaveBoard;
