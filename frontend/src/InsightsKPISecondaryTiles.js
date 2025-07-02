import React from 'react';
import { useInsightsStore } from './insightsStore';

export default function InsightsKPISecondaryTiles() {
  const { insights, loading } = useInsightsStore();
  if (!insights) return (
    <div className="kpi-secondary-tiles">
      {[1,2,3].map(i => <div key={i} className="kpi-tile-secondary kpi-tile-skeleton" />)}
    </div>
  );
  const secondary = [
    { key: 'reachRate', label: 'Reach Rate', value: (insights.derived.reachRate * 100).toFixed(1) + '%' },
    { key: 'engagementRate', label: 'Engagement Rate', value: (insights.derived.engagementRate * 100).toFixed(1) + '%' },
    { key: 'avgPerPost', label: 'Avg. Engagement/Post', value: insights.derived.avgPerPost },
  ];
  return (
    <div className="kpi-secondary-tiles">
      {secondary.map(tile => (
        <div
          key={tile.key}
          className="kpi-tile-secondary"
          style={{ minWidth: 140, minHeight: 70, margin: 8, borderRadius: 14, background: '#181818', color: '#FFD600', border: '1.5px solid #FFD60044', fontWeight: 600, fontSize: 18, boxShadow: '0 2px 8px #FFD60011', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        >
          <span style={{ fontSize: 20, fontWeight: 800 }}>{tile.value}</span>
          <span style={{ fontSize: 13, marginTop: 2 }}>{tile.label}</span>
          {loading && <div className="kpi-tile-skeleton" />}
        </div>
      ))}
    </div>
  );
}
