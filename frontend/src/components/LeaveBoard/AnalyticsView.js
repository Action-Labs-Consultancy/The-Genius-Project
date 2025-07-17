import React, { useState } from 'react';
import './LeaveBoard.css';
import { BarChart3, TrendingUp, Calendar, Users, PieChart, Download, Eye, Activity, Award, Clock, Plus, X } from 'lucide-react';
import { calculateWorkingDays } from './utils';

const AnalyticsView = ({ 
  allRequests, 
  teamMembers, 
  publicHolidays = [],
  extraWorkdays = [],
  getLeaveTypeColor,
  isHR
}) => {
  const [expandedMetric, setExpandedMetric] = useState(null);
  const [showExtraWorkdaysReport, setShowExtraWorkdaysReport] = useState(false);

  // Calculate analytics data
  const currentYear = new Date().getFullYear();
  const requestsByMonth = {};
  const requestsByType = {};
  const requestsByStatus = {};
  const utilizationByMember = {};
  
  allRequests?.forEach(request => {
    const date = new Date(request.start_date || request.startDate);
    const month = date.getMonth();
    const type = request.type || request.leave_type;
    const status = request.status;
    const employeeName = request.employee_name || request.employee;
    const duration = request.duration || 1;
    
    if (date.getFullYear() === currentYear) {
      requestsByMonth[month] = (requestsByMonth[month] || 0) + 1;
    }
    
    requestsByType[type] = (requestsByType[type] || 0) + 1;
    requestsByStatus[status] = (requestsByStatus[status] || 0) + 1;
    
    // Calculate utilization per member
    if (employeeName && status === 'approved') {
      utilizationByMember[employeeName] = (utilizationByMember[employeeName] || 0) + duration;
    }
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const totalRequests = allRequests?.length || 0;
  const approvalRate = totalRequests > 0 ? 
    ((requestsByStatus.approved || 0) / totalRequests * 100).toFixed(1) : 0;
  
  const mostRequestedType = Object.keys(requestsByType).reduce((a, b) => 
    requestsByType[a] > requestsByType[b] ? a : b, 'N/A');

  const toggleMetricExpansion = (metric) => {
    setExpandedMetric(expandedMetric === metric ? null : metric);
  };

  const MetricCard = ({ icon: Icon, number, label, change, trend, metric, details }) => (
    <div className="metric-card hover-lift">
      <div className="metric-icon-container">
        <Icon className="metric-icon" />
      </div>
      <div className="metric-content">
        <div className="metric-number">{number}</div>
        <div className="metric-label">{label}</div>
        <div className={`metric-change ${trend}`}>
          {change}
        </div>
        <button 
          className="metric-details-btn"
          onClick={() => toggleMetricExpansion(metric)}
        >
          <Eye className="btn-icon" />
          View Details
        </button>
      </div>
      {expandedMetric === metric && (
        <div className="metric-details">
          <div className="details-content">
            {details}
          </div>
        </div>
      )}
    </div>
  );

  const SimpleBarChart = ({ data, title }) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="chart-container">
        <h4 className="chart-title">{title}</h4>
        <div className="bar-chart">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bar-item">
              <div className="bar-label">{key}</div>
              <div className="bar-wrapper">
                <div 
                  className="bar-fill" 
                  style={{ 
                    height: `${(value / maxValue) * 100}%`,
                    background: `linear-gradient(135deg, #ffd600 0%, #ffcc00 100%)`
                  }}
                >
                  <span className="bar-value">{value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PieChart = ({ data, title }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const colors = ['#FFD600', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'];
    
    return (
      <div className="chart-container">
        <h4 className="chart-title">{title}</h4>
        <div className="pie-chart-container">
          <div className="pie-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle 
                cx="100" 
                cy="100" 
                r="80" 
                fill="none" 
                stroke="#333" 
                strokeWidth="2"
              />
              {Object.entries(data).map(([key, value], index) => {
                const percentage = (value / total) * 100;
                const angle = (value / total) * 360;
                const x = 100 + 70 * Math.cos((angle - 90) * Math.PI / 180);
                const y = 100 + 70 * Math.sin((angle - 90) * Math.PI / 180);
                
                return (
                  <g key={key}>
                    <path
                      d={`M 100 100 L 100 20 A 80 80 0 ${angle > 180 ? 1 : 0} 1 ${x} ${y} Z`}
                      fill={colors[index % colors.length]}
                      opacity="0.8"
                    />
                    <text
                      x={100 + 50 * Math.cos((angle/2 - 90) * Math.PI / 180)}
                      y={100 + 50 * Math.sin((angle/2 - 90) * Math.PI / 180)}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {percentage.toFixed(1)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="pie-legend">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="legend-item">
                <div 
                  className="legend-dot" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="legend-text">{key}: {value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const LineChart = ({ data, title }) => {
    const maxValue = Math.max(...Object.values(data));
    const points = Object.entries(data).map(([key, value], index) => ({
      x: (index / (Object.keys(data).length - 1)) * 300,
      y: 150 - ((value / maxValue) * 120)
    }));
    
    return (
      <div className="chart-container">
        <h4 className="chart-title">{title}</h4>
        <div className="line-chart">
          <svg width="350" height="200" viewBox="0 0 350 200">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD600" />
                <stop offset="100%" stopColor="#FFCC00" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="25"
                y1={30 + i * 30}
                x2="325"
                y2={30 + i * 30}
                stroke="#333"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}
            
            {/* Data line */}
            <polyline
              points={points.map(p => `${p.x + 25},${p.y}`).join(' ')}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x + 25}
                cy={point.y}
                r="4"
                fill="#FFD600"
                stroke="#000"
                strokeWidth="2"
              />
            ))}
            
            {/* Labels */}
            {Object.keys(data).map((key, index) => (
              <text
                key={index}
                x={points[index].x + 25}
                y="190"
                textAnchor="middle"
                fill="#ccc"
                fontSize="12"
              >
                {key}
              </text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const ExtraWorkdaysReport = () => {
    const workdaysByEmployee = {};
    extraWorkdays.forEach(workday => {
      if (!workdaysByEmployee[workday.employeeName]) {
        workdaysByEmployee[workday.employeeName] = [];
      }
      workdaysByEmployee[workday.employeeName].push(workday);
    });

    return (
      <div className="modal-overlay">
        <div className="extra-workdays-report">
          <div className="modal-header">
            <h3>Extra Workdays Report (HR Only)</h3>
            <button className="close-btn" onClick={() => setShowExtraWorkdaysReport(false)}>
              <X />
            </button>
          </div>
          <div className="report-content">
            {Object.entries(workdaysByEmployee).map(([employeeName, workdays]) => (
              <div key={employeeName} className="employee-workdays">
                <h4>{employeeName}</h4>
                <div className="workdays-list">
                  {workdays.map((workday, index) => (
                    <div key={index} className="workday-item">
                      <div className="workday-date">{workday.date}</div>
                      <div className="workday-reason">{workday.reason}</div>
                      <div className="workday-added">Added: {new Date(workday.addedDate).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(workdaysByEmployee).length === 0 && (
              <p>No extra workdays recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h2>Analytics & Reports</h2>
      </div>

      {/* Metrics Overview */}
      <div className="metrics-grid">
        <MetricCard 
          icon={Users}
          number={totalRequests}
          label="Total Requests"
          change={`+${((requestsByStatus.approved || 0) / Math.max(totalRequests, 1) * 100).toFixed(1)}% approved`}
          trend="positive"
          metric="total"
          details={`${requestsByStatus.approved || 0} approved, ${requestsByStatus.rejected || 0} rejected, ${requestsByStatus.pending || 0} pending`}
        />
        
        <MetricCard 
          icon={TrendingUp}
          number={`${approvalRate}%`}
          label="Approval Rate"
          change="↑ 5.2% from last month"
          trend="positive"
          metric="approval"
          details={`${requestsByStatus.approved || 0} out of ${totalRequests} requests approved`}
        />
        
        <MetricCard 
          icon={Calendar}
          number={mostRequestedType}
          label="Most Requested"
          change="↑ Popular choice"
          trend="neutral"
          metric="popular"
          details={`${requestsByType[mostRequestedType] || 0} requests of this type`}
        />
        
        <MetricCard 
          icon={Clock}
          number={Object.keys(requestsByMonth).length}
          label="Active Months"
          change="Consistent usage"
          trend="positive"
          metric="months"
          details="Months with leave requests this year"
        />
      </div>

      {/* Enhanced Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <LineChart 
            data={monthNames.reduce((acc, month, index) => {
              acc[month] = requestsByMonth[index] || 0;
              return acc;
            }, {})} 
            title="Monthly Requests Trend"
          />
        </div>
        
        <div className="chart-card">
          <PieChart 
            data={requestsByType} 
            title="Leave Types Distribution"
          />
        </div>
        
        <div className="chart-card">
          <SimpleBarChart 
            data={requestsByStatus} 
            title="Request Status Distribution"
          />
        </div>
      </div>

      {/* Extra Workdays Report Modal */}
      {showExtraWorkdaysReport && <ExtraWorkdaysReport />}
    </div>
  );
};

export default AnalyticsView;
