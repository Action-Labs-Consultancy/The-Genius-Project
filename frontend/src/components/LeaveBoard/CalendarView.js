import React, { useState, useMemo } from 'react';
import './LeaveBoard.css';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock } from 'lucide-react';

const CalendarView = ({ 
  teamLeaves, 
  allRequests, 
  publicHolidays, 
  user, 
  isHR,
  getLeaveTypeColor = (type) => {
    const colors = {
      vacation: '#2196F3',
      sick: '#f44336',
      personal: '#9C27B0',
      emergency: '#ff9800',
      default: '#2196F3'
    };
    return colors[type] || colors.default;
  }
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find leaves for this date
      const leavesForDate = allRequests?.filter(request => {
        const startDate = new Date(request.start_date || request.startDate);
        const endDate = new Date(request.end_date || request.endDate);
        return date >= startDate && date <= endDate && request.status === 'approved';
      }) || [];
      
      // Check if it's a weekend (Friday=5, Saturday=6)
      const isWeekend = date.getDay() === 5 || date.getDay() === 6;
      
      // Check if it's a public holiday
      const isHoliday = publicHolidays.some(holiday => 
        new Date(holiday.date).toDateString() === date.toDateString()
      );
      
      days.push({
        day,
        date: dateStr,
        isWeekend,
        isHoliday,
        leaves: leavesForDate,
        hasLeaves: leavesForDate.length > 0
      });
    }
    
    return days;
  }, [currentDate, allRequests, publicHolidays]);

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getLeaveTooltip = (leaves) => {
    if (leaves.length === 0) return '';
    
    const names = leaves.map(leave => {
      const name = leave.employee_name || leave.user?.name || 'Unknown';
      const type = leave.leave_type || leave.type || 'Leave';
      return `${name} (${type})`;
    });
    
    return names.join('\\n');
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-view wide-calendar">
      <div style={{marginTop: '40px'}}>
        <div className="calendar-header">
          <button 
            className="nav-btn" 
            onClick={() => navigateMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <h2>{formatMonth(currentDate)}</h2>
          <button 
            className="nav-btn" 
            onClick={() => navigateMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="calendar-container wide">
        <div className="calendar-grid wide">
          {/* Weekday headers */}
          {weekdays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {/* Calendar days */}
          {calendarData.map((dayData, index) => (
            <div
              key={index}
              className={`calendar-day ${!dayData ? 'empty' : ''} ${dayData?.isWeekend ? 'weekend' : ''} ${dayData?.hasLeaves ? 'has-leave' : ''} ${dayData?.isHoliday ? 'holiday' : ''}`}
              onMouseEnter={() => setHoveredDay(dayData)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {dayData && (
                <>
                  <div className="day-number">{dayData.day}</div>
                  {dayData.hasLeaves && (
                    <div className="leave-indicators">
                      {dayData.leaves.slice(0, 3).map((leave, idx) => (
                        <div 
                          key={idx}
                          className="leave-indicator"
                          style={{ backgroundColor: getLeaveTypeColor?.(leave.leave_type || leave.type) || '#2196F3' }}
                        />
                      ))}
                      {dayData.leaves.length > 3 && (
                        <div className="more-leaves">+{dayData.leaves.length - 3}</div>
                      )}
                    </div>
                  )}
                  {dayData.isHoliday && (
                    <div className="holiday-indicator">H</div>
                  )}
                  {/* Tooltip on hover only, not below calendar */}
                  {hoveredDay && hoveredDay.day === dayData.day && hoveredDay.date === dayData.date && hoveredDay.leaves.length > 0 && (
                    <div className="leave-tooltip animated">
                      <div className="tooltip-header">
                        <Calendar className="tooltip-icon" />
                        <span>On Leave - {new Date(hoveredDay.date).toLocaleDateString()}</span>
                      </div>
                      <div className="tooltip-content">
                        {hoveredDay.leaves.map((leave, index) => (
                          <div key={index} className="tooltip-leave-item">
                            <div className="leave-avatar">
                              <div className="avatar-circle" style={{ backgroundColor: getLeaveTypeColor(leave.leave_type || leave.type) }}>
                                {(leave.employee_name || leave.user?.name || 'U').charAt(0)}
                              </div>
                            </div>
                            <div className="leave-info">
                              <div className="leave-name">{leave.employee_name || leave.user?.name || 'Unknown'}</div>
                              <div className="leave-type">{leave.leave_type || leave.type || 'Leave'}</div>
                              <div className="leave-duration">{new Date(leave.start_date || leave.startDate).toLocaleDateString()} - {new Date(leave.end_date || leave.endDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Calendar Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color on-leave"></div>
          <span className="legend-text">On Leave</span>
        </div>
        <div className="legend-item">
          <div className="legend-color weekend"></div>
          <span className="legend-text">Weekend</span>
        </div>
        <div className="legend-item">
          <div className="legend-color public-holiday"></div>
          <span className="legend-text">Public Holiday</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
