import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import './ModernNotification.css';

const ModernNotification = ({ 
  isOpen, 
  onClose, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  title, 
  message, 
  autoClose = true, 
  autoCloseDelay = 5000,
  actions = []
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="notification-icon success" />;
      case 'error':
        return <AlertCircle className="notification-icon error" />;
      case 'warning':
        return <AlertTriangle className="notification-icon warning" />;
      default:
        return <Info className="notification-icon info" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={handleClose}>
      <div 
        className={`modern-notification ${type} ${isVisible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-header">
          <div className="notification-title-section">
            {getIcon()}
            <div className="notification-text">
              {title && <h3 className="notification-title">{title}</h3>}
              {message && <p className="notification-message">{message}</p>}
            </div>
          </div>
          <button className="notification-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        {actions.length > 0 && (
          <div className="notification-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`notification-btn ${action.primary ? 'primary' : 'secondary'}`}
                onClick={() => {
                  action.onClick();
                  if (action.closeAfterClick !== false) {
                    handleClose();
                  }
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for easy usage
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (config) => {
    setNotification({
      id: Date.now(),
      ...config,
      isOpen: true
    });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const notificationProps = notification ? {
    ...notification,
    onClose: hideNotification
  } : null;

  return {
    notification: notificationProps,
    showNotification,
    hideNotification,
    NotificationComponent: notificationProps ? <ModernNotification {...notificationProps} /> : null
  };
};

export default ModernNotification;
