import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
// import HeaderBar from './HeaderBar';
import './SocialMediaInsightsDashboard.css';
import { EngagementAreaChart, ReachLineChart, FollowersTimelineChart } from './Charts';
import ConnectTikTokButton from './ConnectTikTokButton';

// Remove all chart rendering if data is not valid, and log the data for debugging
function isValidChartData(data) {
  return Array.isArray(data) && data.length > 0 && data.every(d => typeof d === 'object' && !Array.isArray(d) && d !== null && !React.isValidElement(d));
}

// Central store context for cross-widget coordination
const InsightsContext = createContext();

const PLATFORMS = [
  { name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' },
  { name: 'TikTok', icon: 'fab fa-tiktok', color: '#000000' },
  { name: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0077B5' },
  { name: 'YouTube', icon: 'fab fa-youtube', color: '#FF0000' },
  { name: 'Twitter', icon: 'fab fa-twitter', color: '#1DA1F2' },
];

// Helper Functions
function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function calculatePercentChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
}

// Mock API function
async function fetchInsights(clientId, platform, dateRange) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockData = generateMockInsightsData(platform, dateRange);
  return mockData;
}

function generateMockInsightsData(platform, dateRange) {
  const currentPeriod = {
    followers: Math.floor(Math.random() * 50000) + 10000,
    reach: Math.floor(Math.random() * 100000) + 20000,
    engagement: Math.floor(Math.random() * 5000) + 1000,
    posts: Math.floor(Math.random() * 15) + 5
  };
  
  const previousPeriod = {
    followers: Math.floor(currentPeriod.followers * (0.8 + Math.random() * 0.4)),
    reach: Math.floor(currentPeriod.reach * (0.8 + Math.random() * 0.4)),
    engagement: Math.floor(currentPeriod.engagement * (0.8 + Math.random() * 0.4)),
    posts: Math.floor(currentPeriod.posts * (0.8 + Math.random() * 0.4))
  };
  
  // Derived rates
  const reachRate = currentPeriod.posts > 0 ? (currentPeriod.reach / currentPeriod.followers * 100).toFixed(1) : 0;
  const engagementRate = currentPeriod.reach > 0 ? (currentPeriod.engagement / currentPeriod.reach * 100).toFixed(1) : 0;
  const avgPerPost = currentPeriod.posts > 0 ? Math.floor(currentPeriod.engagement / currentPeriod.posts) : 0;
  
  // Generate time series data
  const posts = generateMockPosts(currentPeriod.posts);
  const engagementByPost = posts.map(post => ({
    postId: post.id,
    title: post.title,
    engagement: post.engagement,
    date: post.date
  }));
  
  const reachByPost = posts.map(post => ({
    postId: post.id,
    reach: post.reach,
    meanReach: Math.floor(currentPeriod.reach / currentPeriod.posts)
  }));
  
  const followersByDay = generateFollowerTimeline(currentPeriod.followers, posts);
  
  return {
    currentPeriod,
    previousPeriod,
    derivedRates: {
      reachRate,
      engagementRate,
      avgPerPost
    },
    timeSeries: {
      engagementByPost,
      reachByPost,
      followersByDay
    },
    posts
  };
}

function generateMockPosts(count) {
  const posts = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i * 2);
    
    posts.push({
      id: `post_${i}`,
      title: `Post ${i + 1}: ${['Amazing content', 'Behind the scenes', 'Product showcase', 'Team update', 'Customer story'][i % 5]}`,
      date: date.toISOString().split('T')[0],
      thumbnail: `https://picsum.photos/200/200?random=${i}`,
      reach: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 50) + 5,
      saves: Math.floor(Math.random() * 100) + 10,
      engagement: 0 // Will be calculated
    });
  }
  
  // Calculate engagement scores
  posts.forEach(post => {
    post.engagement = post.likes + post.comments + post.shares + post.saves;
  });
  
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateFollowerTimeline(currentFollowers, posts) {
  const timeline = [];
  const postDates = new Set(posts.map(p => p.date));
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const followers = Math.floor(currentFollowers - (Math.random() * 1000) + (Math.random() * 500));
    const hasPost = postDates.has(dateStr);
    const post = hasPost ? posts.find(p => p.date === dateStr) : null;
    
    timeline.push({
      date: dateStr,
      followers,
      hasPost,
      postTitle: post?.title || null,
      postId: post?.id || null
    });
  }
  
  return timeline;
}

