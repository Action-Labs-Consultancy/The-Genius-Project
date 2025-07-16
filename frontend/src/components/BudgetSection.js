import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const BudgetSection = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const budget = data?.budget || {};
  const kpis = data?.kpis || {};
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  // Budget vs Spend data
  const budgetSpendData = [
    { name: 'Budget', value: budget.monthly || 0, color: '#e5e7eb' },
    { name: 'Spent', value: kpis.spendAmount || 0, color: '#3b82f6' },
    { name: 'Remaining', value: budget.balance || 0, color: '#10b981' }
  ];

  // CAC and CPA trends
  const efficiencyData = [
    { metric: 'CAC', current: kpis.cac || 0, previous: (kpis.cac || 0) * 1.15, target: (kpis.cac || 0) * 0.85 },
    { metric: 'CPA', current: kpis.cpa || 0, previous: (kpis.cpa || 0) * 1.08, target: (kpis.cpa || 0) * 0.92 }
  ];

  // Budget allocation data
  const allocationData = budget.allocation || [];

  const formatCurrency = (value) => `$${value?.toFixed(2) || 0}`;

  return (
    <div className="budget-section">
      {/* Budget Overview */}
      <div className="budget-overview" style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
        {/* Budget Summary Cards */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flex: 2 }}>
          <div style={{ background: '#181818', borderRadius: 16, padding: '24px 32px', minWidth: 160, boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28, color: '#FFD600' }}>💰</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#FFD600' }}>Total Budget</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{formatCurrency(budget.monthly)}</span>
          </div>
          <div style={{ background: '#181818', borderRadius: 16, padding: '24px 32px', minWidth: 160, boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28, color: '#00E676' }}>💸</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#00E676' }}>Spent</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{formatCurrency(kpis.spendAmount)}</span>
          </div>
          <div style={{ background: '#181818', borderRadius: 16, padding: '24px 32px', minWidth: 160, boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28, color: '#FFD600' }}>🏦</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#FFD600' }}>Remaining</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{formatCurrency(budget.balance)}</span>
          </div>
          <div style={{ background: '#181818', borderRadius: 16, padding: '24px 32px', minWidth: 160, boxShadow: '0 2px 12px #0006', border: '2px solid #FFD600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28, color: '#FFD600' }}>📊</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#FFD600' }}>Utilization</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{budget.monthly > 0 ? ((kpis.spendAmount / budget.monthly) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
        
        <div className="budget-chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={budgetSpendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Allocation */}
      <div className="budget-allocation" style={{ marginBottom: 32 }}>
        <h3 style={{ color: '#FFD600', fontWeight: 800, fontSize: 20, marginBottom: 18 }}>Budget Allocation by Category</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {allocationData.map((item, idx) => (
            <div key={item.category} style={{ background: '#232323', borderRadius: 14, padding: '22px 28px', minWidth: 180, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: '2px solid #FFD600', boxShadow: '0 2px 12px #0006' }}>
              <span style={{ fontSize: 28, color: ['#3b82f6','#10b981','#f59e0b'][idx % 3] }}>
                {item.category === 'Digital Advertising' ? '📢' : item.category === 'Influencer Marketing' ? '🤳' : '🎉'}
              </span>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#FFD600' }}>{item.category}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{formatCurrency(item.amount)}</span>
              <span style={{ fontSize: 15, color: '#FFD600', fontWeight: 600 }}>{budget.monthly > 0 ? ((item.amount / budget.monthly) * 100).toFixed(1) : 0}% of total</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;
