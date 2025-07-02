import React from 'react';
import { useInsightsStore } from './insightsStore';

const ICONS = {
  followers: '👥',
  reach: '👁',
  engagement: '❤️',
  posts: '📝',
};

function formatNumber(n) {
  if (n >= 10000) return (n/1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function InsightsKPIHeadlineTiles() {
  const { insights, loading } = useInsightsStore();
  if (!insights) return (
    <div className="kpi-headline-tiles">
      {[1,2,3,4].map(i => <div key={i} className="kpi-tile kpi-tile-skeleton" />)}
    </div>
  );
  const kpis = [
    { key: 'followers', label: 'Followers', icon: ICONS.followers, value: insights.summary.followers.current, prev: insights.summary.followers.previous },
    { key: 'reach', label: 'Reach', icon: ICONS.reach, value: insights.summary.reach.current, prev: insights.summary.reach.previous },
    { key: 'engagement', label: 'Engagement', icon: ICONS.engagement, value: insights.summary.engagement.current, prev: insights.summary.engagement.previous },
    { key: 'posts', label: 'Posts', icon: ICONS.posts, value: insights.summary.posts.current, prev: insights.summary.posts.previous },
  ];
  return (
    <div className="kpi-headline-tiles">
      {kpis.map(tile => {
        const delta = tile.prev ? ((tile.value - tile.prev) / tile.prev) * 100 : 0;
        return (
          <div
            key={tile.key}
            className="kpi-tile"
            tabIndex={0}
            aria-pressed="false"
            style={{ minWidth: 160, minHeight: 90, margin: 8, borderRadius: 16, background: '#232323', color: '#FFD600', border: '2px solid #FFD600', fontWeight: 700, fontSize: 22, boxShadow: '0 2px 12px #FFD60022', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          >
            <span style={{ fontSize: 28, marginBottom: 2 }}>{tile.icon}</span>
            <span style={{ fontSize: 32, fontWeight: 900 }}>{formatNumber(tile.value)}</span>
            <span style={{ fontSize: 15, marginTop: 2 }}>{tile.label}</span>
            <span style={{ fontSize: 13, marginTop: 4, color: delta >= 0 ? '#00E676' : '#FF1744' }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
            </span>
            {loading && <div className="kpi-tile-skeleton" />}
          </div>
        );
      })}
    </div>
  );
}
