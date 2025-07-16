import React, { useState, useEffect } from 'react';
import DataImport from './components/DataImport';
import KPISummary from './components/KPISummary';
import FunnelChart from './components/FunnelChart';
import BudgetSection from './components/BudgetSection';
import ContentAdsSection from './components/ContentAdsSection';
import CampaignsSection from './components/CampaignsSection';
import DateRangeSelector from './components/DateRangeSelector';
import DownloadReport from './components/DownloadReport';
import ConnectTikTokButton from './ConnectTikTokButton';
import ConnectMetaButton from './ConnectMetaButton';
import './DataDashboard.css';
import { API_ENDPOINTS, API_BASE_URL } from './config/api';

const DataDashboard = ({ user }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [socialConnections, setSocialConnections] = useState({
    tiktok: false,
    meta: false
  });
  const [isImporting, setIsImporting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    fetchData();
    checkSocialConnections();
  }, [dateRange, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/data?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&user_id=${user?.id || ''}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        setData(result.data || []);
        setKpis(result.kpis || {});
        setInsights(result.insights || []);
      } else {
        throw new Error('Response is not JSON');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkSocialConnections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-media/connections?user_id=${user?.id || ''}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const connections = await response.json();
          setSocialConnections(connections);
        } else {
          // If not JSON, use default values
          setSocialConnections({ tiktok: false, meta: false });
        }
      } else {
        // If endpoint doesn't exist, use default values
        setSocialConnections({ tiktok: false, meta: false });
      }
    } catch (err) {
      console.error('Error checking social connections:', err);
      // Set default values on error
      setSocialConnections({ tiktok: false, meta: false });
    }
  };

  useEffect(() => {
    if (socialConnections.tiktok || socialConnections.meta) {
      fetchSocialMediaData();
    }
  }, [socialConnections, user]);

  const fetchSocialMediaData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-media/data?user_id=${user?.id || ''}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          setPosts(result.posts || []);
        } else {
          // If not JSON, use empty array
          setPosts([]);
        }
      } else {
        // If endpoint doesn't exist, use empty array
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching social media data:', err);
      // Set empty array on error
      setPosts([]);
    }
  };

  const handleDataImported = () => {
    fetchData();
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>
  );

  if (error) return (
    <div className="dashboard-error">
      <div className="error-icon">⚠️</div>
      <h2>Error Loading Dashboard</h2>
      <p>{error}</p>
      <button onClick={fetchData} className="retry-button">Retry</button>
    </div>
  );

  return (
    <div className="data-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Analytics Dashboard</h1>
          </div>
        </div>
      </div>
      <div style={{maxWidth:'1400px', margin:'0 auto', padding:'0 24px'}}>
        {/* Main Dashboard Grid */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr 1fr', gap:'24px', marginBottom:'24px'}}>
          {/* KPI Summary Section - Top Left */}
          <div style={{background:'rgba(0, 0, 0, 0.95)', borderRadius:'16px', padding:'32px', border:'2px solid #ffd600', animation:'fadeIn 0.8s', boxShadow:'0 8px 32px rgba(255, 214, 0, 0.2)'}}>
            <h2 style={{fontWeight:800, fontSize:20, color:'#ffd600', marginBottom:'20px', fontFamily:'Montserrat, sans-serif'}}>KPI Summary</h2>
            <KPISummary kpis={kpis} data={data} />
            <div style={{marginTop:'24px'}}>
              <h3 style={{fontWeight:700, fontSize:16, color:'#ffd600', marginBottom:'16px', fontFamily:'Montserrat, sans-serif'}}>Product Funnel</h3>
              <FunnelChart data={data} />
            </div>
          </div>
          
          {/* Campaign Section - Center */}
          <div style={{background:'rgba(0, 0, 0, 0.95)', borderRadius:'16px', padding:'32px', border:'2px solid #ffd600', animation:'fadeIn 1s', boxShadow:'0 8px 32px rgba(255, 214, 0, 0.2)'}}>
            <h2 style={{fontWeight:800, fontSize:20, color:'#ffd600', marginBottom:'20px', fontFamily:'Montserrat, sans-serif'}}>Campaign Performance</h2>
            <CampaignsSection data={data} />
          </div>
          
          {/* Content & Ads Section - Top Right */}
          <div style={{background:'rgba(0, 0, 0, 0.95)', borderRadius:'16px', padding:'32px', border:'2px solid #ffd600', animation:'fadeIn 1.2s', boxShadow:'0 8px 32px rgba(255, 214, 0, 0.2)'}}>
            <h2 style={{fontWeight:800, fontSize:20, color:'#ffd600', marginBottom:'20px', fontFamily:'Montserrat, sans-serif'}}>Content & Ads</h2>
            <ContentAdsSection data={data} posts={posts} socialConnections={socialConnections} />
          </div>
        </div>
        
        {/* Budget Section - Full Width */}
        <div style={{background:'rgba(0, 0, 0, 0.95)', borderRadius:'16px', padding:'32px', border:'2px solid #ffd600', animation:'fadeIn 1.4s', boxShadow:'0 8px 32px rgba(255, 214, 0, 0.2)', marginBottom:'24px'}}>
          <h2 style={{fontWeight:800, fontSize:20, color:'#ffd600', marginBottom:'20px', fontFamily:'Montserrat, sans-serif'}}>Budget & Spend Analysis</h2>
          <BudgetSection data={data} kpis={kpis} />
        </div>
        
        {/* Bottom Row - Download & Import */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px'}}>
          <div style={{background:'rgba(0, 0, 0, 0.95)', borderRadius:'16px', padding:'32px', border:'2px solid #ffd600', textAlign:'center', animation:'fadeIn 1.6s', boxShadow:'0 8px 32px rgba(255, 214, 0, 0.2)'}}>
            <h2 style={{fontWeight:800, fontSize:20, color:'#ffd600', marginBottom:'20px', fontFamily:'Montserrat, sans-serif'}}>Download Report</h2>
            <DownloadReport data={data} kpis={kpis} dateRange={dateRange} user={user} />
          </div>
          
          <div style={{background:'rgba(0, 0, 0, 0.95)', borderRadius:'16px', padding:'32px', border:'2px solid #ffd600', textAlign:'center', animation:'fadeIn 1.8s', boxShadow:'0 8px 32px rgba(255, 214, 0, 0.2)'}}>
            <h2 style={{fontWeight:800, fontSize:20, color:'#ffd600', marginBottom:'20px', fontFamily:'Montserrat, sans-serif'}}>Import Data</h2>
            <DataImport onDataImported={handleDataImported} isImporting={isImporting} setIsImporting={setIsImporting} user={user} />
          </div>
        </div>
        
        {/* Insights Section - Full Width */}
        {insights.length > 0 && (
          <div style={{background:'rgba(0, 0, 0, 0.95)', borderRadius:'16px', padding:'32px', border:'2px solid #ffd600', animation:'fadeIn 2s', boxShadow:'0 8px 32px rgba(255, 214, 0, 0.2)', marginTop:'24px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2 style={{fontWeight:800, fontSize:20, color:'#ffd600', margin:0, fontFamily:'Montserrat, sans-serif'}}>AI Insights</h2>
              <div style={{background:'linear-gradient(135deg, #ffd600 0%, #ffeb3b 100%)', color:'#000', borderRadius:'12px', padding:'8px 16px', fontWeight:700, fontSize:14, fontFamily:'Montserrat, sans-serif', boxShadow:'0 2px 8px rgba(255, 214, 0, 0.3)'}}>
                {insights.length} insights
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'20px'}}>
              {insights.map((insight, index) => (
                <div key={index} style={{background:'rgba(255, 255, 255, 0.1)', border:'1px solid #ffd600', borderRadius:'12px', padding:'20px', color:'#fff', animation:'fadeInUp 0.6s', boxShadow:'0 4px 16px rgba(255, 214, 0, 0.1)'}}>
                  <div style={{fontSize:36, marginBottom:'12px'}}>
                    {insight.type === 'warning' && '⚠️'}
                    {insight.type === 'success' && '✅'}
                    {insight.type === 'danger' && '🔥'}
                    {!insight.type && '💡'}
                  </div>
                  <h4 style={{fontWeight:700, color:'#ffd600', fontSize:16, marginBottom:'8px', fontFamily:'Montserrat, sans-serif'}}>{insight.title}</h4>
                  <p style={{fontSize:14, lineHeight:1.5, fontFamily:'Roboto, sans-serif', color:'#ccc'}}>{insight.message}</p>
                  {insight.action && (
                    <button style={{background:'linear-gradient(135deg, #ffd600 0%, #ffeb3b 100%)', color:'#000', border:'none', borderRadius:'8px', padding:'10px 20px', fontWeight:700, cursor:'pointer', fontFamily:'Montserrat, sans-serif', fontSize:14, marginTop:'12px', boxShadow:'0 2px 8px rgba(255, 214, 0, 0.3)', transition:'all 0.2s'}}>{insight.action}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDashboard;
