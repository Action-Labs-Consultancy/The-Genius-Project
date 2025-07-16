import React, { useState, useRef, createContext } from 'react';
import './SocialMediaInsightsDashboard.css';
import DataImport from './components/DataImport';
import KPISummary from './components/KPISummary';
import FunnelChart from './components/FunnelChart_new';
import BudgetSection from './components/BudgetSection';
import CampaignsSection from './components/CampaignsSection';
import ContentAdsSection from './components/ContentAdsSection';
import ConnectTikTokButton from './ConnectTikTokButton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Central store context for cross-widget coordination
const InsightsContext = createContext();

const PLATFORMS = [
  { name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' },
  { name: 'TikTok', icon: 'fab fa-tiktok', color: '#000000' },
  { name: 'YouTube', icon: 'fab fa-youtube', color: '#FF0000' },
];

// Utility function to format numbers
function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

// Calculate percent change
function calculatePercentChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
}

// Main Dashboard Component
export default function SocialMediaInsightsDashboard({ user }) {
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [clientId] = useState(1); // Mock client ID
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [importedData, setImportedData] = useState([]); // All imported Excel rows
  const [insightsData, setInsightsData] = useState(null); // Calculated insights from imported data
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredDonut, setHoveredDonut] = useState(null);
  const [fadeKey, setFadeKey] = useState(0);
  const [isImporting, setIsImporting] = useState(false); // New state for importing

  // Tooltip handlers
  function showDayTooltip(i) { setHoveredDay(i); }
  function hideDayTooltip() { setHoveredDay(null); }
  function showBarTooltip(i) { setHoveredBar(i); }
  function hideBarTooltip() { setHoveredBar(null); }
  function showDonutTooltip(i) { setHoveredDonut(i); }
  function hideDonutTooltip() { setHoveredDonut(null); }

  // Load imported data from localStorage on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('smidash_importedData');
    if (savedData) {
      try {
        setImportedData(JSON.parse(savedData));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save imported data to localStorage whenever it changes
  React.useEffect(() => {
    if (importedData && importedData.length > 0) {
      localStorage.setItem('smidash_importedData', JSON.stringify(importedData));
    }
  }, [importedData]);

  // Handle Excel import and merge logic
  const handleDataImported = (newRows) => {
    console.log('New data imported:', newRows); // Debug log
    // Merge newRows with existing importedData by date (latest wins)
    const merged = [...importedData];
    newRows.forEach(newRow => {
      const idx = merged.findIndex(row => row.reportDate === newRow.reportDate);
      if (idx !== -1) merged[idx] = { ...merged[idx], ...newRow };
      else merged.push(newRow);
    });
    console.log('Merged data:', merged); // Debug log
    setImportedData(merged);
    // Calculate insights from merged data
    setInsightsData(calculateInsightsFromData(merged));
  };

  // Calculate insights from imported data
  function calculateInsightsFromData(data) {
    if (!Array.isArray(data) || data.length === 0) return null;
    // Example: sum up followers, reach, engagement, posts, etc. by latest row
    const sorted = [...data].sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));
    const current = sorted[0];
    const previous = sorted[1] || {};
    return {
      currentPeriod: {
        followers: Number(current.followers) || 0,
        reach: Number(current.reach) || 0,
        engagement: Number(current.engagement) || 0,
        posts: Number(current.posts) || 0
      },
      previousPeriod: {
        followers: Number(previous.followers) || 0,
        reach: Number(previous.reach) || 0,
        engagement: Number(previous.engagement) || 0,
        posts: Number(previous.posts) || 0
      },
      derivedRates: {
        reachRate: current.followers ? ((current.reach / current.followers) * 100).toFixed(1) : 0,
        engagementRate: current.reach ? ((current.engagement / current.reach) * 100).toFixed(1) : 0,
        avgPerPost: current.posts ? Math.round(current.engagement / current.posts) : 0
      }
    };
  }

  // Filter importedData by date range
  const filteredData = React.useMemo(() => {
    if (!importedData || importedData.length === 0) return [];
    // Ensure date filtering works for all valid date formats
    return importedData.filter(row => {
      if (!row.reportDate) return false;
      // Try to parse the date in a robust way
      const date = new Date(row.reportDate);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      // Only include rows with valid dates in the range (inclusive)
      return !isNaN(date) && date >= fromDate && date <= toDate;
    });
  }, [importedData, dateRange]);

  // Calculate KPIs from filtered data
  const kpiData = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return {};
    const totalAchieved = filteredData.reduce((sum, row) => sum + (row.totalAdvanceDisbursed || 0), 0);
    const totalSpend = filteredData.reduce((sum, row) => sum + (row.adSpend || 0), 0);
    const cac = totalAchieved > 0 ? (totalSpend / totalAchieved) : 0;
    const kpiTarget = 100000; // Example KPI target, replace with real value if available
    const kpiAchievedPercent = (totalAchieved / kpiTarget) * 100;
    return {
      totalAchieved,
      cac,
      kpiAchievedPercent,
      kpiTarget,
      totalSpend
    };
  }, [filteredData]);

  // --- Calculations for Visualizations ---
  // 1. Total Achieved by category
  const totalAchievedByCategory = React.useMemo(() => {
    const categories = [
      { key: 'totalAdvanceApproved', label: 'Advance' },
      { key: 'totalMicroFinancingApproved', label: 'Microfinance' },
      { key: 'totalCreditCardApproved', label: 'Credit Card' },
      { key: 'totalPersonalFinanceApproved', label: 'Personal Finance' }
    ];
    return categories.map(cat => ({
      label: cat.label,
      value: filteredData.reduce((sum, row) => sum + (row[cat.key] || 0), 0)
    }));
  }, [filteredData]);
  const totalAchieved = totalAchievedByCategory.reduce((sum, cat) => sum + cat.value, 0);

  // 2. CAC (Customer Acquisition Cost)
  const totalAdSpend = filteredData.reduce((sum, row) => sum + (row.adSpend || 0), 0);
  const newCustomers = filteredData.reduce((sum, row) => sum + (row.newCustomers || 0), 0);
  const cac = newCustomers > 0 ? totalAdSpend / newCustomers : 0;

  // 3. % Achieved out of KPI
  const kpiTarget = 100000; // Replace with real value if available
  const percentAchieved = kpiTarget > 0 ? (totalAchieved / kpiTarget) * 100 : 0;

  // 4. Funnel Conversion Rates
  const funnelStages = [
    { key: 'applications', label: 'Applications' },
    { key: 'applicants', label: 'Applicants' }
  ];
  const applications = filteredData.reduce((sum, row) => sum + (row.applications || 0), 0);
  const applicants = filteredData.reduce((sum, row) => sum + (row.applicants || 0), 0);
  const conversionRate = applications > 0 ? (applicants / applications) * 100 : 0;

  // Load data on mount and when dependencies change
  // useEffect(() => {
  //   loadInsights();
  // }, [selectedPlatform, dateRange.from, dateRange.to]);

  const contextValue = {
    selectedPostId,
    setSelectedPostId,
    insightsData,
    selectedPlatform,
    setShowPostModal
  };

  const CHART_COLORS = {
    green: '#00E676',
    yellow: '#FFD600',
    orange: '#FF6F00',
    blue: '#2196F3',
    red: '#FF1744',
    gray: '#222',
  };

  // --- Social Insights Section ---
  const SocialInsightsSection = () => {
    // Example AI insights based on real data
    const insights = [];
    if (kpiData.kpiAchievedPercent < 50) {
      insights.push({
        icon: '⚠️',
        title: 'Performance Alert',
        message: `Achievement ratio of ${kpiData.kpiAchievedPercent?.toFixed(1) || 0}% is below target. Consider reviewing processes.`
      });
    }
    if (importedData && importedData.length > 0) {
      // Find top performing category by disbursed
      const top = importedData.reduce((best, row) => {
        if (!best || (row.totalAdvanceDisbursed || 0) > (best.totalAdvanceDisbursed || 0)) return row;
        return best;
      }, null);
      if (top && top.totalAdvanceDisbursed > 0) {
        insights.push({
          icon: '🏆',
          title: 'Top Performing Category',
          message: `Advance is your highest disbursing category with ${top.totalAdvanceDisbursed} disbursed.`
        });
      }
    }
    return (
      <div style={{background:'#232323', borderRadius:'16px', padding:'32px', margin:'24px 0', color:'#FFD600', textAlign:'left', fontSize:18, fontWeight:700}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h2 style={{fontWeight:800, fontSize:20, color:'#FFD600', margin:0}}>AI Insights</h2>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, opacity: 0.7 }}>{insights.length} insights</span>
        </div>
        {insights.length === 0 ? (
          <div style={{ color: '#fff', fontWeight: 500, fontSize: 16 }}>No insights available yet. Import more data to get AI-powered recommendations.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {insights.map((insight, idx) => (
              <div key={idx} style={{ background: '#181818', borderRadius: 10, padding: 18, display: 'flex', alignItems: 'flex-start', gap: 16, boxShadow: '0 2px 8px #0003' }}>
                <span style={{ fontSize: 28 }}>{insight.icon}</span>
                <div>
                  <div style={{ color: '#FFD600', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{insight.title}</div>
                  <div style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>{insight.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- Enhanced CAC & CPA Performance Cards ---
  const PerformanceCard = ({ title, value, subtitle, status, color }) => (
    <div style={{
      background: '#181818',
      borderRadius: 14,
      padding: '24px 28px',
      boxShadow: '0 2px 12px #0006',
      border: `2px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      minWidth: 220,
      marginBottom: 18
    }}>
      <div style={{ fontWeight: 800, fontSize: 18, color }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '8px 0' }}>{value}</div>
      <div style={{ fontSize: 15, color: '#FFD600', fontWeight: 600 }}>{subtitle}</div>
      <div style={{ fontSize: 14, color, fontWeight: 700, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {status === 'Needs attention' ? '↑' : '✓'} {status}
      </div>
    </div>
  );

  // --- Enhanced Budget Breakdown Card ---
  const BudgetBreakdown = ({ items }) => (
    <div style={{ background: '#181818', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', marginBottom: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 18, color: '#FFD600', marginBottom: 12 }}>Monthly Budget Breakdown</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        {items.map((item, idx) => (
          <div key={item.label} style={{ background: '#232323', borderRadius: 10, padding: 18, minWidth: 180, flex: 1, display: 'flex', flexDirection: 'column', gap: 6, border: '1.5px solid #FFD600' }}>
            <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 16 }}>{item.label}</div>
            <div style={{ color: '#fff', fontWeight: 600 }}>Allocated: <span style={{ color: '#FFD600' }}>{item.allocated}</span></div>
            <div style={{ color: '#fff', fontWeight: 600 }}>Spent: <span style={{ color: '#FFD600' }}>{item.spent}</span></div>
            <div style={{ color: '#fff', fontWeight: 600 }}>Remaining: <span style={{ color: '#FFD600' }}>{item.remaining}</span></div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Budget Allocation Data for BudgetSection ---
  const budgetMonthly = filteredData.reduce((sum, row) => sum + (row.budget || 0), 0); // Use real budget data
  const spendAmount = filteredData.reduce((sum, row) => sum + (row.adSpend || 0), 0); // Use real spend data
  const allocationData = [
    { category: 'Digital Advertising', amount: budgetMonthly * 0.6 },
    { category: 'Influencer Marketing', amount: budgetMonthly * 0.25 },
    { category: 'Events & Promotions', amount: budgetMonthly * 0.15 }
  ];
  const budgetSectionData = {
    budget: {
      monthly: budgetMonthly,
      balance: budgetMonthly - spendAmount,
      allocation: allocationData
    },
    kpis: {
      spendAmount: spendAmount,
      cac: cac,
      cpa: applications > 0 ? (spendAmount / applications) : 0 // Calculate CPA from real data
    }
  };

  // --- Enhanced KPI calculations with real data validation ---
  const kpiSummaryData = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { hasData: false, summary: {}, availableFields: [] };
    
    // Get available fields from the first row to help with mapping
    const availableFields = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];
    
    // Try to map common field names to the data we have
    const totalRevenue = filteredData.reduce((sum, row) => sum + (
      row.revenue || row.totalRevenue || row.income || row.totalIncome || 
      row.totalAdvanceDisbursed || row.totalDisbursed || 0
    ), 0);
    
    const totalCost = filteredData.reduce((sum, row) => sum + (
      row.cost || row.totalCost || row.spend || row.adSpend || 
      row.totalSpend || row.expense || row.totalExpense || 0
    ), 0);
    
    const totalClicks = filteredData.reduce((sum, row) => sum + (
      row.clicks || row.totalClicks || row.linkClicks || row.clicksTotal || 0
    ), 0);
    
    const totalImpressions = filteredData.reduce((sum, row) => sum + (
      row.impressions || row.totalImpressions || row.reach || row.views || 
      row.totalViews || row.impressionsTotal || 0
    ), 0);
    
    const totalConversions = filteredData.reduce((sum, row) => sum + (
      row.conversions || row.totalConversions || row.applications || 
      row.totalApplications || row.leads || row.totalLeads || 0
    ), 0);
    
    const totalApplications = filteredData.reduce((sum, row) => sum + (
      row.applications || row.totalApplications || row.applicants || 
      row.totalApplicants || row.conversions || 0
    ), 0);
    
    console.log('KPI Calculation Debug:', {
      availableFields,
      totalRevenue,
      totalCost,
      totalClicks,
      totalImpressions,
      totalConversions,
      totalApplications,
      sampleRow: filteredData[0]
    });
    
    return {
      hasData: true,
      availableFields,
      summary: {
        totalRevenue,
        totalCost,
        totalClicks,
        totalImpressions,
        totalConversions,
        totalApplications,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0,
        roas: totalCost > 0 ? (totalRevenue / totalCost).toFixed(2) : 0,
        cpa: totalApplications > 0 ? (totalCost / totalApplications).toFixed(2) : 0
      }
    };
  }, [filteredData]);

  // --- Monthly KPI breakdown for the KPIs & Overview section ---
  const monthlyKPIData = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const monthlyGroups = filteredData.reduce((groups, row) => {
      const month = new Date(row.reportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!groups[month]) groups[month] = [];
      groups[month].push(row);
      return groups;
    }, {});
    
    return Object.entries(monthlyGroups).map(([month, rows]) => ({
      month,
      achieved: rows.reduce((sum, row) => sum + (row.totalAdvanceDisbursed || 0), 0),
      target: kpiTarget / 12, // Monthly target
      spend: rows.reduce((sum, row) => sum + (row.adSpend || 0), 0),
      applications: rows.reduce((sum, row) => sum + (row.applications || 0), 0),
      cac: rows.reduce((sum, row) => sum + (row.adSpend || 0), 0) / Math.max(rows.reduce((sum, row) => sum + (row.newCustomers || 0), 0), 1)
    }));
  }, [filteredData, kpiTarget]);

  // --- Download Report Helper ---
  function downloadReport(data) {
    if (!data || data.length === 0) {
      alert('No data to download!');
      return;
    }
    // Convert data to CSV
    const fields = Object.keys(data[0]);
    const csvRows = [fields.join(',')];
    for (const row of data) {
      csvRows.push(fields.map(f => JSON.stringify(row[f] ?? '')).join(','));
    }
    const csvContent = csvRows.join('\n');
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social_media_report_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <InsightsContext.Provider value={contextValue}>
      <div className="smidash-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #181818 60%, #232323 100%)', color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 40 }}>
        <div style={{ maxWidth: 1200, margin: '32px auto 0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>
          {/* --- DATE FILTER & CONNECTION BUTTONS AT TOP --- */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, marginBottom: 32, background: '#232323', borderRadius: 16, padding: 22, boxShadow: '0 4px 24px #0006', border: '1.5px solid #FFD600' }}>
            <label style={{ color: '#FFD600', fontWeight: 600, marginRight: 8 }}>From:</label>
            <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} style={{ background: '#232323', color: '#FFD600', border: '1px solid #FFD600', borderRadius: 6, padding: '4px 8px', marginRight: 12 }} />
            <label style={{ color: '#FFD600', fontWeight: 600, marginRight: 8 }}>To:</label>
            <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} style={{ background: '#232323', color: '#FFD600', border: '1px solid #FFD600', borderRadius: 6, padding: '4px 8px', marginRight: 24 }} />
            <button
              style={{
                background: 'linear-gradient(90deg, #4267B2 0%, #23345A 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 2px 12px #0002',
                transition: 'transform 0.1s',
                minWidth: 220
              }}
              onClick={() => {
                const appId = '1247958283373973';
                const redirectUri = encodeURIComponent(window.location.origin + '/meta-callback');
                const scope = 'public_profile,email,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement';
                const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
                window.location.href = authUrl;
              }}
            >
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#4267B2"/>
                <path d="M32.5 24H27V40H21V24H17V18H21V14.5C21 10.91 23.42 8 27.5 8C29.24 8 30.5 8.13 30.5 8.13V13H28.5C27.12 13 27 13.67 27 14.5V18H30.5L30 24Z" fill="white"/>
              </svg>
              Connect Meta Account
            </button>
            <ConnectTikTokButton />
          </div>

          {/* --- DOWNLOAD REPORT BUTTON --- */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button
              style={{
                background: '#FFD600',
                color: '#181818',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontWeight: 800,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 2px 12px #FFD60044',
                transition: 'all 0.2s'
              }}
              onClick={() => downloadReport(filteredData)}
            >
              Download Report
            </button>
          </div>

          {/* --- SUMMARY PAGE --- */}
          <div style={{ background: '#232323', borderRadius: 18, padding: 32, boxShadow: '0 4px 24px #0006', border: '1.5px solid #FFD600', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Total Achieved Bar Graph */}
            <h3 style={{ color: '#FFD600', fontWeight: 700 }}>Total Achieved by Category</h3>
            <BarChart width={900} height={260} data={totalAchievedByCategory} style={{ marginBottom: 24 }}>
              <XAxis dataKey="label" stroke="#FFD600" />
              <YAxis stroke="#FFD600" />
              <Tooltip />
              <Bar dataKey="value" fill="#FFD600" />
            </BarChart>
            {/* CAC Line Graph */}
            <h3 style={{ color: '#FFD600', fontWeight: 700 }}>CAC Trend</h3>
            <LineChart width={900} height={260} data={filteredData.map(row => ({ date: row.reportDate, cac: row.adSpend && row.newCustomers ? row.adSpend / row.newCustomers : 0 }))} style={{ marginBottom: 24 }}>
              <XAxis dataKey="date" stroke="#FFD600" />
              <YAxis stroke="#FFD600" />
              <Tooltip />
              <Line type="monotone" dataKey="cac" stroke="#00E676" strokeWidth={2} dot={false} />
            </LineChart>
            {/* % Achieved Pie Chart */}
            <h3 style={{ color: '#FFD600', fontWeight: 700 }}>% Achieved out of KPI</h3>
            <PieChart width={420} height={260} style={{ marginBottom: 24 }}>
              <Pie data={[{ name: 'Achieved', value: totalAchieved }, { name: 'Remaining', value: Math.max(kpiTarget - totalAchieved, 0) }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} fill="#FFD600" label>
                <Cell key="achieved" fill="#00E676" />
                <Cell key="remaining" fill="#232323" />
              </Pie>
              <Tooltip />
            </PieChart>
            {/* Summary Text */}
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginTop: 12 }}>
              {percentAchieved < 50 ? 'Performance is below target. Consider reviewing your strategy.' : 'Great job! You are on track to meet your KPI.'}
            </div>
          </div>

          {/* --- FUNNEL --- */}
          <div style={{ background: '#232323', borderRadius: 18, padding: 32, boxShadow: '0 4px 24px #0006', border: '1.5px solid #FFD600', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h3 style={{ color: '#FFD600', fontWeight: 700 }}>Funnel Conversion Rate</h3>
            <BarChart width={900} height={260} data={[{ stage: 'Applications', value: applications }, { stage: 'Applicants', value: applicants }]} style={{ marginBottom: 24 }}>
              <XAxis dataKey="stage" stroke="#FFD600" />
              <YAxis stroke="#FFD600" />
              <Tooltip />
              <Bar dataKey="value" fill="#FFD600" />
            </BarChart>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginTop: 12 }}>
              Conversion Rate: {conversionRate.toFixed(1)}%
            </div>
          </div>

          {/* --- KPIs & OVERVIEW --- */}
          <div style={{ background: '#232323', borderRadius: 18, padding: 32, boxShadow: '0 4px 24px #0006', border: '1.5px solid #FFD600', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ color: '#FFD600', fontWeight: 800, fontSize: 22, marginBottom: 8, letterSpacing: '-0.5px' }}>KPIs & Overview</h2>
            
            {/* Show data status */}
            {!kpiSummaryData.hasData ? (
              <div style={{ color: '#fff', fontWeight: 500, fontSize: 16, textAlign: 'center', padding: 40 }}>
                No data available. Import Excel files to see KPI analysis.
              </div>
            ) : (
              <>
                {/* KPI Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: '#181818', borderRadius: 12, padding: 20, border: '1px solid #FFD600' }}>
                    <div style={{ color: '#FFD600', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Total Revenue/Disbursed</div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>${formatNumber(kpiSummaryData.summary.totalRevenue)}</div>
                  </div>
                  <div style={{ background: '#181818', borderRadius: 12, padding: 20, border: '1px solid #FFD600' }}>
                    <div style={{ color: '#FFD600', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Total Cost/Spend</div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>${formatNumber(kpiSummaryData.summary.totalCost)}</div>
                  </div>
                  <div style={{ background: '#181818', borderRadius: 12, padding: 20, border: '1px solid #FFD600' }}>
                    <div style={{ color: '#FFD600', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Applications</div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>{formatNumber(kpiSummaryData.summary.totalApplications)}</div>
                  </div>
                  <div style={{ background: '#181818', borderRadius: 12, padding: 20, border: '1px solid #FFD600' }}>
                    <div style={{ color: '#FFD600', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>CPA</div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>${kpiSummaryData.summary.cpa}</div>
                  </div>
                </div>

                {/* Monthly KPI Table */}
                <div style={{ background: '#181818', borderRadius: 12, padding: 20, border: '1px solid #FFD600' }}>
                  <h3 style={{ color: '#FFD600', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Monthly Performance Table</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #FFD600' }}>
                          <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Month</th>
                          <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Target</th>
                          <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Achieved</th>
                          <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>% Achieved</th>
                          <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Spend</th>
                          <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>CAC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyKPIData.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ color: '#fff', padding: '8px 12px', fontWeight: 600 }}>{row.month}</td>
                            <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>${formatNumber(row.target)}</td>
                            <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>${formatNumber(row.achieved)}</td>
                            <td style={{ color: row.achieved >= row.target ? '#00E676' : '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                              {row.target > 0 ? ((row.achieved / row.target) * 100).toFixed(1) : 0}%
                            </td>
                            <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>${formatNumber(row.spend)}</td>
                            <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>${row.cac.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* --- STRATEGY SECTION --- */}
          <div style={{ background: '#232323', borderRadius: 18, padding: 32, boxShadow: '0 4px 24px #0006', border: '1.5px solid #FFD600', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <BudgetSection data={budgetSectionData} />
            {/* Benchmarks, funnel steps by product, funnel timeline, ads info, campaigns, TikTok vs Meta, organic content */}
            {/* You can add more custom components here for each sub-section as needed */}
          </div>

          {/* --- PERFORMANCE CARDS & BUDGET BREAKDOWN (NEW NICER WAY) --- */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, margin: '32px 0', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 260, maxWidth: 340 }}>
              <div style={{ background: '#181818', borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, color: '#FFD600' }}>💸</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: '#FFD600' }}>CAC Performance</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '8px 0' }}>
                  ${cac.toFixed(2)}
                </div>
                <div style={{ fontSize: 15, color: '#FFD600', fontWeight: 600 }}>Customer Acquisition Cost</div>
                <div style={{ fontSize: 14, color: cac === 0 ? '#FFD600' : '#00E676', fontWeight: 700, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {cac === 0 ? '↑ Needs attention' : '✓ Good'}
                </div>
              </div>
              <div style={{ background: '#181818', borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, color: '#FFD600' }}>📊</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: '#FFD600' }}>CPA Performance</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '8px 0' }}>
                  ${kpiData.cpa ? kpiData.cpa.toFixed(2) : '0'}
                </div>
                <div style={{ fontSize: 15, color: '#FFD600', fontWeight: 600 }}>Cost per Application</div>
                <div style={{ fontSize: 14, color: kpiData.cpa === 0 ? '#FFD600' : '#00E676', fontWeight: 700, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {kpiData.cpa === 0 ? '↑ Needs attention' : '✓ Good'}
                </div>
              </div>
            </div>
            <div style={{ flex: 2, minWidth: 320, maxWidth: 600 }}>
              <div style={{ background: '#181818', borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#FFD600', marginBottom: 8 }}>Monthly Budget Breakdown</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                  <div style={{ background: '#232323', borderRadius: 10, padding: 18, minWidth: 180, flex: 1, display: 'flex', flexDirection: 'column', gap: 6, border: '1.5px solid #FFD600' }}>
                    <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 16 }}>Digital Advertising</div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Allocated: <span style={{ color: '#FFD600' }}>$0</span></div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Spent: <span style={{ color: '#FFD600' }}>$0</span></div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Remaining: <span style={{ color: '#FFD600' }}>$0</span></div>
                  </div>
                  <div style={{ background: '#232323', borderRadius: 10, padding: 18, minWidth: 180, flex: 1, display: 'flex', flexDirection: 'column', gap: 6, border: '1.5px solid #FFD600' }}>
                    <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 16 }}>Influencer Marketing</div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Allocated: <span style={{ color: '#FFD600' }}>$0</span></div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Spent: <span style={{ color: '#FFD600' }}>$0</span></div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Remaining: <span style={{ color: '#FFD600' }}>$0</span></div>
                  </div>
                  <div style={{ background: '#232323', borderRadius: 10, padding: 18, minWidth: 180, flex: 1, display: 'flex', flexDirection: 'column', gap: 6, border: '1.5px solid #FFD600' }}>
                    <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 16 }}>Events & Promotions</div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Allocated: <span style={{ color: '#FFD600' }}>$0</span></div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Spent: <span style={{ color: '#FFD600' }}>$0</span></div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Remaining: <span style={{ color: '#FFD600' }}>$0</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- AI INSIGHTS --- */}
          <div style={{ background: '#232323', borderRadius: 18, padding: 32, boxShadow: '0 4px 24px #0006', border: '1.5px solid #FFD600', display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 24, marginTop: 40 }}>
            <SocialInsightsSection />
          </div>

          {/* --- CONTENT & ADS SECTION --- */}
          <div style={{ background: '#232323', borderRadius: 18, padding: 32, boxShadow: '0 4px 24px #0006', border: '1.5px solid #FFD600', marginBottom: 40 }}>
            <h2 style={{ color: '#FFD600', fontWeight: 800, fontSize: 22, marginBottom: 24 }}>Content & Ads</h2>
            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.name}
                  className={`platform-btn ${selectedPlatform === p.name ? 'active' : ''}`}
                  style={{
                    background: selectedPlatform === p.name ? p.color : '#232323',
                    color: selectedPlatform === p.name ? '#fff' : '#FFD600',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: selectedPlatform === p.name ? '0 2px 12px #0006' : 'none',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedPlatform(p.name)}
                >
                  <i className={p.icon} style={{ marginRight: 8 }}></i> {p.name}
                </button>
              ))}
            </div>
            <ContentAdsTabs selectedPlatform={selectedPlatform} />
          </div>

          {/* --- IMPORT DATA --- */}
          <div style={{background:'#232323', borderRadius:'18px', padding:'32px', border:'2px solid #ffd600', textAlign:'center', margin:'24px 0', boxShadow: '0 4px 24px #0006'}}>
            <DataImport isImporting={isImporting} setIsImporting={setIsImporting} onDataImported={handleDataImported} />
            <div style={{color:'#fff', fontSize:13, marginTop:'10px', opacity:0.7}}>Supported formats: <b>.xlsx</b>, <b>.xls</b></div>
          </div>
        </div>
      </div>
    </InsightsContext.Provider>
  );
}

// --- Content & Ads Tabs Section ---
function ContentAdsTabs({ selectedPlatform }) {
  // Remove Meta/TikTok tab state, use selectedPlatform from above
  // Placeholder: Replace with real data fetch from APIs
  const metaAds = [];
  const tiktokAds = [];
  const instagramAds = [];
  const youtubeAds = [];
  const metaContent = [];
  const tiktokContent = [];
  const instagramContent = [];
  const youtubeContent = [];

  let adsData = [];
  let contentData = [];
  if (selectedPlatform === 'Meta') {
    adsData = metaAds;
    contentData = metaContent;
  } else if (selectedPlatform === 'TikTok') {
    adsData = tiktokAds;
    contentData = tiktokContent;
  } else if (selectedPlatform === 'Instagram') {
    adsData = instagramAds;
    contentData = instagramContent;
  } else if (selectedPlatform === 'YouTube') {
    adsData = youtubeAds;
    contentData = youtubeContent;
  }

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      {/* Top 5 Ads Table */}
      <div style={{ flex: 1, minWidth: 320 }}>
        <h3 style={{ color: '#FFD600', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Top 5 Ads (Based on Installs)</h3>
        <div style={{ background: '#181818', borderRadius: 12, padding: 20, border: '1px solid #FFD600', minHeight: 220 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FFD600' }}>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Ad</th>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Installs</th>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Cost/Install</th>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Reach</th>
              </tr>
            </thead>
            <tbody>
              {adsData.length === 0 ? (
                <tr><td colSpan={4} style={{ color: '#fff', textAlign: 'center', padding: 24 }}>No data available for {selectedPlatform}.</td></tr>
              ) : (
                adsData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ color: '#fff', padding: '8px 12px', fontWeight: 600 }}>{row.ad}</td>
                    <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>{row.installs}</td>
                    <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>${row.cpi}</td>
                    <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>{row.reach}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Top 5 Content Table */}
      <div style={{ flex: 1, minWidth: 320 }}>
        <h3 style={{ color: '#FFD600', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Top 5 Content (Based on Engagement)</h3>
        <div style={{ background: '#181818', borderRadius: 12, padding: 20, border: '1px solid #FFD600', minHeight: 220 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FFD600' }}>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Post</th>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Reach</th>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Views</th>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Likes</th>
                <th style={{ color: '#FFD600', padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Comments</th>
              </tr>
            </thead>
            <tbody>
              {contentData.length === 0 ? (
                <tr><td colSpan={5} style={{ color: '#fff', textAlign: 'center', padding: 24 }}>No data available for {selectedPlatform}.</td></tr>
              ) : (
                contentData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ color: '#fff', padding: '8px 12px', fontWeight: 600 }}>{row.post}</td>
                    <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>{row.reach}</td>
                    <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>{row.views}</td>
                    <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>{row.likes}</td>
                    <td style={{ color: '#fff', padding: '8px 12px', textAlign: 'right' }}>{row.comments}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}