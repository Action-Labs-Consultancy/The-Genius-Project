import React, { useState } from 'react';
import { useInsightsStore } from './insightsStore';

function engagementScore(post) {
  return post.likes + post.comments*2 + post.shares*3 + post.saves;
}

export default function InsightsEngagementChart() {
  const { insights, selectedPostId, setSelectedPostId, loading } = useInsightsStore();
  const [hovered, setHovered] = useState(null);
  if (!insights) return <div className="engagement-chart kpi-tile-skeleton" style={{minHeight:220,margin:16}} />;
  const posts = insights.series.perPost;
  const max = Math.max(...posts.map(p => p.likes + p.comments + p.shares + p.saves));
  return (
    <div className="engagement-chart" style={{ background: '#232323', borderRadius: 18, padding: 24, margin: 16, minHeight: 220, position: 'relative' }}>
      <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Engagement Distribution</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 18 }}>
        {posts.map((p, i) => {
          const total = p.likes + p.comments + p.shares + p.saves;
          const isSelected = selectedPostId === p.id;
          return (
            <div
              key={p.id}
              tabIndex={0}
              aria-label={`Post ${p.title}, ${total} interactions`}
              className={`engagement-bar${isSelected?' selected':''}`}
              style={{ height: (total / max) * 100 + 20, width: 32, background: isSelected ? '#FFD600' : '#00E676', borderRadius: 8, cursor: 'pointer', outline: hovered===i?'2px solid #FFD600':'none', position: 'relative', transition: 'all 0.18s', opacity: selectedPostId && !isSelected ? 0.3 : 1 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelectedPostId(p.id)}
              onKeyDown={e => { if (e.key==='Enter'||e.key===' ') setSelectedPostId(p.id); }}
            >
              {hovered===i && (
                <div className="engagement-bar-tooltip" style={{ position: 'absolute', bottom: 40, left: -30, background: '#181818', color: '#FFD600', borderRadius: 8, padding: 8, fontSize: 13, zIndex: 10, boxShadow: '0 2px 8px #FFD60033', minWidth: 160 }}>
                  <div><b>{p.title.length>16?p.title.slice(0,16)+'…':p.title}</b></div>
                  <div style={{fontSize:12}}>{p.date}</div>
                  <div><img src={p.thumbnailUrl||''} alt="" width={72} height={72} style={{borderRadius:8,background:'#FFD60022',margin:'6px 0'}} /></div>
                  <div>Likes: {p.likes}, Comments: {p.comments}</div>
                  <div>Shares: {p.shares}, Saves: {p.saves}</div>
                  <div>Engagement Score: {engagementScore(p)}</div>
                </div>
              )}
              <span style={{ position: 'absolute', bottom: -22, left: 0, width: '100%', textAlign: 'center', fontSize: 12, color: '#FFD600', transform: 'rotate(-30deg)' }}>{p.title.length>10?p.title.slice(0,10)+'…':p.title}</span>
            </div>
          );
        })}
      </div>
      {loading && <div className="chart-loading-overlay"><div className="spinner" /> Loading...</div>}
    </div>
  );
}
