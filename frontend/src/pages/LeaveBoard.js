import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
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
import CalendarView from '../components/LeaveBoard/CalendarView';

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

  // Memoize user properties to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  const userDepartment = useMemo(() => user?.department, [user?.department]);
  const isUserAdmin = useMemo(() => user?.is_admin, [user?.is_admin]);
  const userRole = useMemo(() => user?.role, [user?.role]);

  // Enhanced fetch function with real-time updates
  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        console.warn('No user ID available for fetching data');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const promises = [
          fetch(`${API_BASE_URL}/api/leave/balances?user_id=${userId}`),
          fetch(`${API_BASE_URL}/api/leave/requests?user_id=${userId}`),
          fetch(`${API_BASE_URL}/api/leave/team?user_id=${userId}`),
          fetch(`${API_BASE_URL}/api/leave/public-holidays`),
          fetch(`${API_BASE_URL}/api/leave/who-is-off-today`)
        ];

        // If HR, fetch team members
        if (isHR) {
          promises.push(
            fetch(`${API_BASE_URL}/api/leave/team-members`)
          );
        }

        const responses = await Promise.all(promises);
        const [balancesRes, requestsRes, teamRes, holidaysRes, whoIsOffRes, teamMembersRes] = responses;

        // Process responses with better error handling
        const balances = balancesRes.ok ? await balancesRes.json() : {
          vacation: 20.0, sick: 15, personal: 5, maternity: 60, compensation: 0
        };
        const requests = requestsRes.ok ? await requestsRes.json() : [];
        const team = teamRes.ok ? await teamRes.json() : [];
        const holidays = holidaysRes.ok ? await holidaysRes.json() : [];
        const whoIsOff = whoIsOffRes.ok ? await whoIsOffRes.json() : [];

        // Use the backend data directly - it already has the correct calculations
        setLeaveBalances(balances);
        setLeaveRequests(requests);
        setTeamLeaves(team);
        setPublicHolidays(holidays);
        setWhoIsOffToday(whoIsOff);

        // For HR users, requests already includes all requests
        // For regular users, requests only includes their own requests
        if (isHR) {
          setAllRequests(requests);
          const teamMembers = teamMembersRes && teamMembersRes.ok ? await teamMembersRes.json() : [];
          setTeamMembers(teamMembers);
        } else {
          setAllRequests(requests);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        // Set reasonable defaults on error
        setLeaveBalances({
          vacation: 20.0, sick: 15, personal: 5, maternity: 60, compensation: 0
        });
        setLeaveRequests([]);
        setTeamLeaves([]);
        setPublicHolidays([]);
        setWhoIsOffToday([]);
      }
      setLoading(false);
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  // Approve/Reject handler for HR
  const handleApproveReject = async (requestId, action, rejectionComment = '') => {
    try {
      const req = leaveRequests.find(r => r.id === requestId || r._id === requestId) ||
                  allRequests.find(r => r.id === requestId || r._id === requestId);
      if (!req) return;

      const requestBody = {
        status: action,
        manager_id: user.id,
        action_date: new Date().toISOString()
      };

      // Add rejection comment if rejecting
      if (action === 'rejected' && rejectionComment) {
        requestBody.rejection_reason = rejectionComment;
      }

      const res = await fetch(`${API_BASE_URL}/api/leave/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        // Real-time updates: refresh all data immediately
        await Promise.all([
          refreshLeaveRequests(),
          refreshLeaveBalances(req.user_id),
          refreshTeamLeaves()
        ]);
        
        // Update the local state immediately for better UX
        const updatedRequest = { ...req, status: action, rejection_reason: rejectionComment };
        setLeaveRequests(prev => prev.map(r => 
          (r.id === requestId || r._id === requestId) ? updatedRequest : r
        ));
        setAllRequests(prev => prev.map(r => 
          (r.id === requestId || r._id === requestId) ? updatedRequest : r
        ));
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
        
        // For HR, the requests endpoint already returns all requests
        // For regular users, it returns only their own requests
        setAllRequests(requests);
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

  // Check for conflicting leave dates
  const checkLeaveConflicts = (startDate, endDate) => {
    const conflicts = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check against all approved team leaves
    const approvedLeaves = teamLeaves.filter(leave => 
      leave.status === 'approved' && leave.user_id !== user.id
    );
    
    // Check against all pending requests from other users
    const pendingRequests = allRequests.filter(request => 
      request.status === 'pending' && request.user_id !== user.id
    );
    
    [...approvedLeaves, ...pendingRequests].forEach(leave => {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      
      // Check if dates overlap
      if (start <= leaveEnd && end >= leaveStart) {
        conflicts.push({
          name: leave.employee_name || leave.user_name,
          startDate: leave.start_date,
          endDate: leave.end_date,
          type: leave.leave_type || leave.type,
          status: leave.status
        });
      }
    });
    
    return conflicts;
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
        </nav>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your leave dashboard...</p>
          </div>
        )}

        {/* Tab Content - Remove ugly welcome header */}
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
                loading={loading}
                error={null}
              />
            )}
            
            {activeTab === 'calendar' && (
              <CalendarView 
                teamLeaves={teamLeaves}
                allRequests={allRequests}
                publicHolidays={publicHolidays}
                user={user}
                isHR={isHR}
                getLeaveTypeColor={getLeaveTypeColor}
                loading={loading}
                error={null}
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
                loading={loading}
                error={null}
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
                publicHolidays={publicHolidays}
                isHR={isHR}
                loading={loading}
                error={null}
              />
            )}

            {activeTab === 'analytics' && isHR && (
              <AnalyticsView 
                allRequests={allRequests}
                teamMembers={teamMembers}
                publicHolidays={publicHolidays}
                getLeaveTypeColor={getLeaveTypeColor}
                isHR={isHR}
                loading={loading}
                error={null}
              />
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
          checkLeaveConflicts={checkLeaveConflicts}
        />
      )}
    </div>
  );
};

// Request Form Component
const LeaveRequestForm = ({ onSubmit, onCancel, leaveBalances, user, checkLeaveConflicts }) => {
  const [formData, setFormData] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    attachments: []
  });

  const [conflicts, setConflicts] = useState([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  // Check for conflicts when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const foundConflicts = checkLeaveConflicts(formData.startDate, formData.endDate);
      setConflicts(foundConflicts);
      setShowConflictWarning(foundConflicts.length > 0);
    } else {
      setConflicts([]);
      setShowConflictWarning(false);
    }
  }, [formData.startDate, formData.endDate, checkLeaveConflicts]);

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

  const handleProceedWithConflict = () => {
    setShowConflictWarning(false);
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

          {/* Conflict Warning */}
          {showConflictWarning && (
            <div className="conflict-warning">
              <div className="warning-header">
                <AlertCircle className="warning-icon" />
                <h4>Team Member Conflicts Detected</h4>
              </div>
              <p>The following team members will also be on leave during your requested dates:</p>
              <div className="conflict-list">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-item">
                    <div className="conflict-details">
                      <strong>{conflict.name}</strong>
                      <span className="conflict-dates">
                        {new Date(conflict.startDate).toLocaleDateString()} - 
                        {new Date(conflict.endDate).toLocaleDateString()}
                      </span>
                      <span className={`conflict-status ${conflict.status}`}>
                        {conflict.status} {conflict.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="conflict-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowConflictWarning(false)}
                >
                  Choose Different Dates
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleProceedWithConflict}
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          )}

          {!showConflictWarning && (
            <div className="form-actions">
              <button type="button" onClick={onCancel} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Submit Request
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LeaveBoard;
