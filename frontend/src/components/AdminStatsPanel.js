/**
 * Admin Stats Panel Component
 * Displays statistics and analytics for feature requests
 */

import React from 'react';
import './AdminStatsPanel.css';

const AdminStatsPanel = ({ stats }) => {
  const {
    total_requests = 0,
    pending_requests = 0,
    in_review_requests = 0,
    approved_requests = 0,
    in_progress_requests = 0,
    completed_requests = 0,
    rejected_requests = 0,
    on_hold_requests = 0,
    total_votes = 0,
    total_comments = 0,
    top_categories = [],
    recent_activity = [],
  } = stats;

  const statusData = [
    { label: 'Pending', count: pending_requests, color: '#fbbf24', percentage: 0 },
    { label: 'In Review', count: in_review_requests, color: '#60a5fa', percentage: 0 },
    { label: 'Approved', count: approved_requests, color: '#4ade80', percentage: 0 },
    { label: 'In Progress', count: in_progress_requests, color: '#a78bfa', percentage: 0 },
    { label: 'Completed', count: completed_requests, color: '#10b981', percentage: 0 },
    { label: 'Rejected', count: rejected_requests, color: '#f87171', percentage: 0 },
    { label: 'On Hold', count: on_hold_requests, color: '#94a3b8', percentage: 0 },
  ];

  // Calculate percentages
  statusData.forEach(item => {
    item.percentage = total_requests > 0 ? (item.count / total_requests) * 100 : 0;
  });

  const completionRate = total_requests > 0 
    ? ((completed_requests / total_requests) * 100).toFixed(1)
    : 0;

  const actionableRequests = pending_requests + in_review_requests + approved_requests + in_progress_requests;

  return (
    <div className="admin-stats-panel">
      <div className="stats-header">
        <h2>Dashboard Overview</h2>
        <div className="refresh-info">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card overview-card">
          <div className="stat-header">
            <h3>Overview</h3>
          </div>
          <div className="stat-content">
            <div className="overview-metrics">
              <div className="metric">
                <div className="metric-value">{total_requests}</div>
                <div className="metric-label">Total Requests</div>
              </div>
              <div className="metric">
                <div className="metric-value">{actionableRequests}</div>
                <div className="metric-label">Actionable</div>
              </div>
              <div className="metric">
                <div className="metric-value">{completionRate}%</div>
                <div className="metric-label">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card engagement-card">
          <div className="stat-header">
            <h3>Engagement</h3>
          </div>
          <div className="stat-content">
            <div className="engagement-metrics">
              <div className="metric">
                <div className="metric-value">{total_votes}</div>
                <div className="metric-label">Total Votes</div>
              </div>
              <div className="metric">
                <div className="metric-value">{total_comments}</div>
                <div className="metric-label">Total Comments</div>
              </div>
              <div className="metric">
                <div className="metric-value">
                  {total_requests > 0 ? (total_votes / total_requests).toFixed(1) : 0}
                </div>
                <div className="metric-label">Avg Votes/Request</div>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card status-breakdown-card">
          <div className="stat-header">
            <h3>Status Breakdown</h3>
          </div>
          <div className="stat-content">
            <div className="status-list">
              {statusData.map(status => (
                <div key={status.label} className="status-item">
                  <div className="status-info">
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="status-label">{status.label}</span>
                  </div>
                  <div className="status-metrics">
                    <span className="status-count">{status.count}</span>
                    <span className="status-percentage">
                      ({status.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="status-bar">
                    <div 
                      className="status-fill"
                      style={{ 
                        width: `${status.percentage}%`,
                        backgroundColor: status.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {top_categories && top_categories.length > 0 && (
          <div className="stat-card categories-card">
            <div className="stat-header">
              <h3>Top Categories</h3>
            </div>
            <div className="stat-content">
              <div className="categories-list">
                {top_categories.slice(0, 5).map((category, index) => (
                  <div key={category.category} className="category-item">
                    <div className="category-rank">#{index + 1}</div>
                    <div className="category-info">
                      <div className="category-name">
                        {category.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="category-count">
                        {category.count} request{category.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {recent_activity && recent_activity.length > 0 && (
          <div className="stat-card activity-card">
            <div className="stat-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="stat-content">
              <div className="activity-list">
                {recent_activity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'status_change' && '🔄'}
                      {activity.type === 'new_request' && '💡'}
                      {activity.type === 'comment' && '💬'}
                      {activity.type === 'vote' && '👍'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-description">
                        {activity.description}
                      </div>
                      <div className="activity-time">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {actionableRequests > 0 && (
        <div className="action-needed-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>{actionableRequests} requests</strong> need attention
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatsPanel;
