// Utility functions for leave calculations
export const calculateWorkingDays = (startDate, endDate, publicHolidays = []) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  // Create a set of holiday dates for faster lookup
  const holidayDates = new Set(
    publicHolidays.map(holiday => new Date(holiday.date).toDateString())
  );
  
  // Iterate through each day in the range
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    
    // Skip weekends (Friday=5, Saturday=6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      continue;
    }
    
    // Skip public holidays
    if (holidayDates.has(date.toDateString())) {
      continue;
    }
    
    workingDays++;
  }
  
  return workingDays;
};

export const isWeekend = (date) => {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
};

export const isPublicHoliday = (date, publicHolidays = []) => {
  const dateString = new Date(date).toDateString();
  return publicHolidays.some(holiday => 
    new Date(holiday.date).toDateString() === dateString
  );
};

export const formatLeaveType = (type) => {
  if (!type) return 'Leave';
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
};

export const getStatusColor = (status) => {
  const colors = {
    approved: '#4caf50',
    rejected: '#f44336', 
    pending: '#ff9800',
    default: '#666'
  };
  return colors[status] || colors.default;
};

export const getLeaveTypeColor = (type) => {
  const colors = {
    vacation: '#2196F3',
    sick: '#f44336',
    personal: '#9C27B0',
    maternity: '#4caf50',
    unpaid: '#ff9800',
    emergency: '#ff5722',
    default: '#2196F3'
  };
  return colors[type] || colors.default;
};
