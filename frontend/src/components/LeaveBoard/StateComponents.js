import React from 'react';
import { AlertCircle, RefreshCw, Plus, Users, Calendar, FileText } from 'lucide-react';

// Error State Component
export const ErrorState = ({ title, message, onRetry, retryText = "Try Again" }) => (
  <div className="error-state">
    <AlertCircle className="error-icon" />
    <h3 className="error-title">{title}</h3>
    <p className="error-message">{message}</p>
    {onRetry && (
      <button className="error-retry" onClick={onRetry}>
        <RefreshCw size={16} style={{ marginRight: '8px' }} />
        {retryText}
      </button>
    )}
  </div>
);

// Empty State Component
export const EmptyState = ({ 
  icon: Icon = FileText,
  title, 
  message, 
  actionText, 
  onAction 
}) => (
  <div className="empty-state">
    <Icon className="empty-icon" />
    <h3 className="empty-title">{title}</h3>
    <p className="empty-message">{message}</p>
    {onAction && actionText && (
      <button className="empty-action" onClick={onAction}>
        <Plus size={16} />
        {actionText}
      </button>
    )}
  </div>
);

// Specific Empty States
export const EmptyLeaveRequests = ({ onRequestLeave }) => (
  <EmptyState
    icon={Calendar}
    title="No Leave Requests"
    message="You haven't submitted any leave requests yet. Click below to request your first leave."
    actionText="Request Leave"
    onAction={onRequestLeave}
  />
);

export const EmptyTeamMembers = ({ onAddMember }) => (
  <EmptyState
    icon={Users}
    title="No Team Members"
    message="No team members found. Add members to start managing team leave requests."
    actionText="Add Team Member"
    onAction={onAddMember}
  />
);

export const EmptyPendingRequests = () => (
  <EmptyState
    icon={FileText}
    title="No Pending Requests"
    message="All leave requests have been processed. Great job staying on top of things!"
    actionText={null}
    onAction={null}
  />
);

export const EmptyPublicHolidays = () => (
  <EmptyState
    icon={Calendar}
    title="No Public Holidays"
    message="No public holidays are scheduled for the current period."
    actionText={null}
    onAction={null}
  />
);

export const EmptyWhoIsOff = () => (
  <EmptyState
    icon={Users}
    title="Everyone's In!"
    message="No one is on leave today. Full team strength available."
    actionText={null}
    onAction={null}
  />
);

// Loading Component
export const LoadingSpinner = ({ size = 40 }) => (
  <div className="loading-spinner" style={{ width: size, height: size }} />
);

// Notification Component
export const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  duration = 5000 
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

// Data fetching hook with error handling
export const useFetchWithError = (fetchFunction, dependencies = []) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
