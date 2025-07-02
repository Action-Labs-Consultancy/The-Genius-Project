import React from 'react';

const CARD_TYPES = [
  { type: 'roadmap', title: 'Roadmap', icon: '🗺️', subtitle: 'Project milestones' },
  { type: 'market', title: 'Market Research', icon: '📊', subtitle: 'Analyze your market' },
  { type: 'campaigns', title: 'Campaigns', icon: '📣', subtitle: 'Track campaigns' },
  { type: 'calendar', title: 'SM Content Calendar', icon: '📅', subtitle: 'Plan content' },
  { type: 'influencers', title: 'Influencers', icon: '🤝', subtitle: 'Manage influencers' },
  { type: 'dashboard', title: 'Data Dashboard', icon: '📈', subtitle: 'Track metrics' },
];

const PRO_TIPS = [
  'Roadmap: Use for high-level project planning.',
  'Market Research: Store insights and competitor data.',
  'Campaigns: Track marketing or sales campaigns.',
  'SM Content Calendar: Plan and schedule content.',
  'Influencers: Manage influencer relationships.',
  'Data Dashboard: Visualize KPIs and analytics.',
];

export default function AddCardModal({ client, onClose, onAdd }) {
  const [selected, setSelected] = React.useState(null);
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCardAdd = async (type) => {
    try {
      setError('');
      setIsSubmitting(true);
      const result = await onAdd(type);
      if (result === false) {
        setError('Failed to add card. Please try again.');
        setIsSubmitting(false);
        return;
      }
      onClose(); // Close modal on success
    } catch (err) {
      setError('Failed to add card. Please try again.');
      setIsSubmitting(false);
      console.error('Error adding card:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        .modal-black-yellow {
          background: #181818;
          color: #FFD600;
          border-radius: 18px;
          padding: 40px;
          max-width: 600px;
          width: 95vw;
          box-shadow: 0 8px 32px #FFD60033;
          font-family: inherit;
          border: 2px solid #FFD600;
        }
        .modal-black-yellow h2 {
          color: #FFD600;
          font-weight: 800;
          font-size: 24px;
          margin-bottom: 18px;
        }
        .card-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .card-type-option {
          border: 2px solid #FFD600;
          border-radius: 14px;
          background: #111;
          padding: 24px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-shadow: 0 2px 8px #FFD60022;
          opacity: 1;
          transition: all 0.2s;
          min-height: 90px;
        }
        .card-type-option.selected, .card-type-option:hover {
          border: 2.5px solid #FFD600;
          background: #181818;
          box-shadow: 0 4px 16px #FFD60044;
          transform: translateY(-2px) scale(1.03);
        }
        .btn-flat {
          background: #FFD600;
          color: #111;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          padding: 10px 28px;
          box-shadow: 0 2px 8px #0002;
          transition: background 0.2s, color 0.2s, transform 0.18s, box-shadow 0.18s;
          cursor: pointer;
        }
        .btn-flat:hover {
          background: #fff200;
          color: #000;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 16px #FFD60044;
        }
        .btn-outline {
          background: #111;
          color: #FFD600;
          border: 2px solid #FFD600;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          padding: 10px 28px;
          transition: background 0.2s, color 0.2s, transform 0.18s, box-shadow 0.18s;
          cursor: pointer;
        }
        .btn-outline:hover {
          background: #FFD600;
          color: #111;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 16px #FFD60044;
        }
      `}</style>
      <div className="modal-black-yellow">
        {error && (
          <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#2a2a2a', color: '#FFD600' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          <div style={{ background: '#FFD600', color: '#111', fontWeight: 700, fontSize: 28, width: 56, height: 56, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {client?.name?.split(' ').map(w => w[0]).join('').toUpperCase()}
          </div>
          <h2 style={{ margin: 0 }}>Add a Card – Choose a card type for {client?.name || ''}</h2>
        </div>
        <div className="card-type-grid">
          {CARD_TYPES.map(card => (
            <div
              key={card.type}
              className={`card-type-option${selected === card.type ? ' selected' : ''}`}
              onClick={() => {
                if (!isSubmitting) {
                  setSelected(card.type);
                  handleCardAdd(card.type);
                }
              }}
            >
              <div style={{ fontSize: 32 }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18, margin: '10px 0 2px 0', color: '#FFD600' }}>{card.title}</div>
              <div style={{ color: '#bbb', fontSize: 14 }}>{card.subtitle}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#222', borderRadius: 12, padding: 18, marginTop: 24 }}>
          <strong style={{ color: '#FFD600', fontSize: 16 }}>Pro Tips</strong>
          <ul style={{ margin: '10px 0 0 18px', color: '#FFD600', fontSize: 14 }}>
            {PRO_TIPS.map(tip => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, gap: 16 }}>
          <button
            className="btn-outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
