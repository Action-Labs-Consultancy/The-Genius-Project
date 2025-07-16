import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import './FunnelChart.css';

const FunnelChart = ({ data }) => {
  const [hoveredStep, setHoveredStep] = useState(null);

  // Calculate funnel data from the provided data
  const calculateFunnelData = () => {
    if (!data || !Array.isArray(data)) return [];

    const totals = data.reduce((acc, item) => {
      acc.storeVisits += item.storeVisits || 0;
      acc.installs += item.installs || 0;
      acc.onboarded += item.onboarded || 0;
      acc.applications += item.totalAdvanceApplications || 0;
      acc.disbursed += item.totalDisbursed || 0;
      return acc;
    }, {
      storeVisits: 0,
      installs: 0,
      onboarded: 0,
      applications: 0,
      disbursed: 0
    });

    return [
      {
        name: 'Store Visits',
        value: totals.storeVisits,
        percentage: 100,
        color: '#3b82f6',
        icon: '🏪',
        description: 'Users who visited our store'
      },
      {
        name: 'Installs',
        value: totals.installs,
        percentage: totals.storeVisits > 0 ? (totals.installs / totals.storeVisits) * 100 : 0,
        color: '#10b981',
        icon: '📱',
        description: 'App installations completed'
      },
      {
        name: 'Onboarded',
        value: totals.onboarded,
        percentage: totals.installs > 0 ? (totals.onboarded / totals.installs) * 100 : 0,
        color: '#f59e0b',
        icon: '👋',
        description: 'Users who completed onboarding'
      },
      {
        name: 'Applications',
        value: totals.applications,
        percentage: totals.onboarded > 0 ? (totals.applications / totals.onboarded) * 100 : 0,
        color: '#8b5cf6',
        icon: '📋',
        description: 'Finance applications submitted'
      },
      {
        name: 'Disbursed',
        value: totals.disbursed,
        percentage: totals.applications > 0 ? (totals.disbursed / totals.applications) * 100 : 0,
        color: '#ec4899',
        icon: '💰',
        description: 'Successfully disbursed finances'
      }
    ];
  };

  const funnelData = calculateFunnelData();

  // Calculate conversion rates between steps
  const conversionRates = funnelData.map((step, index) => {
    if (index === 0) return null;
    const prevStep = funnelData[index - 1];
    const conversionRate = prevStep.value > 0 ? (step.value / prevStep.value) * 100 : 0;
    return {
      from: prevStep.name,
      to: step.name,
      rate: conversionRate,
      lost: prevStep.value - step.value
    };
  }).filter(Boolean);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="funnel-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-icon">{data.icon}</span>
            <span className="tooltip-title">{data.name}</span>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-value">{data.value.toLocaleString()}</div>
            <div className="tooltip-percentage">{data.percentage.toFixed(1)}% of total</div>
            <div className="tooltip-description">{data.description}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="funnel-chart">
      <div className="funnel-header">
        <h2>Product Funnel</h2>
        <div className="funnel-subtitle">
          Customer journey from store visits to finance disbursement
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="funnel-visual">
        {funnelData.map((step, index) => (
          <div
            key={index}
            className={`funnel-step ${hoveredStep === index ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredStep(index)}
            onMouseLeave={() => setHoveredStep(null)}
            style={{
              width: `${Math.max(step.percentage, 10)}%`,
              backgroundColor: step.color,
              opacity: hoveredStep === null || hoveredStep === index ? 1 : 0.6
            }}
          >
            <div className="funnel-step-content">
              <div className="step-icon">{step.icon}</div>
              <div className="step-info">
                <div className="step-name">{step.name}</div>
                <div className="step-value">{step.value.toLocaleString()}</div>
                <div className="step-percentage">{step.percentage.toFixed(1)}%</div>
              </div>
            </div>
            
            {hoveredStep === index && (
              <div className="funnel-hover-details">
                <div className="hover-description">{step.description}</div>
                {index > 0 && (
                  <div className="conversion-info">
                    <div className="conversion-rate">
                      Conversion: {conversionRates[index - 1]?.rate.toFixed(1)}%
                    </div>
                    <div className="conversion-lost">
                      Lost: {conversionRates[index - 1]?.lost.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Conversion Rates */}
      <div className="conversion-rates">
        <h3>Conversion Rates</h3>
        <div className="rates-grid">
          {conversionRates.map((conversion, index) => (
            <div key={index} className="rate-card">
              <div className="rate-header">
                <span className="rate-from">{conversion.from}</span>
                <span className="rate-arrow">→</span>
                <span className="rate-to">{conversion.to}</span>
              </div>
              <div className="rate-value">
                {conversion.rate.toFixed(1)}%
              </div>
              <div className="rate-lost">
                -{conversion.lost.toLocaleString()} users
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel Performance Chart */}
      <div className="funnel-performance">
        <h3>Funnel Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel Insights */}
      <div className="funnel-insights">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Best Conversion</h4>
              <p>
                {conversionRates.length > 0 && 
                  `${conversionRates.reduce((best, current) => 
                    current.rate > best.rate ? current : best
                  ).from} → ${conversionRates.reduce((best, current) => 
                    current.rate > best.rate ? current : best
                  ).to}`
                }
              </p>
              <span className="insight-value">
                {conversionRates.length > 0 && 
                  `${conversionRates.reduce((best, current) => 
                    current.rate > best.rate ? current : best
                  ).rate.toFixed(1)}%`
                }
              </span>
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-icon">📉</div>
            <div className="insight-content">
              <h4>Needs Improvement</h4>
              <p>
                {conversionRates.length > 0 && 
                  `${conversionRates.reduce((worst, current) => 
                    current.rate < worst.rate ? current : worst
                  ).from} → ${conversionRates.reduce((worst, current) => 
                    current.rate < worst.rate ? current : worst
                  ).to}`
                }
              </p>
              <span className="insight-value">
                {conversionRates.length > 0 && 
                  `${conversionRates.reduce((worst, current) => 
                    current.rate < worst.rate ? current : worst
                  ).rate.toFixed(1)}%`
                }
              </span>
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Overall Efficiency</h4>
              <p>Store visits to disbursement</p>
              <span className="insight-value">
                {funnelData.length > 0 && funnelData[0].value > 0 && 
                  `${((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1)}%`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunnelChart;
