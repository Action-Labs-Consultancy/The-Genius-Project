import React, { useState, useEffect } from 'react';
import './LeaveBoard.css';
import { Users, Search, Filter, CheckCircle, XCircle, Clock, Eye, MessageSquare, X, Plus, Calendar } from 'lucide-react';
import { calculateWorkingDays, isWeekend, isPublicHoliday } from './utils';
import { API_BASE_URL } from '../../config/api';

const ManageTeamView = ({ 
  allRequests, 
  teamMembers: initialTeamMembers, 
  onApproveReject,
  getLeaveTypeColor,
  getStatusColor,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  dateRange,
  setDateRange,
  publicHolidays = [],
  isHR
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [showExtraWorkdaysModal, setShowExtraWorkdaysModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [extraWorkdayDate, setExtraWorkdayDate] = useState('');
  const [extraWorkdayReason, setExtraWorkdayReason] = useState('');
  const [extraWorkdays, setExtraWorkdays] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);

  // Fetch team members if user is HR
  useEffect(() => {
    async function fetchTeamMembers() {
      if (isHR) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/leave/team-members`);
          if (res.ok) {
            const members = await res.json();
            setTeamMembers(members);
          }
        } catch (e) {
          setTeamMembers([]);
        }
      }
    }
    fetchTeamMembers();
  }, [isHR]);

  // Only show if user is HR
  if (!isHR) {
    return (
      <div className="access-denied">
        <h3>Access Denied</h3>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  const filteredRequests = allRequests?.filter(request => {
    const matchesSearch = !searchTerm || 
      (request.employee_name || request.employee || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.leave_type || request.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    const matchesDate = !dateRange.start || !dateRange.end || 
      (new Date(request.start_date || request.startDate) >= new Date(dateRange.start) &&
       new Date(request.end_date || request.endDate) <= new Date(dateRange.end));
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  const getEmployeeName = member => member.name || member.employee_name || member.email || member.id;
  const filteredEmployees = teamMembers && Array.isArray(teamMembers)
    ? teamMembers.filter(member =>
        getEmployeeName(member).toLowerCase().includes(employeeSearch.toLowerCase())
      )
    : [];

  const statusStats = {
    total: allRequests?.length || 0,
    pending: allRequests?.filter(r => r.status === 'pending').length || 0,
    approved: allRequests?.filter(r => r.status === 'approved').length || 0,
    rejected: allRequests?.filter(r => r.status === 'rejected').length || 0
  };

  const handleApprove = (request) => {
    onApproveReject(request.id, 'approved', '');
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = () => {
    if (selectedRequest && rejectionComment.trim()) {
      onApproveReject(selectedRequest.id, 'rejected', rejectionComment.trim());
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionComment('');
    }
  };

  const handleExtraWorkdaySubmit = async () => {
    if (selectedEmployee && extraWorkdayDate && extraWorkdayReason.trim()) {
      // Save to backend
      try {
        await fetch(`${API_BASE_URL}/api/leave/compensation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: selectedEmployee.id,
            date: extraWorkdayDate,
            reason: extraWorkdayReason.trim(),
            comment: `Granted by HR on ${extraWorkdayDate}`,
            added_by: 'HR'
          })
        });
      } catch (e) {
        // Optionally show error
      }
      // Add to local state for immediate UI feedback
      const workday = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        date: extraWorkdayDate,
        reason: extraWorkdayReason.trim(),
        addedBy: 'HR',
        addedDate: new Date().toISOString()
      };
      setExtraWorkdays([...extraWorkdays, workday]);
      setShowExtraWorkdaysModal(false);
      setSelectedEmployee(null);
      setExtraWorkdayDate('');
      setExtraWorkdayReason('');
    }
  };

  const handleEmployeeSearchChange = (e) => {
    setEmployeeSearch(e.target.value);
    setSearchDropdownVisible(true);
    // Only clear selectedEmployee if input is cleared
    if (e.target.value === "") {
      setSelectedEmployee(null);
    }
  };

  const handleEmployeeSelect = (member) => {
    setSelectedEmployee(member);
    setEmployeeSearch(getEmployeeName(member));
    setSearchDropdownVisible(false);
  };

  const RejectModal = () => (
    <div className="modal-overlay">
      <div className="reject-modal">
        <div className="modal-header">
          <h3>Reject Leave Request</h3>
          <button className="close-btn" onClick={() => setShowRejectModal(false)}>
            <X />
          </button>
        </div>
        <div className="modal-content">
          <div className="request-details">
            <p><strong>Employee:</strong> {selectedRequest?.employee_name || selectedRequest?.employee}</p>
            <p><strong>Leave Type:</strong> {selectedRequest?.leave_type || selectedRequest?.type}</p>
            <p><strong>Duration:</strong> {selectedRequest?.start_date || selectedRequest?.startDate} to {selectedRequest?.end_date || selectedRequest?.endDate}</p>
            <p><strong>Working Days:</strong> {calculateWorkingDays(selectedRequest?.start_date || selectedRequest?.startDate, selectedRequest?.end_date || selectedRequest?.endDate, publicHolidays)}</p>
          </div>
          <div className="rejection-reason">
            <label>Reason for Rejection:</label>
            <textarea
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="Please provide a reason for rejecting this request..."
              required
            />
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="secondary-btn" 
            onClick={() => setShowRejectModal(false)}
          >
            Cancel
          </button>
          <button 
            className="danger-btn" 
            onClick={handleRejectSubmit}
            disabled={!rejectionComment.trim()}
          >
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );

  const ExtraWorkdaysModal = () => (
    <div className="modal-overlay">
      <div className="extra-workdays-modal">
        <div className="modal-header">
          <h3>Mark Extra Workday</h3>
          <button type="button" className="close-btn" onClick={() => setShowExtraWorkdaysModal(false)}>
            <X />
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Employee:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search employee name..."
                value={employeeSearch}
                onChange={handleEmployeeSearchChange}
                className="modern-input"
                style={{ marginBottom: "8px" }}
                autoComplete="off"
                onFocus={() => setSearchDropdownVisible(true)}
              />
              {employeeSearch && (
                <button
                  type="button"
                  style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', color: '#FFD600', cursor: 'pointer', fontSize: 18 }}
                  onClick={() => {
                    setEmployeeSearch("");
                    setSelectedEmployee(null);
                    setSearchDropdownVisible(true);
                  }}
                  aria-label="Clear search"
                >
                  <X />
                </button>
              )}
            </div>
            {searchDropdownVisible && employeeSearch && (
              <div className="employee-dropdown-list">
                {filteredEmployees?.length > 0 ? (
                  filteredEmployees.map(member => (
                    <div
                      key={member.id}
                      className={`employee-dropdown-item${selectedEmployee?.id === member.id ? ' selected' : ''}`}
                      onMouseDown={e => {
                        e.preventDefault();
                        handleEmployeeSelect(member);
                      }}
                    >
                      {getEmployeeName(member)}
                    </div>
                  ))
                ) : (
                  <div className="employee-dropdown-item empty">No employees found</div>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={extraWorkdayDate}
              onChange={(e) => setExtraWorkdayDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Reason:</label>
            <textarea
              value={extraWorkdayReason}
              onChange={(e) => setExtraWorkdayReason(e.target.value)}
              placeholder="Reason for working on weekend/holiday..."
              required
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button"
            className="secondary-btn"
            onClick={() => setShowExtraWorkdaysModal(false)}
          >
            Cancel
          </button>
          <button type="button"
            className="primary-btn"
            onClick={handleExtraWorkdaySubmit}
            disabled={!selectedEmployee || !extraWorkdayDate || !extraWorkdayReason.trim()}
          >
            Mark Workday
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="manage-team-view">
      <div className="manage-header modern-header">
        <div className="header-content">
          <h2 className="header-title">Team Leave Management</h2>
          <div className="header-underline" />
        </div>
        <div className="header-actions">
          <button 
            className="primary-btn modern-btn"
            onClick={() => setShowExtraWorkdaysModal(true)}
          >
            <Plus className="btn-icon" />
            Mark Extra Workday
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="manage-stats modern-stats-grid">
        <div className="stat-card modern-stat-card">
          <div className="stat-number">{statusStats.total}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card modern-stat-card pending">
          <div className="stat-number">{statusStats.pending}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card modern-stat-card approved">
          <div className="stat-number">{statusStats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card modern-stat-card rejected">
          <div className="stat-number">{statusStats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="manage-filters modern-filters">
        <div className="filter-group modern-filter-group">
          <div className="search-input modern-search-input">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search employees or leave types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-input"
            />
          </div>
        </div>
        <div className="filter-group modern-filter-group">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select modern-input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="filter-group modern-filter-group">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="date-filter modern-input"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="date-filter modern-input"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="manage-content">
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-icon" />
            <h3>No requests found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="manage-team-clean">
            {filteredRequests.length === 0 ? (
              <div className="empty-state">No requests found</div>
            ) : (
              filteredRequests.map((request, idx) => (
                <div key={request.id || request._id} className="request-card-clean">
                  <div className="request-employee-clean">{request.employee_name || request.employee}</div>
                  <div className="request-type-clean">{request.leave_type || request.type}</div>
                  <div className="request-dates-clean">{new Date(request.start_date || request.startDate).toLocaleDateString()} - {new Date(request.end_date || request.endDate).toLocaleDateString()}</div>
                  <div className={`request-status-clean ${request.status}`}>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</div>
                  {request.status === 'pending' && (
                    <div className="request-actions-clean">
                      <button className="action-btn-clean approve" onClick={() => handleApprove(request)}>
                        <CheckCircle className="btn-icon" />
                        Approve
                      </button>
                      <button className="action-btn-clean reject" onClick={() => handleRejectClick(request)}>
                        <XCircle className="btn-icon" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Extra Workdays Report (for HR) - Improved design and always visible for HR */}
      {isHR && (
        <div className="extra-workdays-report modern">
          <h3>Extra Workdays Marked</h3>
          <div className="report-content">
            {extraWorkdays.length === 0 ? (
              <div className="empty-state">No extra workdays marked yet.</div>
            ) : (
              extraWorkdays.map((workday, idx) => (
                <div key={idx} className="workday-item-modern">
                  <div className="workday-date-modern">{workday.date}</div>
                  <div className="workday-employee-modern">{workday.employeeName}</div>
                  <div className="workday-reason-modern">{workday.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {showRejectModal && <RejectModal />}
      {showExtraWorkdaysModal && <ExtraWorkdaysModal />}
    </div>
  );
};

export default ManageTeamView;
