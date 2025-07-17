import React from 'react';

// Loading skeleton components for better UX
export const StatCardSkeleton = () => (
  <div className="stat-card skeleton">
    <div className="stat-icon skeleton-icon"></div>
    <div className="stat-content">
      <div className="skeleton-text skeleton-title"></div>
      <div className="skeleton-text skeleton-subtitle"></div>
    </div>
  </div>
);

export const LeaveRequestSkeleton = () => (
  <div className="leave-request-item skeleton">
    <div className="request-header">
      <div className="skeleton-text skeleton-name"></div>
      <div className="skeleton-badge"></div>
    </div>
    <div className="request-details">
      <div className="skeleton-text skeleton-date"></div>
      <div className="skeleton-text skeleton-reason"></div>
    </div>
  </div>
);

export const CalendarSkeleton = () => (
  <div className="calendar-skeleton">
    <div className="calendar-header skeleton">
      <div className="skeleton-text skeleton-month"></div>
      <div className="skeleton-buttons">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
    <div className="calendar-grid">
      {[...Array(42)].map((_, i) => (
        <div key={i} className="calendar-day skeleton-day"></div>
      ))}
    </div>
  </div>
);

export const TeamMemberSkeleton = () => (
  <div className="team-member-item skeleton">
    <div className="member-avatar skeleton-avatar"></div>
    <div className="member-info">
      <div className="skeleton-text skeleton-name"></div>
      <div className="skeleton-text skeleton-department"></div>
    </div>
    <div className="member-actions">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="dashboard-view">
    <div className="stats-grid">
      {[...Array(4)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    <div className="dashboard-content">
      <div className="dashboard-section">
        <div className="section-header">
          <div className="skeleton-text skeleton-title"></div>
        </div>
        <div className="requests-list">
          {[...Array(3)].map((_, i) => (
            <LeaveRequestSkeleton key={i} />
          ))}
        </div>
      </div>
      
      <div className="dashboard-section">
        <div className="section-header">
          <div className="skeleton-text skeleton-title"></div>
        </div>
        <CalendarSkeleton />
      </div>
    </div>
  </div>
);

export const LeavesViewSkeleton = () => (
  <div className="leaves-view">
    <div className="leaves-header">
      <div className="skeleton-text skeleton-title"></div>
      <div className="header-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
    
    <div className="leaves-content">
      <div className="leaves-list">
        {[...Array(5)].map((_, i) => (
          <LeaveRequestSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export const ManageTeamSkeleton = () => (
  <div className="manage-team-view">
    <div className="team-header">
      <div className="skeleton-text skeleton-title"></div>
      <div className="header-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
    
    <div className="team-content">
      <div className="team-list">
        {[...Array(6)].map((_, i) => (
          <TeamMemberSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
