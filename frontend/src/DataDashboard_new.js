import React, { useState, useEffect } from 'react';
import DataExport from './components/DataExport';
import DataImport from './components/DataImport';
import ConnectTikTokButton from './ConnectTikTokButton';
import ConnectMetaButton from './ConnectMetaButton';
import FunnelChart from './components/FunnelChart';
import KPISummary from './components/KPISummary';
import BudgetSection from './components/BudgetSection';
import ContentAdsSection from './components/ContentAdsSection';
import CampaignsSection from './components/CampaignsSection';
import DateRangeSelector from './components/DateRangeSelector';
import DownloadReport from './components/DownloadReport';
import './DataDashboard.css';
import { API_ENDPOINTS } from './config/api';

const DataDashboard = ({ user }) => {
  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [lastUploadDate, setLastUploadDate] = useState(null);
  const [socialConnections, setSocialConnections] = useState({ tiktok: false, meta: false });
  const [isImporting, setIsImporting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Fetch dashboard data from backend
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const res = await fetch(API_ENDPOINTS.DASHBOARD_DATA + `?user_id=${user?.id}&from=${dateRange.from}&to=${dateRange.to}`);
        const result = await res.json();
        setData(result.data);
        setInsights(result.insights || []);
        setLastUploadDate(result.lastUploadDate);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  // Fetch social media connections
  useEffect(() => {
    async function fetchConnections() {
      try {
        const res = await fetch(API_ENDPOINTS.SOCIAL_CONNECTIONS + `?user_id=${user?.id}`);
        const result = await res.json();
        setSocialConnections(result.connections || { tiktok: { connected: false }, meta: { connected: false } });
      } catch {}
    }
    if (user?.id) {
      fetchConnections();
    }
  }, [user]);

  // Fetch posts after connecting
  useEffect(() => {
    async function fetchPosts() {
      if (socialConnections.tiktok?.connected || socialConnections.meta?.connected) {
        const res = await fetch(API_ENDPOINTS.SOCIAL_MEDIA_DATA + `?user_id=${user?.id}`);
        const result = await res.json();
        setPosts(result.posts || []);
      }
    }
    fetchPosts();
  }, [socialConnections, user]);

  // Handle import
  const handleDataImported = () => {
    // Re-fetch dashboard data after import
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="data-dashboard">
      <div className="dashboard-header">
        <h1>Campaign Analytics Dashboard</h1>
        <p className="dashboard-subtitle">
          Real-time insights and performance metrics for your marketing campaigns
        </p>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector 
        dateRange={dateRange} 
        onDateRangeChange={handleDateRangeChange} 
      />

      {/* Data Import Section */}
      <div className="import-section">
        <DataImport 
          onDataImported={handleDataImported} 
          isImporting={isImporting}
          setIsImporting={setIsImporting}
        />
      </div>

      {/* Social Media Connections */}
      <div className="connections-section">
        <h3>Social Media Connections</h3>
        <div className="connection-buttons">
          <ConnectTikTokButton 
            isConnected={socialConnections.tiktok?.connected} 
            onConnectionChange={() => window.location.reload()}
          />
          <ConnectMetaButton 
            isConnected={socialConnections.meta?.connected} 
            onConnectionChange={() => window.location.reload()}
          />
        </div>
      </div>

      {/* Main Dashboard Content */}
      {data && (
        <div className="dashboard-content">
          {/* 1. Overview & KPI Section */}
          <div className="dashboard-section overview-section">
            <h2>Overview & KPIs</h2>
            
            {/* KPI Summary Cards */}
            <KPISummary data={data} />
            
            {/* Product Funnel */}
            <div className="funnel-container">
              <h3>Performance Funnel</h3>
              <FunnelChart data={data.funnel} />
            </div>
            
            {/* Campaigns Section */}
            <CampaignsSection data={data} />
          </div>

          {/* 2. Budgets & Spend Section */}
          <div className="dashboard-section budget-section">
            <h2>Budgets & Spend Analysis</h2>
            <BudgetSection data={data} />
          </div>

          {/* 3. Content & Ads Section */}
          <div className="dashboard-section content-section">
            <h2>Content & Ads Performance</h2>
            <ContentAdsSection 
              data={data} 
              posts={posts}
              socialConnections={socialConnections}
            />
          </div>

          {/* AI Insights */}
          <div className="dashboard-section insights-section">
            <h2>AI Insights & Recommendations</h2>
            <div className="insights-grid">
              {insights.length === 0 ? (
                <div className="no-insights">No insights available yet. Import more data to get AI-powered recommendations.</div>
              ) : (
                insights.map((insight, idx) => (
                  <div key={idx} className={`insight-card ${insight.type}`}>
                    <div className="insight-icon">
                      {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'}
                    </div>
                    <div className="insight-content">
                      <h4>{insight.title}</h4>
                      <p>{insight.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Download Report */}
          <div className="dashboard-section download-section">
            <DownloadReport data={data} insights={insights} dateRange={dateRange} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDashboard;
