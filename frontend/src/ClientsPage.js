import React, { useEffect, useState } from 'react';
import AddCardModal from './AddCardModal';

// Helper for avatar color
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  let color = '#';
  for (let i = 0; i < 3; i++) color += ('00' + ((hash >> (i * 8)) & 0xFF).toString(16)).slice(-2);
  return color;
}

const YELLOW = '#FFD600';

export default function ClientsPage({ user, onClientSelect }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', industry: '', email: '', phone: '', website: '', description: '' });
  const [addError, setAddError] = useState(null);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data);
      } catch (err) {
        setError('Could not load clients.');
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [showAddClient]);

  const handleAddClient = async (e) => {
    e.preventDefault();
    setAddError(null);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (!res.ok) throw new Error('Failed to add client');
      setShowAddClient(false);
      setNewClient({ name: '', industry: '', email: '', phone: '', website: '', description: '' });
    } catch (err) {
      setAddError('Could not add client.');
    }
  };

  // --- Modern, lively, on-theme styles ---
  const cardTileStyle = {
    background: 'linear-gradient(135deg, #232323 0%, #181818 100%)',
    color: YELLOW,
    borderRadius: 18,
    padding: '2.2rem 2rem 1.5rem 2rem',
    boxShadow: '0 8px 32px #0005',
    border: `2px solid ${YELLOW}`,
    margin: '0 0 24px 0',
    cursor: 'pointer',
    transition: 'box-shadow 0.18s, border 0.18s, transform 0.18s',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
    animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1)'
  };
  const avatarStyle = name => ({
    width: 56, height: 56, borderRadius: 14, background: stringToColor(name), color: '#181818', fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 24, boxShadow: `0 2px 8px ${YELLOW}33`, border: `2.5px solid ${YELLOW}`, letterSpacing: 1
  });
  const addBtnStyle = {
    background: YELLOW,
    color: '#111',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 16,
    padding: '10px 28px',
    boxShadow: `0 2px 8px ${YELLOW}22`,
    marginBottom: 24,
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s, transform 0.18s, box-shadow 0.18s',
  };
  const modalStyle = {
    background: '#181818',
    color: YELLOW,
    borderRadius: 18,
    padding: 40,
    maxWidth: 500,
    width: '95vw',
    boxShadow: `0 8px 32px ${YELLOW}33`,
    fontFamily: 'inherit',
    border: `2px solid ${YELLOW}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    animation: 'fadeInScale 0.5s cubic-bezier(.23,1.01,.32,1)'
  };

  // Animation keyframes
  const styleSheet = `
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(40px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fadeInScale {
      0% { opacity: 0; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1); }
    }
    .card-tile {
      transition: box-shadow 0.18s, border 0.18s, transform 0.18s, background 0.18s;
    }
    .card-tile:hover {
      box-shadow: 0 12px 36px #FFD60099;
      border: 2.5px solid #FFD600;
      background: #232323;
      transform: translateY(-4px) scale(1.03);
    }
    .add-btn:hover {
      background: #fff200;
      color: #000;
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 4px 16px #FFD60044;
    }
    .clients-bg-accent {
      position: fixed;
      top: -120px;
      right: -120px;
      width: 340px;
      height: 340px;
      background: radial-gradient(circle at 60% 40%, #FFD60033 0%, #FFD60000 80%);
      z-index: 0;
      pointer-events: none;
      filter: blur(2px);
    }
  `;

  if (loading) return <div style={{ color: YELLOW, textAlign: 'center', marginTop: 60 }}>Loading clients...</div>;
  if (error) return <div style={{ color: YELLOW, textAlign: 'center', marginTop: 60 }}>{error}</div>;

  return (
    <div style={{ background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', minHeight: '100vh', padding: '40px 0', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-tile {
          transition: box-shadow 0.18s, border 0.18s, transform 0.18s, background 0.18s;
        }
        .card-tile:hover {
          box-shadow: 0 12px 36px #FFD60099;
          border: 2.5px solid #FFD600;
          background: #232323;
          transform: translateY(-4px) scale(1.03);
        }
        .add-btn:hover {
          background: #fff200;
          color: #000;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 16px #FFD60044;
        }
        .clients-bg-accent {
          position: fixed;
          top: -120px;
          right: -120px;
          width: 340px;
          height: 340px;
          background: radial-gradient(circle at 60% 40%, #FFD60033 0%, #FFD60000 80%);
          z-index: 0;
          pointer-events: none;
          filter: blur(2px);
        }
      `}</style>
      <div className="clients-bg-accent" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 32 }}>
          <h2 style={{ color: YELLOW, fontWeight: 900, fontSize: 38, margin: 0, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            Clients
          </h2>
          <button className="add-btn" style={{ ...addBtnStyle, background: YELLOW, color: '#181818', marginTop: 8, boxShadow: '0 2px 8px #FFD60022' }} onClick={() => setShowAddClient(true)}>+ Add Client</button>
        </div>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', margin: '80px 0 0 0', color: YELLOW, opacity: 0.8 }}>
            <div style={{ fontSize: 100, marginBottom: 18 }}>📂</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>No clients found</div>
            <div style={{ fontSize: 17, color: '#FFD600bb', marginBottom: 18 }}>Start by adding your first client to organize your workspace.</div>
            <button className="add-btn" style={{ ...addBtnStyle, background: YELLOW, color: '#181818' }} onClick={() => setShowAddClient(true)}>+ Add Client</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 36 }}>
            {clients.map((client, idx) => (
              <div key={client.id} className="card-tile" style={{
                background: 'linear-gradient(135deg, #232323 0%, #181818 100%)',
                color: YELLOW,
                borderRadius: 18,
                padding: '2.2rem 2rem 1.5rem 2rem',
                boxShadow: '0 8px 32px #FFD60022',
                border: `2px solid ${YELLOW}`,
                margin: '0 0 24px 0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minHeight: 180,
                position: 'relative',
                overflow: 'hidden',
                animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1)',
                animationDelay: `${idx * 0.07}s`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, background: YELLOW, color: '#181818', fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 24, boxShadow: `0 2px 8px ${YELLOW}33`, border: `2.5px solid #FFD600`, letterSpacing: 1
                  }}>{client.name?.split(' ').map(w => w[0]).join('').toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 4 }}>{client.name}</div>
                    <div style={{ color: YELLOW, fontSize: 15, marginBottom: 6 }}>{client.industry || ''}</div>
                  </div>
                </div>
                <div style={{ color: '#FFD600cc', fontSize: 14, margin: '10px 0 18px 4px', minHeight: 32 }}>{client.description}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', width: '100%', justifyContent: 'flex-end' }}>
                  <button
                    style={{ background: YELLOW, color: '#181818', border: 'none', borderRadius: 8, fontWeight: 700, padding: '7px 20px', cursor: 'pointer', fontSize: 15, boxShadow: '0 2px 8px #FFD60033', transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => onClientSelect(client)}
                  >Open</button>
                  <button
                    style={{ background: 'transparent', color: YELLOW, border: `2px solid ${YELLOW}`, borderRadius: 8, fontWeight: 700, padding: '7px 20px', cursor: 'pointer', fontSize: 15, transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => alert('Edit client coming soon!')}
                  >Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showAddClient && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form className="modal-anim" style={modalStyle} onSubmit={handleAddClient}>
            <h3 style={{ color: YELLOW, fontWeight: 800, fontSize: 24, margin: 0 }}>Add Client</h3>
            <input required placeholder="Name" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: 8, color: YELLOW, padding: '12px 16px', fontSize: 14, fontWeight: 500, width: '100%' }} />
            <input placeholder="Industry" value={newClient.industry} onChange={e => setNewClient({ ...newClient, industry: e.target.value })} style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: 8, color: YELLOW, padding: '12px 16px', fontSize: 14, fontWeight: 500, width: '100%' }} />
            <input placeholder="Email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: 8, color: YELLOW, padding: '12px 16px', fontSize: 14, fontWeight: 500, width: '100%' }} />
            <input placeholder="Phone" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: 8, color: YELLOW, padding: '12px 16px', fontSize: 14, fontWeight: 500, width: '100%' }} />
            <input placeholder="Website" value={newClient.website} onChange={e => setNewClient({ ...newClient, website: e.target.value })} style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: 8, color: YELLOW, padding: '12px 16px', fontSize: 14, fontWeight: 500, width: '100%' }} />
            <textarea placeholder="Description" value={newClient.description} onChange={e => setNewClient({ ...newClient, description: e.target.value })} style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: 8, color: YELLOW, padding: '12px 16px', fontSize: 14, fontWeight: 500, width: '100%' }} />
            {addError && <div style={{ color: '#dc2626', marginBottom: 8 }}>{addError}</div>}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'flex-end' }}>
              <button type="submit" style={{ background: YELLOW, color: '#111', fontWeight: 700, border: 'none', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>Add</button>
              <button type="button" style={{ background: '#111', color: YELLOW, fontWeight: 700, border: `2px solid ${YELLOW}`, borderRadius: 10, padding: '10px 28px', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }} onClick={() => setShowAddClient(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
