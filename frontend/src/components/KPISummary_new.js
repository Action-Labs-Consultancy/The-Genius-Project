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
