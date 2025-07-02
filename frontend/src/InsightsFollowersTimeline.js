import React, { useState } from 'react';
import { useInsightsStore } from './insightsStore';

export default function InsightsFollowersTimeline() {
  const { insights, selectedPostId, setSelectedPostId, loading } = useInsightsStore();
  const [hovered, setHovered] = useState(null);
  if (!insights) return <div className="followers-timeline-chart kpi-tile-skeleton" style={{minHeight:220,margin:16}} />;
  const data = insights.series.followersDaily;
  const max = Math.max(...data.map(d=>d.followers));
  const min = Math.min(...data.map(d=>d.followers));
  return (
    <div className="followers-timeline-chart" style={{ background: '#232323', borderRadius: 18, padding: 24, margin: 16, minHeight: 220, position: 'relative' }}>
      <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Followers Growth Timeline</h3>
      <svg width="100%" height="120" viewBox="0 0 320 120" style={{overflow:'visible'}}>
        {/* Grid lines */}
        {[0,1,2].map(i => (
          <line key={i} x1="20" x2="300" y1={30+40*i} y2={30+40*i} stroke="#FFD60022" strokeWidth="1" />
        ))}
        {/* Y axis ticks */}
        {[max, Math.round((max+min)/2), min].map((v,i) => (
          <text key={i} x="0" y={35+40*i} fill="#FFD60099" fontSize="12">{v}</text>
        ))}
        {/* Polyline */}
        <polyline fill="none" stroke="#2196F3" strokeWidth="3" points={data.map((d,i)=>`${20+i*40},${110-((d.followers-min)/(max-min+1e-6))*80}`).join(' ')} />
        {/* Dots and post markers */}
        {data.map((d,i) => (
          <g key={i}>
            <circle cx={20+i*40} cy={110-((d.followers-min)/(max-min+1e-6))*80} r={6} fill={hovered===i?'#FFD600':'#2196F3'} stroke="#232323" strokeWidth="2"
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}} />
            {d.postId && (
              <rect x={20+i*40-7} y={110-((d.followers-min)/(max-min+1e-6))*80-14} width={14} height={14} fill="#FFD600" stroke="#2196F3" strokeWidth={2} rx={3} style={{cursor:'pointer'}} onClick={()=>setSelectedPostId(d.postId)} />
            )}
            {hovered===i && (
              <g>
                <rect x={20+i*40-44} y={110-((d.followers-min)/(max-min+1e-6))*80-38} width="88" height="32" rx="7" fill="#232323" stroke="#FFD600" />
                <text x={20+i*40} y={110-((d.followers-min)/(max-min+1e-6))*80-22} fill="#FFD600" fontSize="13" textAnchor="middle">{d.followers}</text>
                {d.postId && <text x={20+i*40} y={110-((d.followers-min)/(max-min+1e-6))*80-8} fill="#FFD60099" fontSize="11" textAnchor="middle">Post: {d.postId}</text>}
              </g>
            )}
          </g>
        ))}
        {/* X axis labels */}
        {data.map((d,i) => (
          <text key={i} x={20+i*40} y={118} fill="#FFD60099" fontSize="12" textAnchor="middle">{d.date.slice(5)}</text>
        ))}
      </svg>
      {loading && <div className="chart-loading-overlay"><div className="spinner" /> Loading...</div>}
    </div>
  );
}
