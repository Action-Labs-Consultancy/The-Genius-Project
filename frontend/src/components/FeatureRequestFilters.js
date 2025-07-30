/**
 * Feature Request Filters Component
 * Provides filtering and sorting controls for the Ice Box
 */

import React, { useState } from 'react';
import './FeatureRequestFilters.css';

const FeatureRequestFilters = ({ filters, onFilterChange, totalCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'enhancement', label: 'Enhancement' },
    { value: 'bug_fix', label: 'Bug Fix' },
    { value: 'new_feature', label: 'New Feature' },
    { value: 'ui_ux', label: 'UI/UX Improvement' },
    { value: 'performance', label: 'Performance' },
    { value: 'integration', label: 'Integration' },
    { value: 'other', label: 'Other' },
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'on_hold', label: 'On Hold' },
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'votes', label: 'Vote Score' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'comment_count', label: 'Comments' },
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      status: '',
      category: '',
      priority: '',
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  };

  const hasActiveFilters = filters.status || filters.category || filters.priority || filters.search;

  return (
    <div className="feature-request-filters">
      <div className="filters-header">
        <div className="filters-info">
          <h3>Filter & Sort</h3>
          <span className="results-count">
            {totalCount} result{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="filters-actions">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="toggle-filters-btn"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search titles and descriptions..."
                className="filter-input"
              />
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="filter-select"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="filter-select"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Order</label>
              <select
                value={filters.sort_order}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                className="filter-select"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && !isExpanded && (
        <div className="active-filters-summary">
          <span className="summary-label">Active filters:</span>
          {filters.search && (
            <span className="filter-tag">
              Search: "{filters.search}"
              <button onClick={() => handleFilterChange('search', '')}>×</button>
            </span>
          )}
          {filters.status && (
            <span className="filter-tag">
              Status: {statuses.find(s => s.value === filters.status)?.label}
              <button onClick={() => handleFilterChange('status', '')}>×</button>
            </span>
          )}
          {filters.category && (
            <span className="filter-tag">
              Category: {categories.find(c => c.value === filters.category)?.label}
              <button onClick={() => handleFilterChange('category', '')}>×</button>
            </span>
          )}
          {filters.priority && (
            <span className="filter-tag">
              Priority: {priorities.find(p => p.value === filters.priority)?.label}
              <button onClick={() => handleFilterChange('priority', '')}>×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FeatureRequestFilters;