// Main Dashboard Component
export default function SocialMediaInsightsDashboard({ user, onLogout, onLogoClick }) {
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [clientId] = useState(1); // Mock client ID
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [insightsData, setInsightsData] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredDonut, setHoveredDonut] = useState(null);
  const [fadeKey, setFadeKey] = useState(0);

  // Tooltip handlers
  function showDayTooltip(i) { setHoveredDay(i); }
  function hideDayTooltip() { setHoveredDay(null); }
  function showBarTooltip(i) { setHoveredBar(i); }
  function hideBarTooltip() { setHoveredBar(null); }
  function showDonutTooltip(i) { setHoveredDonut(i); }
  function hideDonutTooltip() { setHoveredDonut(null); }

  // Random helpers
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randomFloat(min, max, d=1) {
    return (Math.random() * (max - min) + min).toFixed(d);
  }

  // Fetch insights data
  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await fetchInsights(clientId, selectedPlatform, dateRange);
      setInsightsData(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadInsights();
  }, [selectedPlatform, dateRange.from, dateRange.to]);

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

  return (
    <InsightsContext.Provider value={contextValue}>
      <div className="smidash-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #181818 60%, #232323 100%)', color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 40 }}>
        {/* <HeaderBar user={user} onLogout={onLogout} onLogoClick={onLogoClick} /> */}
        <div style={{ maxWidth: 1200, margin: '32px auto 0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -1, outline: 0 }} tabIndex={0} aria-label="Social Insights Dashboard">Social Insights</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
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
            <div style={{ flex: 1 }} />
            <label style={{ color: '#FFD600', fontWeight: 600, marginRight: 8 }}>From:</label>
            <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} style={{ background: '#232323', color: '#FFD600', border: '1px solid #FFD600', borderRadius: 6, padding: '4px 8px', marginRight: 12 }} />
            <label style={{ color: '#FFD600', fontWeight: 600, marginRight: 8 }}>To:</label>
            <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} style={{ background: '#232323', color: '#FFD600', border: '1px solid #FFD600', borderRadius: 6, padding: '4px 8px' }} />
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
                const appId = '1210083453389693';
                const redirectUri = 'https://localhost:3000/meta-callback';
                const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile,email,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement&response_type=code`;
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
          {loading && <div className="spinner" role="status" aria-live="polite" aria-label="Loading insights"></div>}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            {/* Primary KPIs */}
            <div style={{ flex: 2, display: 'flex', gap: 16 }}>
              {['followers', 'reach', 'engagement', 'posts'].map((k, idx) => (
                <div key={k} style={{ background: '#232323', borderRadius: 14, padding: '18px 24px', flex: 1, boxShadow: '0 2px 12px #0004', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  tabIndex={0} aria-label={`KPI: ${k}, value: ${formatNumber(insightsData?.currentPeriod?.[k] || 0)}, change: ${calculatePercentChange(insightsData?.currentPeriod?.[k], insightsData?.previousPeriod?.[k])}%`} title={`${k.charAt(0).toUpperCase() + k.slice(1)}: ${formatNumber(insightsData?.currentPeriod?.[k] || 0)} (${calculatePercentChange(insightsData?.currentPeriod?.[k], insightsData?.previousPeriod?.[k])}%)`}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#FFD600', marginBottom: 2 }}>{formatNumber(insightsData?.currentPeriod?.[k] || 0)}</div>
                  <div style={{ fontSize: 13, color: '#fff', opacity: 0.7, fontWeight: 600, marginBottom: 2, textTransform: 'capitalize' }}>{k}</div>
                  <div style={{ fontSize: 12, color: (calculatePercentChange(insightsData?.currentPeriod?.[k], insightsData?.previousPeriod?.[k]) >= 0 ? '#00E676' : '#FF1744'), fontWeight: 700 }}>
                    {calculatePercentChange(insightsData?.currentPeriod?.[k], insightsData?.previousPeriod?.[k])}%
                  </div>
                </div>
              ))}
            </div>
            {/* Secondary KPIs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#232323', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 12px #0004', fontSize: 15, fontWeight: 700, color: '#FFD600' }}>
                Reach Rate: <span style={{ color: '#fff', fontWeight: 800 }}>{insightsData?.derivedRates?.reachRate || 0}%</span>
              </div>
              <div style={{ background: '#232323', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 12px #0004', fontSize: 15, fontWeight: 700, color: '#FFD600' }}>
                Engagement Rate: <span style={{ color: '#fff', fontWeight: 800 }}>{insightsData?.derivedRates?.engagementRate || 0}%</span>
              </div>
              <div style={{ background: '#232323', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 12px #0004', fontSize: 15, fontWeight: 700, color: '#FFD600' }}>
                Avg. per Post: <span style={{ color: '#fff', fontWeight: 800 }}>{formatNumber(insightsData?.derivedRates?.avgPerPost || 0)}</span>
              </div>
            </div>
          </div>
          {/* Charts Row */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            <div style={{ flex: 2, background: '#232323', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px #0004' }}>
              <h3 style={{ color: '#FFD600', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Engagement Distribution</h3>
              <div style={{ height: 180, background: '#181818', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD600', fontWeight: 700 }}>
                Chart removed due to rendering error
              </div>
            </div>
            <div style={{ flex: 1, background: '#232323', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px #0004' }}>
              <h3 style={{ color: '#FFD600', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Organic Reach Distribution</h3>
              <div style={{ height: 180, background: '#181818', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD600', fontWeight: 700 }}>
                Chart removed due to rendering error
              </div>
            </div>
          </div>
          {/* Followers Growth Timeline */}
          <div style={{ background: '#232323', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px #0004', marginBottom: 32 }}>
            <h3 style={{ color: '#FFD600', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Followers Growth Timeline</h3>
            <div style={{ height: 180, background: '#181818', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD600', fontWeight: 700 }}>
              Chart removed due to rendering error
            </div>
          </div>
          {/* Post Timeline List */}
          <div style={{ background: '#232323', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px #0004', marginBottom: 32 }}>
            <h3 style={{ color: '#FFD600', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Post Timeline</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              {insightsData?.posts && insightsData.posts.length > 0 ? (
                insightsData.posts.map(post => (
                  <div
                    key={post.id}
                    style={{
                      width: 220,
                      background: '#181818',
                      borderRadius: 10,
                      boxShadow: '0 2px 8px #0003',
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                      border: selectedPostId === post.id ? '2px solid #FFD600' : '2px solid transparent'
                    }}
                    onClick={() => setSelectedPostId(post.id)}
                    onMouseEnter={() => setHoveredBar(post.id)}
                    onMouseLeave={() => setHoveredBar(null)}
                    tabIndex={0}
                    aria-label={`Post: ${post.title}, Reach: ${formatNumber(post.reach)}, Likes: ${formatNumber(post.likes)}, Comments: ${formatNumber(post.comments)}`}
                    title={`${post.title} | Reach: ${formatNumber(post.reach)} | Likes: ${formatNumber(post.likes)} | Comments: ${formatNumber(post.comments)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedPostId(post.id);
                    }}
                  >
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                    />
                    <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 15, marginBottom: 2 }}>{post.title}</div>
                    <div style={{ fontSize: 12, color: '#fff', opacity: 0.7, marginBottom: 2 }}>{post.date}</div>
                    <div style={{ fontSize: 13, color: '#FFD600', fontWeight: 700 }}>Reach: {formatNumber(post.reach)}</div>
                    <div style={{ fontSize: 13, color: '#FFD600', fontWeight: 700 }}>Likes: {formatNumber(post.likes)}</div>
                    <div style={{ fontSize: 13, color: '#FFD600', fontWeight: 700 }}>Comments: {formatNumber(post.comments)}</div>
                  </div>
                ))
              ) : (
                <div>No posts available</div>
              )}
            </div>
          </div>
          {/* Post Details Modal */}
          {showPostModal && selectedPostId && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#232323', borderRadius: 16, padding: 32, minWidth: 340, boxShadow: '0 4px 32px #0008', position: 'relative' }}>
                <button onClick={() => setShowPostModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#FFD600', fontSize: 28, fontWeight: 900, cursor: 'pointer' }} aria-label="Close post details modal">×</button>
                {(() => {
                  const post = insightsData?.posts?.find(p => p.id === selectedPostId);
                  if (!post) return <div>No post found</div>;
                  return (
                    <>
                      <img src={post.thumbnail} alt={post.title} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }} />
                      <div style={{ fontWeight: 800, color: '#FFD600', fontSize: 20, marginBottom: 6 }}>{post.title}</div>
                      <div style={{ fontSize: 13, color: '#fff', opacity: 0.7, marginBottom: 8 }}>{post.date}</div>
                      <div style={{ display: 'flex', gap: 18, marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 15 }}>Reach: {formatNumber(post.reach)}</div>
                        <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 15 }}>Likes: {formatNumber(post.likes)}</div>
                        <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 15 }}>Comments: {formatNumber(post.comments)}</div>
                      </div>
                      <div style={{ fontSize: 14, color: '#FFD600', fontWeight: 700 }}>Shares: {formatNumber(post.shares)} | Saves: {formatNumber(post.saves)}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </InsightsContext.Provider>
  );
}