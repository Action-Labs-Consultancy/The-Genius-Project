import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const ContentAdsSection = ({ data, posts, socialConnections }) => {
  const [hoveredAd, setHoveredAd] = useState(null);
  const [hoveredPost, setHoveredPost] = useState(null);

  // Mock top ads data (would come from social media APIs)
  const topAds = data?.topAds || [
    {
      id: 1,
      title: 'Summer Finance Campaign',
      platform: 'TikTok',
      installs: 1250,
      cpi: 2.45,
      reach: 45000,
      engagement: 8.2,
      likes: 3200,
      comments: 890,
      shares: 450,
      thumbnail: '🎯'
    },
    {
      id: 2,
      title: 'Quick Loan Approval',
      platform: 'Meta',
      installs: 980,
      cpi: 3.12,
      reach: 32000,
      engagement: 6.8,
      likes: 2100,
      comments: 560,
      shares: 320,
      thumbnail: '⚡'
    },
    {
      id: 3,
      title: 'Student Finance Solutions',
      platform: 'TikTok',
      installs: 750,
      cpi: 2.89,
      reach: 28000,
      engagement: 9.1,
      likes: 2800,
      comments: 720,
      shares: 410,
      thumbnail: '🎓'
    },
    {
      id: 4,
      title: 'Micro-Financing Made Easy',
      platform: 'Meta',
      installs: 650,
      cpi: 3.45,
      reach: 25000,
      engagement: 7.5,
      likes: 1900,
      comments: 480,
      shares: 290,
      thumbnail: '💰'
    },
    {
      id: 5,
      title: 'Instant Credit Card',
      platform: 'TikTok',
      installs: 580,
      cpi: 2.78,
      reach: 22000,
      engagement: 8.7,
      likes: 1700,
      comments: 390,
      shares: 260,
      thumbnail: '💳'
    }
  ];

  // Mock top content data
  const topContent = posts.length > 0 ? posts.slice(0, 5) : [
    {
      id: 1,
      title: 'Financial Tips for Young Adults',
      platform: 'TikTok',
      likes: 4200,
      comments: 890,
      shares: 650,
      reach: 55000,
      engagement: 12.3,
      ctr: 4.2,
      thumbnail: '💡'
    },
    {
      id: 2,
      title: 'Budget Planning Made Simple',
      platform: 'Meta',
      likes: 3100,
      comments: 720,
      shares: 480,
      reach: 42000,
      engagement: 10.5,
      ctr: 3.8,
      thumbnail: '📊'
    },
    {
      id: 3,
      title: 'Success Stories: Our Users',
      platform: 'TikTok',
      likes: 2800,
      comments: 650,
      shares: 420,
      reach: 38000,
      engagement: 11.8,
      ctr: 4.1,
      thumbnail: '🌟'
    },
    {
      id: 4,
      title: 'Quick Finance FAQ',
      platform: 'Meta',
      likes: 2400,
      comments: 580,
      shares: 350,
      reach: 34000,
      engagement: 9.7,
      ctr: 3.5,
      thumbnail: '❓'
    },
    {
      id: 5,
      title: 'Behind the Scenes',
      platform: 'TikTok',
      likes: 2100,
      comments: 490,
      shares: 310,
      reach: 31000,
      engagement: 10.2,
      ctr: 3.9,
      thumbnail: '🎬'
    }
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="content-ads-section">
      {/* Top 5 Ads */}
      <div className="top-ads">
        <h3>Top 5 Ads (Based on Installs)</h3>
        <div className="ads-grid">
          {topAds.map((ad, index) => (
            <div
              key={ad.id}
              className="ad-card"
              onMouseEnter={() => setHoveredAd(index)}
              onMouseLeave={() => setHoveredAd(null)}
            >
              <div className="ad-header">
                <div className="ad-thumbnail">{ad.thumbnail}</div>
                <div className="ad-info">
                  <h4>{ad.title}</h4>
                  <span className="ad-platform">{ad.platform}</span>
                </div>
                <div className="ad-rank">#{index + 1}</div>
              </div>
              
              <div className="ad-metrics">
                <div className="metric">
                  <span className="metric-label">Installs</span>
                  <span className="metric-value">{formatNumber(ad.installs)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">CPI</span>
                  <span className="metric-value">${ad.cpi}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Reach</span>
                  <span className="metric-value">{formatNumber(ad.reach)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Engagement</span>
                  <span className="metric-value">{ad.engagement}%</span>
                </div>
              </div>
              
              {hoveredAd === index && (
                <div className="ad-tooltip">
                  <h4>Detailed Engagement</h4>
                  <div className="engagement-details">
                    <p><strong>Likes:</strong> {formatNumber(ad.likes)}</p>
                    <p><strong>Comments:</strong> {formatNumber(ad.comments)}</p>
                    <p><strong>Shares:</strong> {formatNumber(ad.shares)}</p>
                    <p><strong>Total Reach:</strong> {formatNumber(ad.reach)}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Content */}
      <div className="top-content">
        <h3>Top 5 Content (Based on Engagement)</h3>
        <div className="content-grid">
          {topContent.map((content, index) => (
            <div
              key={content.id}
              className="content-card"
              onMouseEnter={() => setHoveredPost(index)}
              onMouseLeave={() => setHoveredPost(null)}
            >
              <div className="content-header">
                <div className="content-thumbnail">{content.thumbnail}</div>
                <div className="content-info">
                  <h4>{content.title}</h4>
                  <span className="content-platform">{content.platform}</span>
                </div>
                <div className="content-rank">#{index + 1}</div>
              </div>
              
              <div className="content-metrics">
                <div className="metric">
                  <span className="metric-label">Likes</span>
                  <span className="metric-value">{formatNumber(content.likes)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Comments</span>
                  <span className="metric-value">{formatNumber(content.comments)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Shares</span>
                  <span className="metric-value">{formatNumber(content.shares)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Engagement</span>
                  <span className="metric-value">{content.engagement}%</span>
                </div>
              </div>
              
              {hoveredPost === index && (
                <div className="content-tooltip">
                  <h4>Performance Insights</h4>
                  <div className="performance-details">
                    <p><strong>Reach:</strong> {formatNumber(content.reach)}</p>
                    <p><strong>CTR:</strong> {content.ctr}%</p>
                    <p><strong>Engagement Rate:</strong> {content.engagement}%</p>
                    <p><strong>Performance:</strong> {content.engagement > 10 ? 'Excellent' : content.engagement > 7 ? 'Good' : 'Average'}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Insights */}
      <div className="engagement-insights">
        <h3>Engagement Insights</h3>
        <div className="insights-container">
          <div className="platform-performance">
            <h4>Platform Performance</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { platform: 'TikTok', engagement: 10.2, reach: 180000, installs: 2580 },
                { platform: 'Meta', engagement: 8.5, reach: 133000, installs: 1630 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#3b82f6" name="Engagement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="content-trends">
            <h4>Content Performance Trends</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { week: 'Week 1', likes: 12000, comments: 2800, shares: 1600 },
                { week: 'Week 2', likes: 15000, comments: 3200, shares: 1900 },
                { week: 'Week 3', likes: 18000, comments: 3800, shares: 2200 },
                { week: 'Week 4', likes: 16000, comments: 3400, shares: 1950 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="likes" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="shares" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <h3>Data Sources</h3>
        <div className="status-grid">
          <div className={`status-item ${socialConnections.tiktok?.connected ? 'connected' : 'disconnected'}`}>
            <div className="status-icon">📱</div>
            <div className="status-info">
              <h4>TikTok Integration</h4>
              <p>{socialConnections.tiktok?.connected ? 'Connected - Real-time data' : 'Disconnected - Using sample data'}</p>
            </div>
          </div>
          
          <div className={`status-item ${socialConnections.meta?.connected ? 'connected' : 'disconnected'}`}>
            <div className="status-icon">📘</div>
            <div className="status-info">
              <h4>Meta Integration</h4>
              <p>{socialConnections.meta?.connected ? 'Connected - Real-time data' : 'Disconnected - Using sample data'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAdsSection;
