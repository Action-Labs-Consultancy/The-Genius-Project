import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import ConnectTikTokButton from './ConnectTikTokButton';
import { api, API_BASE_URL } from './config/api';

ChartJS.register(
  CategoryScale            <div>
              <h3 style={{ color: '#fff', marginBottom: '15px' }}>Budget Overview</h3>
              <div style={{ background: '#333', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#888' }}>Monthly Budget: <span style={{ color: '#fff' }}>${dashboardData.budget.monthly}</span></p>
                <p style={{ margin: '0 0 10px 0', color: '#888' }}>Daily Spend: <span style={{ color: '#fff' }}>${dashboardData.budget.dailySpend}</span></p>
                <p style={{ margin: '0 0 10px 0', color: '#888' }}>Balance: <span style={{ color: GREEN }}>${dashboardData.budget.balance}</span></p>
              </div>
            </div>
          </div>

          {/* Performance Trends Chart */}
          {performanceMetricsData && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#fff', marginBottom: '15px' }}>Performance Trends</h3>
              <div style={{ height: '250px' }}>
                <Line data={performanceMetricsData} options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' }
                  }
                }} />
              </div>
            </div>
          )}

          {/* Spend Trends Chart */}
          {spendTrendData && (
            <div>
              <h3 style={{ color: '#fff', marginBottom: '15px' }}>Spend Trends</h3>
              <div style={{ height: '200px' }}>
                <Line data={spendTrendData} options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' }
                  }
                }} />
              </div>
            </div>
          )}rScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale
);

const YELLOW = '#FFD600';
const GREEN = '#00D084';
const BLUE = '#007AFF';
const RED = '#FF3B30';

