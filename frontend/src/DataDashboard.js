import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './DataDashboard.css';
import { API_ENDPOINTS } from './config/api';

const DataDashboard = ({ user }) => {
  const [data, setData] = useState({
    kpis: {
      premisesDisbursed: 0,
      achievementRatio: 0,
      cac: 0,
      cpa: 0,
      spendAmount: 0,
      tvSpend: 0,
      tvReach: 0
    },
    funnel: {
      storeVisits: 0,
      installs: 0,
      onboard: 0,
      linked: 0,
      disbursed: 0
    },
    lastMonth: {
      achievementRatio: 0,
      financeBehavior: 0,
      gc: 0,
      cac: 0
    },
    campaign: {
      title: '',
      achieved: 0,
      goal: 0,
      applicationsByProduct: [],
      disbursedByProduct: []
    },
    budget: {
      monthly: 0,
      daily: 0,
      balance: 0,
      spendOverTime: []
    },
    topAds: [],
    conversionRates: [],
    funnelTimeline: []
  });
  const [activeTab, setActiveTab] = useState('TV Spend');
  const [selectedPerformer, setSelectedPerformer] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from multiple sources
      const [
        kpisResponse,
        funnelResponse,
        campaignResponse,
        budgetResponse,
        adsResponse,
        conversionResponse
      ] = await Promise.all([
        fetch(`${API_ENDPOINTS.DASHBOARD_KPIS}?user_id=${user.id}`),
        fetch(`${API_ENDPOINTS.FUNNEL_DATA}?user_id=${user.id}`),
        fetch(`${API_ENDPOINTS.CAMPAIGN_DATA}?user_id=${user.id}`),
        fetch(`${API_ENDPOINTS.BUDGET_DATA}?user_id=${user.id}`),
        fetch(`${API_ENDPOINTS.TOP_ADS}?user_id=${user.id}`),
        fetch(`${API_ENDPOINTS.CONVERSION_RATES}?user_id=${user.id}`)
      ]);

      const kpisData = await kpisResponse.json();
      const funnelData = await funnelResponse.json();
      const campaignData = await campaignResponse.json();
      const budgetData = await budgetResponse.json();
      const adsData = await adsResponse.json();
      const conversionData = await conversionResponse.json();

      setData({
        kpis: kpisData,
        funnel: funnelData,
        lastMonth: kpisData.lastMonth,
        campaign: campaignData,
        budget: budgetData,
        topAds: adsData,
        conversionRates: conversionData.rates,
        funnelTimeline: conversionData.timeline
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to fetch from TikTok API directly
      await fetchTikTokData();
    } finally {
      setLoading(false);
    }
  };

  const fetchTikTokData = async () => {
    try {
      // Fetch TikTok Ads data
      const tiktokResponse = await fetch(`${API_ENDPOINTS.TIKTOK_ADS_DATA}?user_id=${user.id}`);
      const tiktokData = await tiktokResponse.json();
      
      // Process TikTok data and update state
      updateDataFromTikTok(tiktokData);
    } catch (error) {
      console.error('Error fetching TikTok data:', error);
    }
  };

  const updateDataFromTikTok = (tiktokData) => {
    if (tiktokData && tiktokData.campaigns) {
      const totalSpend = tiktokData.campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
      const totalReach = tiktokData.campaigns.reduce((sum, campaign) => sum + campaign.reach, 0);
      const totalConversions = tiktokData.campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
      
      setData(prev => ({
        ...prev,
        kpis: {
          ...prev.kpis,
          spendAmount: totalSpend,
          tvReach: totalReach,
          cac: totalSpend / totalConversions || 0
        },
        budget: {
          ...prev.budget,
          daily: totalSpend / 30
        },
        topAds: tiktokData.topAds || []
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading real-time data...</p>
      </div>
    );
  }

  return (
    <div className="data-dashboard">
      {/* TOP HEADER - Overall KPIs */}
      <div className="top-header">
        <div className="header-tabs">
          <button 
            className={`tab-button ${activeTab === 'TV Spend' ? 'active' : ''}`}
            onClick={() => setActiveTab('TV Spend')}
          >
            TV Spend
          </button>
          <button 
            className={`tab-button ${activeTab === 'TV Reach' ? 'active' : ''}`}
            onClick={() => setActiveTab('TV Reach')}
          >
            TV Reach
          </button>
        </div>
        
        <div className="kpi-cards">
          <div className="kpi-card">
            <h3>Premises Disbursed</h3>
            <span className="kpi-value">{formatNumber(data.kpis.premisesDisbursed)}</span>
          </div>
          <div className="kpi-card">
            <h3>Achievement Ratio</h3>
            <span className="kpi-value">{data.kpis.achievementRatio.toFixed(2)}%</span>
          </div>
          <div className="kpi-card">
            <h3>CAC</h3>
            <span className="kpi-value">{formatCurrency(data.kpis.cac)}</span>
          </div>
          <div className="kpi-card">
            <h3>Cost per Activation</h3>
            <span className="kpi-value">{formatCurrency(data.kpis.cpa)}</span>
          </div>
          <div className="kpi-card">
            <h3>Spend Amount</h3>
            <span className="kpi-value">{formatCurrency(data.kpis.spendAmount)}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* LEFT PANEL - Overview & KPI */}
        <div className="left-panel">
          <div className="panel-section">
            <h3>Product Funnel</h3>
            <div className="funnel-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Store Visits', value: data.funnel.storeVisits },
                  { name: 'Installs', value: data.funnel.installs },
                  { name: 'Onboard', value: data.funnel.onboard },
                  { name: 'Linked', value: data.funnel.linked },
                  { name: 'Disbursed', value: data.funnel.disbursed }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel-section">
            <h3>Last Month Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Achievement Ratio</span>
                <span className="metric-value">{data.lastMonth.achievementRatio.toFixed(2)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Finance Behavior</span>
                <span className="metric-value">{formatNumber(data.lastMonth.financeBehavior)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">GC</span>
                <span className="metric-value">{formatCurrency(data.lastMonth.gc)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">CAC</span>
                <span className="metric-value">{formatCurrency(data.lastMonth.cac)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL - Campaign Progress & Budget */}
        <div className="middle-panel">
          <div className="panel-section">
            <h2 className="campaign-title">{data.campaign.title}</h2>
            <div className="campaign-progress">
              <div className="progress-item">
                <span className="progress-label">Applications Achieved</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(data.campaign.achieved / data.campaign.goal) * 100}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {formatNumber(data.campaign.achieved)} / {formatNumber(data.campaign.goal)}
                </span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>Applications by Product</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.campaign.applicationsByProduct}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="percentage" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel-section">
            <h3>Disbursed Finances by Product</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.campaign.disbursedByProduct} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="percentage" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel-section">
            <h3>Funnel Timeline</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.funnelTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="storeVisits" stroke="#8884d8" />
                <Line type="monotone" dataKey="installs" stroke="#82ca9d" />
                <Line type="monotone" dataKey="conversions" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel-section">
            <h3>Conversion Rates (Jan-Apr)</h3>
            <div className="conversion-table">
              <table>
                <thead>
                  <tr>
                    <th>Conversion Step</th>
                    <th>Jan</th>
                    <th>Feb</th>
                    <th>Mar</th>
                    <th>Apr</th>
                  </tr>
                </thead>
                <tbody>
                  {data.conversionRates.map((rate, index) => (
                    <tr key={index}>
                      <td>{rate.step}</td>
                      <td>{rate.jan}%</td>
                      <td>{rate.feb}%</td>
                      <td>{rate.mar}%</td>
                      <td>{rate.apr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Budget & Content */}
        <div className="right-panel">
          <div className="panel-section">
            <h3>Monthly Ad Budget</h3>
            <div className="budget-overview">
              <div className="budget-item">
                <span className="budget-label">Budget</span>
                <span className="budget-value">{formatCurrency(data.budget.monthly)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Daily Ad Spend</span>
                <span className="budget-value">{formatCurrency(data.budget.daily)}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Balance</span>
                <span className="budget-value">{formatCurrency(data.budget.balance)}</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>Spend Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.budget.spendOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="spend" stroke="#FF8042" />
                <Line type="monotone" dataKey="cac" stroke="#0088FE" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel-section">
            <h3>Performer Filter</h3>
            <select 
              value={selectedPerformer} 
              onChange={(e) => setSelectedPerformer(e.target.value)}
              className="performer-select"
            >
              <option value="All">All Performers</option>
              <option value="Influencer1">Top Influencer</option>
              <option value="Influencer2">Rising Star</option>
              <option value="Influencer3">Consistent Performer</option>
            </select>
          </div>

          <div className="panel-section">
            <h3>Top 3 Ads Based on Results</h3>
            <div className="top-ads">
              {data.topAds.slice(0, 3).map((ad, index) => (
                <div key={index} className="ad-item">
                  <div className="ad-thumbnail">
                    <img src={ad.thumbnail} alt={`Ad ${index + 1}`} />
                  </div>
                  <div className="ad-details">
                    <h4>Ad ID: {ad.id}</h4>
                    <p className="ad-caption">{ad.caption}</p>
                    <div className="ad-metrics">
                      <span>Views: {formatNumber(ad.views)}</span>
                      <span>CTR: {ad.ctr}%</span>
                      <span>Conversions: {ad.conversions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDashboard;
