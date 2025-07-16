import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import './KPISummary.css';

const KPISummary = ({ kpis, data }) => {
  // Only use actual KPIs from backend, don't calculate or make up data
  const actualKPIs = {
    customerAcquisitionCost: kpis?.cac || 0,
    costPerApplication: kpis?.cpa || 0,
    totalSpent: kpis?.spendAmount || 0,
    achievedKPI: kpis?.achievementRatio || 0,
    premisesDisbursed: kpis?.premisesDisbursed || 0
  };

  // Only use actual chart data from backend
  const chartData = data?.chartData || [];
  const hasChartData = Array.isArray(chartData) && chartData.length > 0;

  // Prepare trend data only if we have actual data
  const trendData = hasChartData ? 
    chartData.slice(-7).map((item, index) => ({
      day: `Day ${index + 1}`,
      cac: item.cac || 0,
      cpa: item.cpa || 0,
      spent: item.spendAmount || 0,
      kpi: item.achievementRatio || 0
    })) : [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="kpi-summary">
      <div className="section-header">
        <h2>Key Performance Indicators</h2>
        <div className="kpi-period">
          {hasChartData ? `Based on ${chartData.length} data points` : 'No data available'}
        </div>
      </div>
      
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <h3>Customer Acquisition Cost</h3>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-value">
            {actualKPIs.customerAcquisitionCost > 0 ? 
              formatCurrency(actualKPIs.customerAcquisitionCost) : 
              'No data'
            }
          </div>
          {trendData.length > 0 && (
            <div className="kpi-chart">
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={trendData}>
                  <Line 
                    type="monotone" 
                    dataKey="cac" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h3>Cost per Application</h3>
            <span className="kpi-icon">📊</span>
          </div>
          <div className="kpi-value">
            {actualKPIs.costPerApplication > 0 ? 
              formatCurrency(actualKPIs.costPerApplication) : 
              'No data'
            }
          </div>
          {trendData.length > 0 && (
            <div className="kpi-chart">
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={trendData}>
                  <Line 
                    type="monotone" 
                    dataKey="cpa" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h3>Total Spent</h3>
            <span className="kpi-icon">💸</span>
          </div>
          <div className="kpi-value">
            {actualKPIs.totalSpent > 0 ? 
              formatCurrency(actualKPIs.totalSpent) : 
              'No data'
            }
          </div>
          {trendData.length > 0 && (
            <div className="kpi-chart">
              <ResponsiveContainer width="100%" height={60}>
                <BarChart data={trendData}>
                  <Bar dataKey="spent" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h3>Achievement Ratio</h3>
            <span className="kpi-icon">🎯</span>
          </div>
          <div className="kpi-value">
            {actualKPIs.achievedKPI > 0 ? 
              formatPercentage(actualKPIs.achievedKPI) : 
              'No data'
            }
          </div>
          {trendData.length > 0 && (
            <div className="kpi-chart">
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={trendData}>
                  <Line 
                    type="monotone" 
                    dataKey="kpi" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h3>Premises Disbursed</h3>
            <span className="kpi-icon">🏢</span>
          </div>
          <div className="kpi-value">
            {actualKPIs.premisesDisbursed > 0 ? 
              actualKPIs.premisesDisbursed.toLocaleString() : 
              'No data'
            }
          </div>
          <div className="kpi-subtitle">Total premises</div>
        </div>
      </div>
    </div>
  );
};

export default KPISummary;
      cpa: calculatedKPIs.costPerApplication || 0,
      spent: calculatedKPIs.totalSpent || 0,
      kpi: calculatedKPIs.achievedKPI || 0
    }));

  const kpiCards = [
    {
      title: 'Customer Acquisition Cost',
      value: `$${calculatedKPIs.customerAcquisitionCost?.toFixed(2) || '0.00'}`,
      change: '+5.2%',
      trend: 'positive',
      icon: '👥',
      color: '#3b82f6',
      description: 'Cost to acquire each customer'
    },
    {
      title: 'Cost per Application',
      value: `$${calculatedKPIs.costPerApplication?.toFixed(2) || '0.00'}`,
      change: '-2.1%',
      trend: 'negative',
      icon: '📋',
      color: '#10b981',
      description: 'Cost per application submitted'
    },
    {
      title: 'Total Spent',
      value: `$${calculatedKPIs.totalSpent?.toLocaleString() || '0'}`,
      change: '+12.5%',
      trend: 'positive',
      icon: '💰',
      color: '#f59e0b',
      description: 'Total marketing spend'
    },
    {
      title: 'Achieved KPI',
      value: `${calculatedKPIs.achievedKPI?.toFixed(1) || '0.0'}%`,
      change: '+8.3%',
      trend: 'positive',
      icon: '🎯',
      color: '#8b5cf6',
      description: 'KPI achievement rate'
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="kpi-tooltip">
          <p className="tooltip-label">{`Day ${label}`}</p>
          <p className="tooltip-value">
            {`${payload[0].name}: $${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="kpi-summary">
      <div className="kpi-header">
        <h2>Key Performance Indicators</h2>
        <div className="kpi-period">
          <span>Last 30 days</span>
        </div>
      </div>

      <div className="kpi-grid">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="kpi-card" style={{ borderTopColor: kpi.color }}>
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: `${kpi.color}20`, color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="kpi-change">
                <span className={`change-indicator ${kpi.trend}`}>
                  {kpi.trend === 'positive' ? '↗' : '↘'} {kpi.change}
                </span>
              </div>
            </div>
            
            <div className="kpi-content">
              <h3>{kpi.title}</h3>
              <p className="kpi-value" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
              <p className="kpi-description">{kpi.description}</p>
            </div>

            <div className="kpi-mini-chart">
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={trendData}>
                  <Line
                    type="monotone"
                    dataKey={index === 0 ? 'cac' : index === 1 ? 'cpa' : index === 2 ? 'spent' : 'kpi'}
                    stroke={kpi.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: kpi.color }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* KPI Comparison Chart */}
      <div className="kpi-comparison">
        <h3>KPI Trends (Last 7 Days)</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="cac" fill="#3b82f6" name="CAC" />
              <Bar dataKey="cpa" fill="#10b981" name="CPA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="performance-overview">
        <div className="overview-item">
          <h4>Monthly Performance</h4>
          <div className="performance-metric">
            <span className="metric-label">Target Achievement</span>
            <div className="metric-progress">
              <div 
                className="progress-bar"
                style={{ width: `${calculatedKPIs.achievedKPI || 0}%` }}
              ></div>
            </div>
            <span className="metric-value">{calculatedKPIs.achievedKPI?.toFixed(1) || '0.0'}%</span>
          </div>
        </div>

        <div className="overview-item">
          <h4>Efficiency Metrics</h4>
          <div className="efficiency-grid">
            <div className="efficiency-item">
              <span className="efficiency-label">Cost Efficiency</span>
              <span className="efficiency-value positive">+15%</span>
            </div>
            <div className="efficiency-item">
              <span className="efficiency-label">Conversion Rate</span>
              <span className="efficiency-value positive">+8%</span>
            </div>
            <div className="efficiency-item">
              <span className="efficiency-label">ROI</span>
              <span className="efficiency-value positive">+22%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPISummary;