export default function TikTokAnalyticsDashboard({ user, client }) {
  const [tiktokData, setTiktokData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('TV Spend');
  const [performerFilter, setPerformerFilter] = useState('All');
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch TikTok data when component mounts
  useEffect(() => {
    if (client?.id) {
      fetchTikTokData();
    }
  }, [client?.id, performerFilter]);

  const fetchTikTokData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real TikTok analytics data from backend
      const data = await api.getTikTokAnalytics(client?.id);
      setTiktokData(data);
      setDashboardData(data);
      
    } catch (error) {
      console.error('Error fetching TikTok data:', error);
      setError('Failed to load TikTok analytics data');
      // Fallback to mock data structure for demonstration
      setDashboardData({
        kpis: {
          premisesDisbursed: 470,
          achievementRatio: 21.76,
          cac: 14.23,
          costPerActivation: 2.32,
          spendAmount: 2.67,
          totalSpend: 24500.00,
          impressions: 1250000,
          clicks: 35000,
          conversions: 850,
          ctr: 2.8,
          conversionRate: 2.43
        },
        funnel: {
          storeVisits: 12000,
          installs: 8000,
          onboard: 5000,
          linked: 3500,
          disbursed: 470
        },
        lastMonth: {
          achievementRatio: 74.96,
          financeBehavior: 1057,
          gc: 6.30,
          cac: 14.90,
          growth: 12.5,
          engagementRate: 5.2
        },
        campaign: {
          title: 'Summer Campaign - Budgeting',
          achieved: 2887,
          goal: 12825,
          progress: 22.5,
          applications: [
            { product: 'Product A', percentage: 61 },
            { product: 'Product B', percentage: 18 },
            { product: 'Product C', percentage: 21 }
          ]
        },
        budget: {
          monthly: 17500,
          dailySpend: 6900,
          balance: 10810,
          spendPercentage: 60.5
        },
        topAds: [
          { id: 1, thumbnail: '🎯', title: 'Summer Special Offer', results: '2.3K conversions', spend: 1200, ctr: 3.1 },
          { id: 2, thumbnail: '💰', title: 'Quick Approval Process', results: '1.8K conversions', spend: 950, ctr: 2.8 },
          { id: 3, thumbnail: '⚡', title: 'Instant Cash Flow', results: '1.5K conversions', spend: 800, ctr: 2.5 }
        ],
        timeSeriesData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          spend: [1200, 1500, 1800, 2100, 2200, 2400, 2600],
          conversions: [45, 62, 78, 89, 95, 102, 115],
          impressions: [125000, 145000, 165000, 180000, 195000, 210000, 225000]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const funnelChartData = dashboardData ? {
    labels: ['Store Visits', 'Installs', 'Onboard', 'Linked', 'Disbursed'],
    datasets: [{
      label: 'Conversion Funnel',
      data: [
        dashboardData.funnel.storeVisits,
        dashboardData.funnel.installs,
        dashboardData.funnel.onboard,
        dashboardData.funnel.linked,
        dashboardData.funnel.disbursed
      ],
      backgroundColor: [GREEN, BLUE, YELLOW, '#FF6B35', RED],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  const applicationsByProductData = dashboardData ? {
    labels: dashboardData.campaign.applications.map(app => app.product),
    datasets: [{
      data: dashboardData.campaign.applications.map(app => app.percentage),
      backgroundColor: [GREEN, YELLOW, BLUE],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  } : null;

  const spendTrendData = dashboardData?.timeSeriesData ? {
    labels: dashboardData.timeSeriesData.labels,
    datasets: [{
      label: 'Spend ($)',
      data: dashboardData.timeSeriesData.spend,
      borderColor: BLUE,
      backgroundColor: BLUE + '20',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const performanceMetricsData = dashboardData?.timeSeriesData ? {
    labels: dashboardData.timeSeriesData.labels,
    datasets: [
      {
        label: 'Conversions',
        data: dashboardData.timeSeriesData.conversions,
        borderColor: GREEN,
        backgroundColor: GREEN + '20',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Impressions (thousands)',
        data: dashboardData.timeSeriesData.impressions.map(i => i / 1000),
        borderColor: YELLOW,
        backgroundColor: YELLOW + '20',
        fill: false,
        tension: 0.4
      }
    ]
  } : null;

  const spendOverTimeData = {
    labels: ['Jul 1', 'Jul 5', 'Jul 10', 'Jul 15', 'Jul 20', 'Jul 25', 'Jul 30'],
    datasets: [
      {
        label: 'Daily Spend ($)',
        data: [5200, 6800, 7200, 6900, 7500, 6700, 6900],
        borderColor: BLUE,
        backgroundColor: BLUE + '20',
        tension: 0.4
      },
      {
        label: 'CAC ($)',
        data: [12.5, 14.2, 15.8, 14.23, 13.9, 15.1, 14.6],
        borderColor: RED,
        backgroundColor: RED + '20',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const spendChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Spend & CAC Trends' }
    },
    scales: {
      y: { type: 'linear', display: true, position: 'left' },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '4px solid #333',
            borderTop: '4px solid #FFD600',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading TikTok Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={fetchTikTokData}
            style={{
              background: GREEN,
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔗</div>
          <p style={{ marginBottom: '20px' }}>Connect your TikTok account to view analytics</p>
          <ConnectTikTokButton user={user} client={client} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#111', 
      color: '#fff', 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* TOP HEADER - KPIs & Filters */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: YELLOW, margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          TikTok Analytics Dashboard
          {client && <span style={{ color: '#888', fontSize: '18px' }}> - {client.name}</span>}
        </h1>
        <ConnectTikTokButton user={user} client={client} />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          style={{ 
            background: selectedFilter === 'TV Spend' ? GREEN : '#333',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedFilter('TV Spend')}
        >
          TV Spend
        </button>
        <button 
          style={{ 
            background: selectedFilter === 'TV Reach' ? GREEN : '#333',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedFilter('TV Reach')}
        >
          TV Reach
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: GREEN, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Premises Disbursed</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            {dashboardData.kpis.premisesDisbursed}
          </p>
        </div>
        <div style={{ background: GREEN, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Achievement Ratio</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            {dashboardData.kpis.achievementRatio}%
          </p>
        </div>
        <div style={{ background: GREEN, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>CAC</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            ${dashboardData.kpis.cac}
          </p>
        </div>
        <div style={{ background: GREEN, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Cost per Activation</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            ${dashboardData.kpis.costPerActivation}
          </p>
        </div>
        <div style={{ background: GREEN, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Spend Amount (BHD)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            {dashboardData.kpis.spendAmount}K
          </p>
        </div>
      </div>

      {/* MAIN GRID PANELS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '30px' }}>
        {/* LEFT PANEL */}
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ color: YELLOW, marginBottom: '20px' }}>Product Funnel</h2>
          <div style={{ height: '300px', marginBottom: '30px' }}>
            <Bar data={funnelChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          
          <h3 style={{ color: YELLOW, marginBottom: '15px' }}>Last Month Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#333', padding: '15px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#888' }}>Achievement Ratio</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{dashboardData.lastMonth.achievementRatio}%</p>
            </div>
            <div style={{ background: '#333', padding: '15px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#888' }}>Finance Behavior</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{dashboardData.lastMonth.financeBehavior}</p>
            </div>
            <div style={{ background: '#333', padding: '15px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#888' }}>GC</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{dashboardData.lastMonth.gc}K</p>
            </div>
            <div style={{ background: '#333', padding: '15px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#888' }}>CAC</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>${dashboardData.lastMonth.cac}</p>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL */}
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ color: YELLOW, marginBottom: '20px' }}>{dashboardData.campaign.title}</h2>
          
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Applications Achieved</h3>
            <p style={{ fontSize: '24px', margin: '0 0 5px 0' }}>
              <span style={{ color: GREEN }}>{dashboardData.campaign.achieved}</span> / 
              <span style={{ color: '#888' }}> {dashboardData.campaign.goal}</span>
            </p>
            <div style={{ 
              background: '#333', 
              height: '8px', 
              borderRadius: '4px', 
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{ 
                background: GREEN, 
                height: '100%', 
                width: `${(dashboardData.campaign.achieved / dashboardData.campaign.goal) * 100}%`,
                borderRadius: '4px'
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '15px' }}>Applications by Product</h3>
              <div style={{ height: '200px' }}>
                <Doughnut data={applicationsByProductData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '15px' }}>Budget Overview</h3>
              <div style={{ background: '#333', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#888' }}>Monthly Budget: <span style={{ color: '#fff' }}>${dashboardData.budget.monthly}</span></p>
                <p style={{ margin: '0 0 10px 0', color: '#888' }}>Daily Spend: <span style={{ color: '#fff' }}>${dashboardData.budget.dailySpend}</span></p>
                <p style={{ margin: 0, color: '#888' }}>Balance: <span style={{ color: GREEN }}>${dashboardData.budget.balance}</span></p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '15px' }}>Spend & CAC Trends</h3>
            <div style={{ height: '250px' }}>
              <Line data={spendOverTimeData} options={spendChartOptions} />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#fff', marginBottom: '10px', display: 'block' }}>Performer Filter</label>
            <select 
              value={performerFilter}
              onChange={(e) => setPerformerFilter(e.target.value)}
              style={{ 
                background: '#333', 
                color: '#fff', 
                border: 'none', 
                padding: '10px', 
                borderRadius: '8px',
                width: '100%'
              }}
            >
              <option value="All">All Performers</option>
              {/* Map performer list from TikTok data if available */}
            </select>
          </div>

          <h3 style={{ color: YELLOW, marginBottom: '20px' }}>Top 3 Ads Based on Results</h3>
          
          {dashboardData?.topAds && dashboardData.topAds.slice(0, 3).map((ad, idx) => (
            <div key={ad.id} style={{ 
              background: '#333', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ 
                fontSize: '30px',
                width: '50px',
                height: '50px',
                background: '#444',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {ad.thumbnail}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{ad.title}</p>
                <p style={{ margin: 0, color: GREEN, fontSize: '14px' }}>{ad.results}</p>
                <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
                  CTR: {ad.ctr}% | Spend: ${ad.spend}
                </p>
              </div>
              <div style={{ 
                background: YELLOW, 
                color: '#000', 
                padding: '5px 10px', 
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                #{idx + 1}
              </div>
            </div>
          ))}

          {tiktokData && (
            <div style={{ marginTop: '30px', background: '#333', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ color: YELLOW, marginBottom: '10px' }}>Live TikTok Data</h4>
              <p style={{ margin: '5px 0', color: '#888' }}>Total Spend: <span style={{ color: '#fff' }}>${tiktokData.totalSpend}</span></p>
              <p style={{ margin: '5px 0', color: '#888' }}>Impressions: <span style={{ color: '#fff' }}>{tiktokData.impressions}</span></p>
              <p style={{ margin: '5px 0', color: '#888' }}>Clicks: <span style={{ color: '#fff' }}>{tiktokData.clicks}</span></p>
              <p style={{ margin: '5px 0', color: '#888' }}>Conversions: <span style={{ color: '#fff' }}>{tiktokData.conversions}</span></p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: YELLOW }}>
              Loading TikTok data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
