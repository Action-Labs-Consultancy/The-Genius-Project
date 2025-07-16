import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const CampaignsSection = ({ data }) => {
  const [selectedCampaign, setSelectedCampaign] = useState(0);

  // Mock campaigns data
  const campaigns = [
    {
      id: 1,
      name: 'Summer Finance Campaign',
      status: 'Active',
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      budget: 50000,
      spent: 32000,
      conversions: 1250,
      timeline: [
        { date: '2025-06-01', visits: 1200, installs: 480, applications: 120, disbursed: 85 },
        { date: '2025-06-15', visits: 1800, installs: 720, applications: 180, disbursed: 128 },
        { date: '2025-07-01', visits: 2200, installs: 880, applications: 220, disbursed: 165 },
        { date: '2025-07-15', visits: 2800, installs: 1120, applications: 280, disbursed: 210 }
      ],
      conversionRates: [
        { stage: 'Visit to Install', rate: 40 },
        { stage: 'Install to Application', rate: 25 },
        { stage: 'Application to Disbursed', rate: 75 }
      ]
    },
    {
      id: 2,
      name: 'Back to School Budgeting',
      status: 'Active',
      startDate: '2025-07-01',
      endDate: '2025-09-30',
      budget: 35000,
      spent: 18000,
      conversions: 850,
      timeline: [
        { date: '2025-07-01', visits: 800, installs: 320, applications: 80, disbursed: 60 },
        { date: '2025-07-15', visits: 1200, installs: 480, applications: 120, disbursed: 90 }
      ],
      conversionRates: [
        { stage: 'Visit to Install', rate: 40 },
        { stage: 'Install to Application', rate: 25 },
        { stage: 'Application to Disbursed', rate: 75 }
      ]
    },
    {
      id: 3,
      name: 'Holiday Spending Support',
      status: 'Planned',
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      budget: 60000,
      spent: 0,
      conversions: 0,
      timeline: [],
      conversionRates: [
        { stage: 'Visit to Install', rate: 45 },
        { stage: 'Install to Application', rate: 28 },
        { stage: 'Application to Disbursed', rate: 80 }
      ]
    }
  ];

  const selectedCampaignData = campaigns[selectedCampaign];

  const formatCurrency = (value) => `$${value?.toLocaleString() || 0}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="campaigns-section">
      <h3>Active Campaigns</h3>
      
      {/* Campaign Selector */}
      <div className="campaign-selector">
        {campaigns.map((campaign, index) => (
          <button
            key={campaign.id}
            className={`campaign-tab ${selectedCampaign === index ? 'active' : ''}`}
            onClick={() => setSelectedCampaign(index)}
          >
            <div className="campaign-tab-header">
              <span className="campaign-name">{campaign.name}</span>
              <span className={`campaign-status ${campaign.status.toLowerCase()}`}>
                {campaign.status}
              </span>
            </div>
            <div className="campaign-tab-metrics">
              <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Campaign Details */}
      <div className="campaign-details">
        <div className="campaign-header">
          <div className="campaign-info">
            <h4>{selectedCampaignData.name}</h4>
            <p className="campaign-period">
              {formatDate(selectedCampaignData.startDate)} - {formatDate(selectedCampaignData.endDate)}
            </p>
          </div>
          
          <div className="campaign-metrics">
            <div className="metric">
              <span className="metric-label">Budget</span>
              <span className="metric-value">{formatCurrency(selectedCampaignData.budget)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Spent</span>
              <span className="metric-value">{formatCurrency(selectedCampaignData.spent)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Conversions</span>
              <span className="metric-value">{selectedCampaignData.conversions}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Utilization</span>
              <span className="metric-value">
                {selectedCampaignData.budget > 0 ? 
                  ((selectedCampaignData.spent / selectedCampaignData.budget) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Funnel Timeline */}
        {selectedCampaignData.timeline.length > 0 && (
          <div className="funnel-timeline">
            <h4>Campaign Funnel Timeline</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={selectedCampaignData.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="visits" stackId="1" stroke="#3b82f6" fill="#3b82f6" opacity={0.6} />
                <Area type="monotone" dataKey="installs" stackId="1" stroke="#10b981" fill="#10b981" opacity={0.6} />
                <Area type="monotone" dataKey="applications" stackId="1" stroke="#f59e0b" fill="#f59e0b" opacity={0.6} />
                <Area type="monotone" dataKey="disbursed" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" opacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Conversion Rates Over Time */}
        {selectedCampaignData.timeline.length > 0 && (
          <div className="conversion-timeline">
            <h4>Conversion Rates Over Time</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={selectedCampaignData.timeline.map(item => ({
                date: item.date,
                'Visit to Install': (item.installs / item.visits * 100).toFixed(1),
                'Install to Application': (item.applications / item.installs * 100).toFixed(1),
                'Application to Disbursed': (item.disbursed / item.applications * 100).toFixed(1)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="Visit to Install" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Install to Application" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Application to Disbursed" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Campaign Performance Summary */}
        <div className="campaign-performance">
          <h4>Performance Summary</h4>
          <div className="performance-grid">
            {selectedCampaignData.conversionRates.map((conversion, index) => (
              <div key={index} className="performance-item">
                <div className="performance-header">
                  <span className="performance-stage">{conversion.stage}</span>
                  <span className="performance-rate">{conversion.rate}%</span>
                </div>
                <div className="performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ width: `${conversion.rate}%` }}
                  />
                </div>
                <div className="performance-insight">
                  {conversion.rate > 35 ? 'Excellent' : conversion.rate > 25 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily/Weekly Data Points */}
        {selectedCampaignData.timeline.length > 0 && (
          <div className="data-points">
            <h4>Recent Performance Data</h4>
            <div className="data-points-grid">
              {selectedCampaignData.timeline.slice(-7).map((dataPoint, index) => (
                <div key={index} className="data-point">
                  <div className="data-point-date">{formatDate(dataPoint.date)}</div>
                  <div className="data-point-metrics">
                    <div className="data-metric">
                      <span className="metric-label">Visits</span>
                      <span className="metric-value">{dataPoint.visits}</span>
                    </div>
                    <div className="data-metric">
                      <span className="metric-label">Installs</span>
                      <span className="metric-value">{dataPoint.installs}</span>
                    </div>
                    <div className="data-metric">
                      <span className="metric-label">Applications</span>
                      <span className="metric-value">{dataPoint.applications}</span>
                    </div>
                    <div className="data-metric">
                      <span className="metric-label">Disbursed</span>
                      <span className="metric-value">{dataPoint.disbursed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsSection;
