import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after duration
    const duration = notification.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message, title = 'Success') => {
    addNotification({
      type: 'success',
      title,
      message,
      duration: 4000
    });
  };

  const showError = (message, title = 'Error') => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 6000
    });
  };

  const showWarning = (message, title = 'Warning') => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000
    });
  };

  const showInfo = (message, title = 'Info') => {
    addNotification({
      type: 'info',
      title,
      message,
      duration: 4000
    });
  };

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContext = React.createContext();

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="notification-icon" />;
      case 'error':
        return <XCircle className="notification-icon" />;
      case 'warning':
        return <AlertCircle className="notification-icon" />;
      case 'info':
      default:
        return <Info className="notification-icon" />;
    }
  };

  const getTypeClass = () => {
    switch (notification.type) {
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      case 'warning':
        return 'notification-warning';
      case 'info':
      default:
        return 'notification-info';
    }
  };

  return (
    <div
      className={`notification ${getTypeClass()} ${isVisible ? 'notification-visible' : ''}`}
    >
      <div className="notification-content">
        <div className="notification-header">
          {getIcon()}
          <span className="notification-title">{notification.title}</span>
          <button className="notification-close" onClick={handleRemove}>
            <X size={16} />
          </button>
        </div>
        <p className="notification-message">{notification.message}</p>
        {notification.timestamp && (
          <span className="notification-timestamp">
            {notification.timestamp.toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="notification-progress" />
    </div>
  );
};

export default NotificationProvider;
