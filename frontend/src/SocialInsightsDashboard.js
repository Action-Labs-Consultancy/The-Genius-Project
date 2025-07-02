import React, { useState, useEffect, useRef } from 'react';
import './SocialInsightsDashboard.css';

// Social Media Platforms
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'facebook', name: 'Facebook', icon: '👍' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' }
];

// Mock Clients Data
const MOCK_CLIENTS = [
  { id: 1, name: 'Acme Corporation', industry: 'Technology' },
  { id: 2, name: 'Global Ventures', industry: 'Finance' },
  { id: 3, name: 'Sunshine Foods', industry: 'Food & Beverage' },
  { id: 4, name: 'EcoSolutions', industry: 'Environment' },
  { id: 5, name: 'Fashion Forward', industry: 'Retail' }
];

// Client-specific data mapping with comprehensive KPIs matching the required metrics
const CLIENT_DATA = {
  1: {
    kpis: [
      { name: 'Followers', value: 24600, change: 5.2, icon: '👥' },
      { name: 'Reach', value: 87300, change: 9.1, icon: '👁️' },
      { name: 'Engagement', value: 12400, change: 7.5, icon: '❤️' },
      { name: 'Posts', value: 15, change: 15.4, icon: '✏️' }
    ],
    derivedKpis: [
      { name: 'Reach Rate', value: 3.6, icon: '📊' },
      { name: 'Engagement Rate', value: 4.8, icon: '📈' },
      { name: 'Avg. Engagement per Post', value: 830, icon: '⚡' }
    ],
    posts: [
      { 
        id: 1, 
        date: '2025-06-24', 
        title: 'Product Launch', 
        engagement: 1240, 
        likes: 980, 
        comments: 85, 
        shares: 175, 
        saves: 20, 
        reach: 17000 
      },
      { 
        id: 2, 
        date: '2025-06-22', 
        title: 'Customer Story', 
        engagement: 950, 
        likes: 720, 
        comments: 64, 
        shares: 166, 
        saves: 15, 
        reach: 15000 
      },
      { 
        id: 3, 
        date: '2025-06-20', 
        title: 'Team Spotlight', 
        engagement: 875, 
        likes: 640, 
        comments: 92, 
        shares: 143, 
        saves: 10, 
        reach: 9000 
      },
      { 
        id: 4, 
        date: '2025-06-19', 
        title: 'Product Update', 
        engagement: 690, 
        likes: 520, 
        comments: 45, 
        shares: 125, 
        saves: 8, 
        reach: 12000 
      },
      { 
        id: 5, 
        date: '2025-06-16', 
        title: 'Industry Insights', 
        engagement: 1020, 
        likes: 830, 
        comments: 73, 
        shares: 117, 
        saves: 12, 
        reach: 8000 
      }
    ],
    dailyMetrics: [
      { date: '2025-06-16', followers: 23300, engagement: 1020, posts: 1, avgReach: 8000 },
      { date: '2025-06-17', followers: 23400, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-18', followers: 23600, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-19', followers: 23800, engagement: 690, posts: 1, avgReach: 12000 },
      { date: '2025-06-20', followers: 24100, engagement: 875, posts: 1, avgReach: 9000 },
      { date: '2025-06-21', followers: 24300, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-22', followers: 24400, engagement: 950, posts: 1, avgReach: 15000 },
      { date: '2025-06-23', followers: 24500, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-24', followers: 24600, engagement: 1240, posts: 1, avgReach: 17000 }
    ]
  },
  2: {
    kpis: [
      { name: 'Followers', value: 18200, change: 2.8, icon: '👥' },
      { name: 'Reach', value: 61200, change: 4.5, icon: '👁️' },
      { name: 'Engagement', value: 8500, change: 1.9, icon: '❤️' },
      { name: 'Posts', value: 12, change: 6.7, icon: '✏️' }
    ],
    derivedKpis: [
      { name: 'Reach Rate', value: 3.4, icon: '📊' },
      { name: 'Engagement Rate', value: 3.9, icon: '📈' },
      { name: 'Avg. Engagement per Post', value: 710, icon: '⚡' }
    ],
    posts: [
      { 
        id: 1, 
        date: '2025-06-24', 
        title: 'Market Analysis', 
        engagement: 980, 
        likes: 720, 
        comments: 75, 
        shares: 185, 
        saves: 17, 
        reach: 14000 
      },
      { 
        id: 2, 
        date: '2025-06-21', 
        title: 'Investment Tips', 
        engagement: 850, 
        likes: 620, 
        comments: 54, 
        shares: 176, 
        saves: 14, 
        reach: 12000 
      },
      { 
        id: 3, 
        date: '2025-06-18', 
        title: 'Financial Report', 
        engagement: 775, 
        likes: 540, 
        comments: 62, 
        shares: 173, 
        saves: 9, 
        reach: 10000 
      }
    ],
    dailyMetrics: [
      { date: '2025-06-16', followers: 17500, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-17', followers: 17600, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-18', followers: 17700, engagement: 775, posts: 1, avgReach: 10000 },
      { date: '2025-06-19', followers: 17800, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-20', followers: 17900, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-21', followers: 18000, engagement: 850, posts: 1, avgReach: 12000 },
      { date: '2025-06-22', followers: 18050, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-23', followers: 18100, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-24', followers: 18200, engagement: 980, posts: 1, avgReach: 14000 }
    ]
  },
  3: {
    kpis: [
      { name: 'Followers', value: 32400, change: 7.2, icon: '👥' },
      { name: 'Reach', value: 98700, change: 3.1, icon: '👁️' },
      { name: 'Engagement', value: 15900, change: 5.8, icon: '❤️' },
      { name: 'Posts', value: 18, change: 9.2, icon: '✏️' }
    ],
    derivedKpis: [
      { name: 'Reach Rate', value: 3.0, icon: '📊' },
      { name: 'Engagement Rate', value: 5.1, icon: '📈' },
      { name: 'Avg. Engagement per Post', value: 885, icon: '⚡' }
    ],
    posts: [
      { 
        id: 1, 
        date: '2025-06-23', 
        title: 'New Recipe Launch', 
        engagement: 1540, 
        likes: 1180, 
        comments: 105, 
        shares: 255, 
        saves: 22, 
        reach: 19000 
      },
      { 
        id: 2, 
        date: '2025-06-20', 
        title: 'Chef Interview', 
        engagement: 1250, 
        likes: 920, 
        comments: 84, 
        shares: 196, 
        saves: 16, 
        reach: 16000 
      },
      { 
        id: 3, 
        date: '2025-06-17', 
        title: 'Cooking Tips', 
        engagement: 1075, 
        likes: 840, 
        comments: 102, 
        shares: 133, 
        saves: 11, 
        reach: 11000 
      }
    ],
    dailyMetrics: [
      { date: '2025-06-16', followers: 30200, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-17', followers: 30600, engagement: 1075, posts: 1, avgReach: 11000 },
      { date: '2025-06-18', followers: 31000, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-19', followers: 31300, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-20', followers: 31600, engagement: 1250, posts: 1, avgReach: 16000 },
      { date: '2025-06-21', followers: 31900, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-22', followers: 32100, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-23', followers: 32400, engagement: 1540, posts: 1, avgReach: 19000 },
      { date: '2025-06-24', followers: 32400, engagement: 0, posts: 0, avgReach: 0 }
    ]
  },
  4: {
    kpis: [
      { name: 'Followers', value: 15800, change: 10.5, icon: '👥' },
      { name: 'Reach', value: 45600, change: 12.7, icon: '👁️' },
      { name: 'Engagement', value: 7200, change: 8.3, icon: '❤️' },
      { name: 'Posts', value: 10, change: 4.2, icon: '✏️' }
    ],
    derivedKpis: [
      { name: 'Reach Rate', value: 2.9, icon: '📊' },
      { name: 'Engagement Rate', value: 4.6, icon: '📈' },
      { name: 'Avg. Engagement per Post', value: 720, icon: '⚡' }
    ],
    posts: [
      { 
        id: 1, 
        date: '2025-06-22', 
        title: 'Sustainability Report', 
        engagement: 890, 
        likes: 680, 
        comments: 65, 
        shares: 145, 
        saves: 13, 
        reach: 13000 
      },
      { 
        id: 2, 
        date: '2025-06-19', 
        title: 'Green Initiative', 
        engagement: 750, 
        likes: 520, 
        comments: 44, 
        shares: 186, 
        saves: 11, 
        reach: 11000 
      },
      { 
        id: 3, 
        date: '2025-06-16', 
        title: 'Climate Action', 
        engagement: 675, 
        likes: 440, 
        comments: 52, 
        shares: 183, 
        saves: 8, 
        reach: 9000 
      }
    ],
    dailyMetrics: [
      { date: '2025-06-16', followers: 14300, engagement: 675, posts: 1, avgReach: 9000 },
      { date: '2025-06-17', followers: 14500, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-18', followers: 14800, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-19', followers: 15000, engagement: 750, posts: 1, avgReach: 11000 },
      { date: '2025-06-20', followers: 15200, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-21', followers: 15400, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-22', followers: 15600, engagement: 890, posts: 1, avgReach: 13000 },
      { date: '2025-06-23', followers: 15700, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-24', followers: 15800, engagement: 0, posts: 0, avgReach: 0 }
    ]
  },
  5: {
    kpis: [
      { name: 'Followers', value: 41200, change: 6.3, icon: '👥' },
      { name: 'Reach', value: 112500, change: 8.9, icon: '👁️' },
      { name: 'Engagement', value: 19300, change: 4.2, icon: '❤️' },
      { name: 'Posts', value: 21, change: 15.8, icon: '✏️' }
    ],
    derivedKpis: [
      { name: 'Reach Rate', value: 2.7, icon: '📊' },
      { name: 'Engagement Rate', value: 5.9, icon: '📈' },
      { name: 'Avg. Engagement per Post', value: 920, icon: '⚡' }
    ],
    posts: [
      { 
        id: 1, 
        date: '2025-06-24', 
        title: 'Summer Collection', 
        engagement: 1840, 
        likes: 1380, 
        comments: 125, 
        shares: 335, 
        saves: 30, 
        reach: 22000 
      },
      { 
        id: 2, 
        date: '2025-06-21', 
        title: 'Fashion Week', 
        engagement: 1550, 
        likes: 1120, 
        comments: 94, 
        shares: 276, 
        saves: 25, 
        reach: 19000 
      },
      { 
        id: 3, 
        date: '2025-06-18', 
        title: 'Designer Interview', 
        engagement: 1375, 
        likes: 1040, 
        comments: 112, 
        shares: 203, 
        saves: 20, 
        reach: 17000 
      }
    ],
    dailyMetrics: [
      { date: '2025-06-16', followers: 38700, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-17', followers: 39000, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-18', followers: 39400, engagement: 1375, posts: 1, avgReach: 17000 },
      { date: '2025-06-19', followers: 39800, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-20', followers: 40100, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-21', followers: 40400, engagement: 1550, posts: 1, avgReach: 19000 },
      { date: '2025-06-22', followers: 40700, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-23', followers: 41000, engagement: 0, posts: 0, avgReach: 0 },
      { date: '2025-06-24', followers: 41200, engagement: 1840, posts: 1, avgReach: 22000 }
    ]
  }
};

// Helper Functions
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const Tooltip = ({ visible, x, y, children }) => (
  <div
    className="chart-tooltip"
    style={{
      display: visible ? 'block' : 'none',
      position: 'fixed',
      left: x + 15,
      top: y - 10,
      pointerEvents: 'none',
      zIndex: 9999,
      minWidth: 180,
      background: 'rgba(30,30,30,0.97)',
      border: '1.5px solid #FFD600',
      borderRadius: 8,
      color: '#FFD600',
      padding: '12px 16px',
      fontSize: 15,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      transition: 'opacity 0.2s',
      fontWeight: 500
    }}
    role="tooltip"
    aria-live="polite"
  >
    {children}
  </div>
);

const SocialInsightsDashboard = ({ user }) => {
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0].id);
  const [dateRange, setDateRange] = useState({
    from: '2025-06-16',
    to: '2025-06-24'
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredPost, setHoveredPost] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });
  const chartRef = useRef();
  
  // Determine if the user is a client or employee
  const isClient = user?.role === 'client' || user?.userType === 'client';
  
  // If user is a client, they should automatically see their own data
  useEffect(() => {
    if (isClient && user?.clientId) {
      setSelectedClient(user.clientId);
    } else if (!isClient && MOCK_CLIENTS.length > 0) {
      // Default selection for employees
      setSelectedClient(MOCK_CLIENTS[0].id);
    }
  }, [isClient, user]);
  
  // Fetch data based on selected client, platform, and date range
  useEffect(() => {
    if (!selectedClient) return;
    
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, you would fetch from your backend API
      // const response = await axios.get(`/api/social-insights?clientId=${selectedClient}&platform=${selectedPlatform}&from=${dateRange.from}&to=${dateRange.to}`);
      
      // Use mock data based on client ID
      const clientData = CLIENT_DATA[selectedClient] || CLIENT_DATA[1];
      setData(clientData);
      setLoading(false);
    }, 600);
  }, [selectedClient, selectedPlatform, dateRange]);
  
  // Additional KPIs section for all the specific metrics from the spec
  const getAdditionalKPIs = () => {
    if (!data) return [];
    
    // Calculate average from posts data
    const avgReach = data.posts.reduce((acc, post) => acc + post.reach, 0) / data.posts.length;
    const avgLikes = data.posts.reduce((acc, post) => acc + post.likes, 0) / data.posts.length;
    const avgComments = data.posts.reduce((acc, post) => acc + post.comments, 0) / data.posts.length;
    const avgShares = data.posts.reduce((acc, post) => acc + post.shares, 0) / data.posts.length;
    const avgSaves = data.posts.reduce((acc, post) => acc + post.saves, 0) / data.posts.length;
    
    // Calculate engagement rates
    const totalFollowers = data.kpis.find(kpi => kpi.name === 'Followers')?.value || 1;
    const totalReach = data.kpis.find(kpi => kpi.name === 'Reach')?.value || 1;
    const totalEngagement = data.kpis.find(kpi => kpi.name === 'Engagement')?.value || 0;
    
    // Calculate additional KPIs based on the specification
    return [
      {
        name: 'Reach Rate (Audience)',
        value: ((totalReach / totalFollowers) * 100).toFixed(1) + '%',
        description: 'The percentage of followers who saw your content',
        icon: '📊'
      },
      {
        name: 'Engagement Rate (Audience)',
        value: ((totalEngagement / totalFollowers) * 100).toFixed(1) + '%',
        description: 'The percentage of followers who engaged with your content',
        icon: '📈'
      },
      {
        name: 'Engagement Rate (Reach)',
        value: ((totalEngagement / totalReach) * 100).toFixed(1) + '%',
        description: 'The percentage of reached users who engaged with your content',
        icon: '📉'
      },
      {
        name: 'Avg. Reach per Post',
        value: formatNumber(Math.round(avgReach)),
        description: 'Average number of people who saw each post',
        icon: '🔍'
      },
      {
        name: 'Avg. Likes per Post',
        value: formatNumber(Math.round(avgLikes)),
        description: 'Average number of likes each post received',
        icon: '❤️'
      },
      {
        name: 'Avg. Comments per Post',
        value: formatNumber(Math.round(avgComments)),
        description: 'Average number of comments each post received',
        icon: '💬'
      },
      {
        name: 'Avg. Shares per Post',
        value: formatNumber(Math.round(avgShares)),
        description: 'Average number of shares each post received',
        icon: '↗️'
      },
      {
        name: 'Avg. Saves per Post',
        value: formatNumber(Math.round(avgSaves)),
        description: 'Average number of saves each post received',
        icon: '🔖'
      }
    ];
  };
  
  // Common UI Styles
  const styles = {
    container: {
      backgroundColor: '#111',
      minHeight: '100vh',
      color: '#FFD600',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px',
      overflowY: 'auto'
    },
    innerContainer: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '10px'
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginBottom: '30px'
    },
    clientSelector: {
      backgroundColor: '#1E1E1E',
      color: '#FFD600',
      border: '2px solid #FFD600',
      borderRadius: '8px',
      padding: '10px 15px',
      fontSize: '16px',
      fontWeight: 600,
      width: '250px',
      cursor: 'pointer',
      marginBottom: '15px',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFD600%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px top 50%',
      backgroundSize: '12px auto',
      paddingRight: '28px'
    },
    platformSelector: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '24px'
    },
    platformButton: (active) => ({
      backgroundColor: active ? '#FFD600' : '#1E1E1E',
      color: active ? '#111' : '#FFD600',
      border: '2px solid #FFD600',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      boxShadow: active ? '0 0 10px rgba(255, 214, 0, 0.3)' : 'none'
    }),
    dateContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '24px'
    },
    dateInput: {
      backgroundColor: '#1E1E1E',
      color: '#FFD600',
      border: '2px solid #FFD600',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '14px'
    },
    kpiContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    kpiCard: {
      backgroundColor: '#1E1E1E',
      borderRadius: '12px',
      padding: '20px',
      border: '2px solid #FFD600',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 700,
      marginBottom: '15px',
      color: '#FFD600'
    },
    postsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    postCard: {
      backgroundColor: '#1E1E1E',
      borderRadius: '12px',
      padding: '15px',
      border: '2px solid #FFD600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    },
    postTitle: {
      fontSize: '18px',
      fontWeight: 700,
      marginBottom: '8px'
    },
    postDate: {
      fontSize: '14px',
      color: '#FFD600',
      marginBottom: '10px'
    },
    postStats: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '10px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: '#1E1E1E',
      borderRadius: '12px',
      padding: '30px',
      maxWidth: '500px',
      width: '90%',
      border: '2px solid #FFD600',
      boxShadow: '0 0 20px rgba(255, 214, 0, 0.3)'
    },
    button: {
      backgroundColor: '#FFD600',
      color: '#111',
      border: 'none',
      borderRadius: '6px',
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '15px'
    }
  };

  // Helper for showing tooltips
  const handleShowTooltip = (e, content) => {
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      content
    });
  };
  const handleHideTooltip = () => setTooltip({ ...tooltip, visible: false });

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <div style={styles.header}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '10px', letterSpacing: 1 }}>
            Social Media Insights Dashboard
          </h1>
          
          {/* Client Information */}
          {isClient ? (
            // For clients: show their own client name
            <div style={{ 
              backgroundColor: '#1E1E1E',
              padding: '12px 20px',
              borderRadius: '8px',
              border: '2px solid #FFD600',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                Client: {MOCK_CLIENTS.find(c => c.id === selectedClient)?.name || 'Your Company'}
              </div>
              <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
                Industry: {MOCK_CLIENTS.find(c => c.id === selectedClient)?.industry || 'Technology'}
              </div>
            </div>
          ) : (
            // For employees: show client selector dropdown
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Select Client:
              </label>
              <select
                value={selectedClient || ''}
                onChange={(e) => setSelectedClient(Number(e.target.value))}
                style={styles.clientSelector}
              >
                {MOCK_CLIENTS.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.industry})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Platform Selector */}
          <div style={styles.platformSelector}>
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                style={styles.platformButton(selectedPlatform === platform.id)}
              >
                <span>{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>
          
          {/* Date Range Selector */}
          <div style={styles.dateContainer}>
            <label style={{ fontWeight: 600 }}>Date Range:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              style={styles.dateInput}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              style={styles.dateInput}
            />
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '18px' }}>
            <div style={{ marginBottom: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}>
              Loading insights data...
            </div>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid #1E1E1E', 
              borderRadius: '50%',
              borderTop: '4px solid #FFD600',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '18px' }}>
            <div style={{ marginBottom: '20px' }}>
              {selectedClient ? 
                'No data available for this client.' : 
                'Please select a client to view insights.'
              }
            </div>
          </div>
        ) : (
          <>
            {/* Primary KPIs (First Row) */}
            <div style={styles.kpiContainer}>
              {data.kpis.map((kpi, index) => (
                <div key={index} style={styles.kpiCard}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{kpi.name}</span>
                    <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>
                    {formatNumber(kpi.value)}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: kpi.change >= 0 ? '#4ADE80' : '#F87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '5px'
                  }}>
                    {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%
                  </div>
                </div>
              ))}
            </div>
            
            {/* Section Separator */}
            <div style={{ borderTop: '2px solid #FFD600', margin: '30px 0 30px 0', opacity: 0.15, width: '100%', animation: 'fadeIn 1s' }} />

            {/* Secondary KPIs (Second Row) */}
            <div style={{
              ...styles.kpiContainer,
              marginTop: '20px'
            }}>
              {data.derivedKpis.map((kpi, index) => (
                <div key={index} style={{
                  ...styles.kpiCard,
                  backgroundColor: '#222',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{kpi.name}</span>
                    <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>
                    {kpi.name.includes('Rate') ? `${kpi.value}%` : formatNumber(kpi.value)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Section Separator */}
            <div style={{ borderTop: '2px solid #FFD600', margin: '30px 0 30px 0', opacity: 0.15, width: '100%', animation: 'fadeIn 1s' }} />

            {/* Additional KPIs (New Section) */}
            <div style={{
              ...styles.kpiContainer,
              marginTop: '20px'
            }}>
              {getAdditionalKPIs().map((kpi, index) => (
                <div key={index} style={{
                  ...styles.kpiCard,
                  backgroundColor: '#222',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{kpi.name}</span>
                    <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Section Separator */}
            <div style={{ borderTop: '2px solid #FFD600', margin: '30px 0 30px 0', opacity: 0.15, width: '100%', animation: 'fadeIn 1s' }} />

            {/* Followers Growth Timeline with modern grid, smooth curve, and tidy layout */}
            <div style={{ marginTop: '30px', marginBottom: '30px', position: 'relative' }}>
              <h2 style={styles.sectionTitle}>Followers Growth Timeline</h2>
              <div
                ref={chartRef}
                style={{
                  background: 'linear-gradient(180deg, #181818 60%, #222 100%)',
                  borderRadius: '16px',
                  padding: '32px 32px 24px 48px',
                  border: '2px solid #FFD600',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                  height: '320px',
                  position: 'relative',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  overflow: 'visible',
                  animation: 'fadeInUp 0.7s'
                }}
                role="img"
                aria-label="Followers growth chart showing daily follower count for the selected date range"
                className="chart-container"
              >
                {/* Grid lines and Y axis labels */}
                <svg width="100%" height="220" style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, pointerEvents: 'none' }}>
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                    const maxFollowers = Math.max(...data.dailyMetrics.map(d => d.followers));
                    const minFollowers = Math.min(...data.dailyMetrics.map(d => d.followers));
                    const range = maxFollowers - minFollowers || 1;
                    const y = 200 * t + 10;
                    const label = Math.round(maxFollowers - t * range);
                    return (
                      <g key={i}>
                        <line x1={48} x2={'calc(100% - 32px)'} y1={y} y2={y} stroke="#FFD60022" strokeWidth={1} />
                        <text x={0} y={y + 4} fill="#FFD60099" fontSize={13} fontWeight={500}>{formatNumber(label)}</text>
                      </g>
                    );
                  })}
                </svg>
                {/* Smooth curve for followers */}
                <svg width="100%" height="220" style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, pointerEvents: 'none' }}>
                  {data && data.dailyMetrics.length > 1 && (
                    <path
                      d={(() => {
                        // Catmull-Rom to Bezier for smooth curve
                        const N = data.dailyMetrics.length;
                        const leftPad = 48, rightPad = 32;
                        const chartW = 1200 - leftPad - rightPad;
                        const points = data.dailyMetrics.map((day, i) => {
                          const x = leftPad + (i / (N - 1)) * chartW;
                          const maxFollowers = Math.max(...data.dailyMetrics.map(d => d.followers));
                          const minFollowers = Math.min(...data.dailyMetrics.map(d => d.followers));
                          const range = maxFollowers - minFollowers || 1;
                          const y = 200 - ((day.followers - minFollowers) / range) * 180 + 10;
                          return [x, y];
                        });
                        let d = '';
                        for (let i = 0; i < points.length; i++) {
                          const [x, y] = points[i];
                          if (i === 0) {
                            d += `M${x},${y}`;
                          } else {
                            const [x0, y0] = points[i - 1];
                            const [x1, y1] = points[i];
                            const [x2, y2] = points[i + 1] || points[i];
                            const [x3, y3] = points[i + 2] || points[i];
                            const cp1x = x0 + (x1 - (points[i - 2]?.[0] || x0)) / 6;
                            const cp1y = y0 + (y1 - (points[i - 2]?.[1] || y0)) / 6;
                            const cp2x = x1 - (x2 - x0) / 6;
                            const cp2y = y1 - (y2 - y0) / 6;
                            d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
                          }
                        }
                        return d;
                      })()}
                      fill="none"
                      stroke="#FFD600"
                      strokeWidth="3"
                      style={{ filter: 'drop-shadow(0 2px 8px #FFD60044)' }}
                    />
                  )}
                </svg>
                {/* Data points exactly on the curve */}
                {data.dailyMetrics.map((day, index) => {
                  const N = data.dailyMetrics.length;
                  const leftPad = 48, rightPad = 32;
                  const chartW = 1200 - leftPad - rightPad;
                  const x = leftPad + (index / (N - 1)) * chartW;
                  const maxFollowers = Math.max(...data.dailyMetrics.map(d => d.followers));
                  const minFollowers = Math.min(...data.dailyMetrics.map(d => d.followers));
                  const range = maxFollowers - minFollowers || 1;
                  const y = 200 - ((day.followers - minFollowers) / range) * 180 + 10;
                  return (
                    <div
                      key={index}
                      style={{ position: 'absolute', left: x - 9, top: y - 9, width: 18, height: 18, zIndex: 10 }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: hoveredDay === day ? 'linear-gradient(180deg, #FFD600 60%, #fffbe6 100%)' : '#FFD600',
                          border: hoveredDay === day ? '3px solid #fffbe6' : '2px solid #FFD600',
                          boxShadow: hoveredDay === day ? '0 0 16px #FFD60088' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s, box-shadow 0.2s, border 0.2s',
                          animation: 'popIn 0.5s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={e => {
                          setHoveredDay(day);
                          handleShowTooltip(e, (
                            <>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{day.date}</div>
                              <div>Followers: <b>{formatNumber(day.followers)}</b></div>
                              <div>Engagement: <b>{formatNumber(day.engagement)}</b></div>
                              <div>Posts: <b>{day.posts}</b></div>
                              {day.avgReach > 0 && <div>Avg. Reach: <b>{formatNumber(day.avgReach)}</b></div>}
                            </>
                          ));
                        }}
                        onMouseLeave={handleHideTooltip}
                        aria-label={`${day.date}: ${formatNumber(day.followers)} followers${day.posts > 0 ? `, with ${day.posts} post published` : ''}`}
                        className="chart-dot"
                      >
                        {day.posts > 0 && <span role="img" aria-label="camera" style={{ fontSize: 16, marginLeft: 1 }}>📸</span>}
                      </div>
                    </div>
                  );
                })}
                {/* X axis labels */}
                <div style={{ position: 'absolute', left: 48, bottom: 8, width: 1120, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {data.dailyMetrics.map((day, index) => (
                    <div key={index} style={{ fontSize: '13px', color: '#FFD600cc', fontWeight: 500, minWidth: 60, textAlign: 'center' }}>{day.date.slice(5)}</div>
                  ))}
                </div>
                <Tooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y}>{tooltip.content}</Tooltip>
              </div>
            </div>

            {/* Section Separator */}
            <div style={{ borderTop: '2px solid #FFD600', margin: '30px 0 30px 0', opacity: 0.15, width: '100%', animation: 'fadeIn 1s' }} />

            {/* Reach Distribution Chart with modern grid, smooth curve, and tidy layout */}
            <div style={{ marginBottom: '30px', position: 'relative' }}>
              <h2 style={styles.sectionTitle}>Reach Distribution</h2>
              <div
                style={{
                  background: 'linear-gradient(180deg, #181818 60%, #222 100%)',
                  borderRadius: '16px',
                  padding: '32px 32px 24px 48px',
                  border: '2px solid #FFD600',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                  height: '320px',
                  position: 'relative',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  overflow: 'visible',
                  animation: 'fadeInUp 0.7s'
                }}
                role="img"
                aria-label="Reach distribution chart showing reach values for each post"
                className="chart-container"
              >
                {/* Grid lines and Y axis labels */}
                <svg width="100%" height="220" style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, pointerEvents: 'none' }}>
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                    const maxReach = Math.max(...data.posts.map(p => p.reach));
                    const minReach = Math.min(...data.posts.map(p => p.reach));
                    const range = maxReach - minReach || 1;
                    const y = 200 * t + 10;
                    const label = Math.round(maxReach - t * range);
                    return (
                      <g key={i}>
                        <line x1={48} x2={'calc(100% - 32px)'} y1={y} y2={y} stroke="#FFD60022" strokeWidth={1} />
                        <text x={0} y={y + 4} fill="#FFD60099" fontSize={13} fontWeight={500}>{formatNumber(label)}</text>
                      </g>
                    );
                  })}
                </svg>
                {/* Smooth curve for reach */}
                <svg width="100%" height="220" style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, pointerEvents: 'none' }}>
                  {data && data.posts.length > 1 && (
                    <path
                      d={(() => {
                        // Catmull-Rom to Bezier for smooth curve
                        const N = data.posts.length;
                        const leftPad = 48, rightPad = 32;
                        const chartW = 1200 - leftPad - rightPad;
                        const points = data.posts.map((post, i) => {
                          const x = leftPad + (i / (N - 1)) * chartW;
                          const maxReach = Math.max(...data.posts.map(p => p.reach));
                          const minReach = Math.min(...data.posts.map(p => p.reach));
                          const range = maxReach - minReach || 1;
                          const y = 200 - ((post.reach - minReach) / range) * 180 + 10;
                          return [x, y];
                        });
                        let d = '';
                        for (let i = 0; i < points.length; i++) {
                          const [x, y] = points[i];
                          if (i === 0) {
                            d += `M${x},${y}`;
                          } else {
                            const [x0, y0] = points[i - 1];
                            const [x1, y1] = points[i];
                            const [x2, y2] = points[i + 1] || points[i];
                            const [x3, y3] = points[i + 2] || points[i];
                            const cp1x = x0 + (x1 - (points[i - 2]?.[0] || x0)) / 6;
                            const cp1y = y0 + (y1 - (points[i - 2]?.[1] || y0)) / 6;
                            const cp2x = x1 - (x2 - x0) / 6;
                            const cp2y = y1 - (y2 - y0) / 6;
                            d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
                          }
                        }
                        return d;
                      })()}
                      fill="none"
                      stroke="#FFD600"
                      strokeWidth="3"
                      style={{ filter: 'drop-shadow(0 2px 8px #FFD60044)' }}
                    />
                  )}
                </svg>
                {/* Data points exactly on the curve */}
                {data.posts.map((post, index) => {
                  const N = data.posts.length;
                  const leftPad = 48, rightPad = 32;
                  const chartW = 1200 - leftPad - rightPad;
                  const x = leftPad + (index / (N - 1)) * chartW;
                  const maxReach = Math.max(...data.posts.map(p => p.reach));
                  const minReach = Math.min(...data.posts.map(p => p.reach));
                  const range = maxReach - minReach || 1;
                  const y = 200 - ((post.reach - minReach) / range) * 180 + 10;
                  return (
                    <div key={index} style={{ position: 'absolute', left: x - 9, top: y - 9, width: 18, height: 18, zIndex: 10 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: hoveredPost === post ? 'linear-gradient(180deg, #FFD600 60%, #fffbe6 100%)' : '#FFD600',
                          border: hoveredPost === post ? '3px solid #fffbe6' : '2px solid #FFD600',
                          boxShadow: hoveredPost === post ? '0 0 16px #FFD60088' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s, box-shadow 0.2s, border 0.2s',
                          animation: 'popIn 0.5s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={e => {
                          setHoveredPost(post);
                          handleShowTooltip(e, (
                            <>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{post.title}</div>
                              <div>Date: <b>{post.date}</b></div>
                              <div>Reach: <b>{formatNumber(post.reach)}</b></div>
                              <div>Likes: <b>{formatNumber(post.likes)}</b></div>
                              <div>Comments: <b>{formatNumber(post.comments)}</b></div>
                              <div>Shares: <b>{formatNumber(post.shares)}</b></div>
                              <div>Saves: <b>{formatNumber(post.saves)}</b></div>
                              <div>Engagement: <b>{formatNumber(post.engagement)}</b></div>
                            </>
                          ));
                        }}
                        onMouseLeave={handleHideTooltip}
                        aria-label={`Post "${post.title}" from ${post.date} with ${formatNumber(post.reach)} reach. Click to view details.`}
                        className="chart-dot"
                      />
                    </div>
                  );
                })}
                {/* X axis labels */}
                <div style={{ position: 'absolute', left: 48, bottom: 8, width: 1120, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {data.posts.map((post, index) => (
                    <div key={index} style={{ fontSize: '13px', color: '#FFD600cc', fontWeight: 500, minWidth: 60, textAlign: 'center' }}>{post.date.slice(5)}</div>
                  ))}
                </div>
                {/* Average Line */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'calc(100% - 80px)',
                    borderTop: '2px dashed #777',
                    top: '40%',
                    left: '48px',
                    zIndex: 1
                  }}
                  aria-label={`Average reach: ${formatNumber(Math.round(data.posts.reduce((acc, post) => acc + post.reach, 0) / data.posts.length))}`}
                >
                  <span style={{
                    position: 'absolute',
                    right: '0',
                    top: '-20px',
                    fontSize: '12px',
                    color: '#777'
                  }}>
                    Avg Reach: {formatNumber(Math.round(data.posts.reduce((acc, post) => acc + post.reach, 0) / data.posts.length))}
                  </span>
                </div>
                <Tooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y}>{tooltip.content}</Tooltip>
              </div>
            </div>
            
            {/* Recent Posts */}
            <h2 style={styles.sectionTitle}>Recent Posts</h2>
            <div style={styles.postsContainer}>
              {data.posts.map(post => (
                <div 
                  key={post.id} 
                  style={styles.postCard}
                  onClick={() => setSelectedPost(post)}
                >
                  <div style={styles.postTitle}>{post.title}</div>
                  <div style={styles.postDate}>{post.date}</div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginTop: '15px'
                  }}>
                    <div>
                      <span style={{ marginRight: '5px' }}>👁️</span>
                      {formatNumber(post.reach)}
                    </div>
                    <div>
                      <span style={{ marginRight: '5px' }}>❤️</span>
                      {formatNumber(post.likes)}
                    </div>
                    <div>
                      <span style={{ marginRight: '5px' }}>💬</span>
                      {formatNumber(post.comments)}
                    </div>
                    <div>
                      <span style={{ marginRight: '5px' }}>↗️</span>
                      {formatNumber(post.shares)}
                    </div>
                    <div>
                      <span style={{ marginRight: '5px' }}>🔖</span>
                      {formatNumber(post.saves)}
                    </div>
                  </div>
                  <div style={styles.postStats}>
                    <div>Total Engagement:</div>
                    <div style={{ fontWeight: 700 }}>{formatNumber(post.engagement)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Post Detail Modal */}
        {selectedPost && (
          <div 
            style={styles.modalOverlay}
            onClick={() => setSelectedPost(null)}
          >
            <div 
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '10px' }}>
                {selectedPost.title}
              </h2>
              <div style={{ fontSize: '16px', marginBottom: '20px' }}>
                Posted on {selectedPost.date}
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                marginBottom: '20px' 
              }}>
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>👁️</span> Reach
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatNumber(selectedPost.reach)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>❤️</span> Likes
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatNumber(selectedPost.likes)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>💬</span> Comments
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatNumber(selectedPost.comments)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>↗️</span> Shares
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatNumber(selectedPost.shares)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>🔖</span> Saves
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatNumber(selectedPost.saves)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>⚡</span> Total Engagement
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatNumber(selectedPost.engagement)}
                  </div>
                </div>
              </div>
              
              {/* Calculated metrics */}
              <div style={{ 
                backgroundColor: '#282828', 
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#FFD600' }}>Performance Metrics</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '15px'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.8 }}>Engagement Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                      {((selectedPost.engagement / selectedPost.reach) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.8 }}>Like Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                      {((selectedPost.likes / selectedPost.reach) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.8 }}>Comment Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                      {((selectedPost.comments / selectedPost.reach) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.8 }}>Share Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                      {((selectedPost.shares / selectedPost.reach) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                style={styles.button}
                onClick={() => setSelectedPost(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialInsightsDashboard;
