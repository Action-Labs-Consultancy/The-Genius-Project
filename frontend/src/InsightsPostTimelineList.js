import React, { useRef, useEffect } from 'react';
import { useInsightsStore } from './insightsStore';

export default function InsightsPostTimelineList() {
  const { insights, selectedPostId, setSelectedPostId, loading, setShowPostModal } = useInsightsStore();
  const listRef = useRef();

  useEffect(() => {
    if (!insights || !selectedPostId) return;
    const posts = [...insights.series.perPost].sort((a,b)=>b.date.localeCompare(a.date));
    const idx = posts.findIndex(p => p.id === selectedPostId);
    if (idx >= 0 && listRef.current) {
      const el = listRef.current.children[idx];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [insights, selectedPostId]);

  if (!insights) return <div className="post-timeline-list kpi-tile-skeleton" style={{minHeight:220,margin:16}} />;
  const posts = [...insights.series.perPost].sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div className="post-timeline-list" style={{ background: '#232323', borderRadius: 18, padding: 24, margin: 16, minHeight: 220, position: 'relative', maxHeight: 320, overflowY: 'auto' }}>
      <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Post Timeline</h3>
      <div ref={listRef}>
        {posts.map((p, i) => (
          <div
            key={p.id}
            tabIndex={0}
            className={`post-timeline-row${selectedPostId===p.id?' selected':''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '10px 0', borderBottom: '1px solid #FFD60022', background: selectedPostId===p.id ? '#FFD60022' : 'none', outline: 'none', cursor: 'pointer' }}
            onClick={() => { setSelectedPostId(p.id); setShowPostModal(true); }}
            onKeyDown={e => { if (e.key==='Enter'||e.key===' ') { setSelectedPostId(p.id); setShowPostModal(true); } }}
          >
            <div style={{ width: 56, height: 56, background: '#FFD60033', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>
              {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt="" width={56} height={56} style={{borderRadius:8}} /> : '🖼️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#FFD600' }}>{p.title.length>18?p.title.slice(0,18)+'…':p.title}</div>
              <div style={{ fontSize: 13, color: '#FFD60099' }}>{p.date}</div>
            </div>
            <div style={{ minWidth: 60, textAlign: 'right', color: '#2196F3' }}>👁 {p.reach}</div>
            <div style={{ minWidth: 60, textAlign: 'right', color: '#FF1744' }}>❤️ {p.likes}</div>
            <div style={{ minWidth: 60, textAlign: 'right', color: '#FFD600' }}>💬 {p.comments}</div>
          </div>
        ))}
      </div>
      {loading && <div className="chart-loading-overlay"><div className="spinner" /> Loading...</div>}
    </div>
  );
}
