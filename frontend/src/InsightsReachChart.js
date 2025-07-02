import React, { useState } from 'react';
import { useInsightsStore } from './insightsStore';

export default function InsightsReachChart() {
  const { insights, selectedPostId, setSelectedPostId, loading } = useInsightsStore();
  const [hovered, setHovered] = useState(null);
  if (!insights) return <div className="reach-chart kpi-tile-skeleton" style={{minHeight:220,margin:16}} />;
  const posts = insights.series.perPost;
  const max = Math.max(...posts.map(p => p.reach));
  const avg = posts.reduce((a,b)=>a+b.reach,0)/posts.length;
  return (
    <div className="reach-chart" style={{ background: '#232323', borderRadius: 18, padding: 24, margin: 16, minHeight: 220, position: 'relative' }}>
      <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Organic Reach Distribution</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 18, position:'relative' }}>
        {/* Average reference line */}
        <div style={{position:'absolute',left:0,right:0,top:120-(avg/max)*100-10,height:2,background:'#FFD60077',zIndex:1}} />
        {posts.map((p, i) => {
          const isSelected = selectedPostId === p.id;
          return (
            <div
              key={p.id}
              tabIndex={0}
              aria-label={`Post ${p.title}, ${p.reach} reach`}
              className={`reach-bar${isSelected?' selected':''}`}
              style={{ height: (p.reach / max) * 100 + 20, width: 32, background: isSelected ? '#FFD600' : '#2196F3', borderRadius: 8, cursor: 'pointer', outline: hovered===i?'2px solid #FFD600':'none', position: 'relative', transition: 'all 0.18s', zIndex:2, opacity: selectedPostId && !isSelected ? 0.3 : 1 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelectedPostId(p.id)}
              onKeyDown={e => { if (e.key==='Enter'||e.key===' ') setSelectedPostId(p.id); }}
            >
              {hovered===i && (
                <div className="reach-bar-tooltip" style={{ position: 'absolute', bottom: 40, left: -30, background: '#181818', color: '#FFD600', borderRadius: 8, padding: 8, fontSize: 13, zIndex: 10, boxShadow: '0 2px 8px #FFD60033', minWidth: 160 }}>
                  <div><b>{p.title.length>16?p.title.slice(0,16)+'…':p.title}</b></div>
                  <div style={{fontSize:12}}>{p.date}</div>
                  <div><img src={p.thumbnailUrl||''} alt="" width={72} height={72} style={{borderRadius:8,background:'#FFD60022',margin:'6px 0'}} /></div>
                  <div>Organic Reach: {p.reach}</div>
                  <div>Average Reach: {Math.round(avg)}</div>
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
