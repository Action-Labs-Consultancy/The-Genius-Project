/**
 * Notification Bell Component
 * Shows notification count and dropdown with recent notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import { featureRequestApi } from '../api/featureRequestApi';
import './NotificationBell.css';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  // Load notifications
  const loadNotifications = async (unreadOnly = false) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await featureRequestApi.getNotifications(10);
      
      if (response.success) {
        const notifs = response.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    loadNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications(); // Refresh when opening
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        await featureRequestApi.markNotificationRead(notification.id);
        
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notification.id 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Navigate to the feature request if applicable
      if (notification.feature_request_id) {
        // You can implement navigation to specific request here
        console.log('Navigate to request:', notification.feature_request_id);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await featureRequestApi.markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'feature_request_submitted': '💡',
      'feature_request_approved': '✅',
      'feature_request_rejected': '❌',
      'feature_request_comment': '💬',
      'feature_request_vote': '👍',
      'feature_request_status_changed': '🔄',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className={`bell-button ${unreadCount > 0 ? 'has-unread' : ''}`}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="mark-all-read-btn"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="dropdown-content">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>Failed to load notifications</p>
                <button 
                  onClick={() => loadNotifications()}
                  className="retry-btn"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown-footer">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to full notifications page if it exists
                console.log('View all notifications');
              }}
              className="view-all-btn"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
