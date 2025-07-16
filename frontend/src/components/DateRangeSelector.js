import React, { useState } from 'react';

const DateRangeSelector = ({ dateRange, onDateRangeChange }) => {
  const [isCustomRange, setIsCustomRange] = useState(false);

  const presetRanges = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Month', days: 'month' },
    { label: 'This Year', days: 'year' }
  ];

  const handlePresetRange = (preset) => {
    const today = new Date();
    let fromDate;

    if (preset.days === 'month') {
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset.days === 'year') {
      fromDate = new Date(today.getFullYear(), 0, 1);
    } else {
      fromDate = new Date(today.getTime() - (preset.days * 24 * 60 * 60 * 1000));
    }

    const newRange = {
      from: fromDate.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };

    onDateRangeChange(newRange);
    setIsCustomRange(false);
  };

  const handleCustomDateChange = (field, value) => {
    const newRange = {
      ...dateRange,
      [field]: value
    };
    onDateRangeChange(newRange);
  };

  const formatDateRange = () => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    return `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;
  };

  return (
    <div className="date-range-selector">
      <div className="date-range-header">
        <h3>Date Range Filter</h3>
        <span className="current-range">{formatDateRange()}</span>
      </div>

      <div className="date-range-controls">
        {/* Preset Ranges */}
        <div className="preset-ranges">
          {presetRanges.map((preset, index) => (
            <button
              key={index}
              className="preset-button"
              onClick={() => handlePresetRange(preset)}
            >
              {preset.label}
            </button>
          ))}
          <button
            className={`preset-button ${isCustomRange ? 'active' : ''}`}
            onClick={() => setIsCustomRange(!isCustomRange)}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Date Inputs */}
        {isCustomRange && (
          <div className="custom-date-inputs">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                max={dateRange.to}
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                min={dateRange.from}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="date-range-stats">
        <div className="stat">
          <span className="stat-label">Days Selected:</span>
          <span className="stat-value">
            {Math.ceil((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24)) + 1}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Period:</span>
          <span className="stat-value">
            {Math.ceil((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24)) <= 7 ? 'Weekly' :
             Math.ceil((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24)) <= 31 ? 'Monthly' : 'Extended'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;
