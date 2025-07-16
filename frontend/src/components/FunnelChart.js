import React, { useState } from 'react';
import './FunnelChart.css';

const FunnelChart = ({ data }) => {
  const [hoveredStage, setHoveredStage] = useState(null);

  const funnel = data || {};
  const stages = [
    { name: 'Store Visits', value: funnel.storeVisits || 0, color: '#3b82f6' },
    { name: 'Installs', value: funnel.installs || 0, color: '#10b981' },
    { name: 'Onboarded', value: funnel.onboard || 0, color: '#f59e0b' },
    { name: 'Linked Accounts', value: funnel.linked || 0, color: '#8b5cf6' },
    { name: 'Disbursed', value: funnel.disbursed || 0, color: '#ef4444' }
  ];

  const maxValue = Math.max(...stages.map(s => s.value));

  const getConversionRate = (currentIndex) => {
    if (currentIndex === 0) return 100;
    const previousValue = stages[currentIndex - 1].value;
    const currentValue = stages[currentIndex].value;
    return previousValue > 0 ? ((currentValue / previousValue) * 100).toFixed(1) : 0;
  };

  const getWidth = (value) => {
    return maxValue > 0 ? Math.max((value / maxValue) * 100, 10) : 10;
  };

  return (
    <div className="funnel-chart">
      <div className="funnel-stages">
        {stages.map((stage, index) => (
          <div
            key={index}
            className="funnel-stage"
            onMouseEnter={() => setHoveredStage(index)}
            onMouseLeave={() => setHoveredStage(null)}
          >
            <div className="funnel-stage-header">
              <span className="stage-name">{stage.name}</span>
              <span className="stage-value">{stage.value.toLocaleString()}</span>
            </div>
            
            <div className="funnel-bar-container">
              <div
                className="funnel-bar"
                style={{
                  width: `${getWidth(stage.value)}%`,
                  backgroundColor: stage.color,
                  opacity: hoveredStage === index ? 1 : 0.8
                }}
              />
            </div>
            
            <div className="funnel-metrics">
              <span className="conversion-rate">
                {getConversionRate(index)}% conversion
              </span>
              {index > 0 && (
                <span className="drop-off">
                  -{(stages[index - 1].value - stage.value).toLocaleString()} drop-off
                </span>
              )}
            </div>
            
            {hoveredStage === index && (
              <div className="funnel-tooltip">
                <div className="tooltip-content">
                  <h4>{stage.name}</h4>
                  <p><strong>Count:</strong> {stage.value.toLocaleString()}</p>
                  <p><strong>Conversion Rate:</strong> {getConversionRate(index)}%</p>
                  {index > 0 && (
                    <p><strong>From Previous:</strong> {((stage.value / stages[index - 1].value) * 100).toFixed(1)}%</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="funnel-summary">
        <div className="funnel-stat">
          <span className="stat-label">Overall Conversion</span>
          <span className="stat-value">
            {maxValue > 0 ? ((stages[stages.length - 1].value / maxValue) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="funnel-stat">
          <span className="stat-label">Total Processed</span>
          <span className="stat-value">{maxValue.toLocaleString()}</span>
        </div>
        <div className="funnel-stat">
          <span className="stat-label">Final Outcome</span>
          <span className="stat-value">{stages[stages.length - 1].value.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default FunnelChart;
