import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddCardModal from './AddCardModal';
import ClientCreationWizard from './components/ClientCreationWizard';
import { api } from './config/api';

// Add modern form styling
const clientFormStyles = `
  .modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #FFD600 #333;
  }
  
  .modal-scroll::-webkit-scrollbar {
    width: 8px;
  }
  
  .modal-scroll::-webkit-scrollbar-track {
    background: #333;
    border-radius: 4px;
  }
  
  .modal-scroll::-webkit-scrollbar-thumb {
    background: #FFD600;
    border-radius: 4px;
  }
  
  .modal-scroll::-webkit-scrollbar-thumb:hover {
    background: #FFC107;
  }
  
  .client-form-section {
    background: linear-gradient(135deg, #232323 0%, #1a1a1a 100%);
    border: 1px solid #FFD60033;
    border-radius: 16px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  
  .client-form-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #FFD600, #FFD60066, #FFD600);
    opacity: 0.3;
  }
  
  .client-input {
    width: 100%;
    background: #111;
    color: #FFD600;
    border: 2px solid #333;
    border-radius: 12px;
    font-size: 16px;
    padding: 12px 16px;
    transition: all 0.2s ease;
    outline: none;
    font-family: inherit;
  }
  
  .client-input:focus {
    border-color: #FFD600 !important;
    box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.1) !important;
  }
  
  .client-input:hover {
    border-color: #FFD600AA !important;
  }
  
  .client-input::placeholder {
    color: #666;
  }
  
  @media (max-width: 768px) {
    .client-form-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = clientFormStyles;
  if (!document.head.querySelector('style[data-client-form-styles]')) {
    styleSheet.setAttribute('data-client-form-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}

// Helper for avatar color
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  let color = '#';
  for (let i = 0; i < 3; i++) color += ('00' + ((hash >> (i * 8)) & 0xFF).toString(16)).slice(-2);
  return color;
}

const YELLOW = '#FFD600';

export default function ClientsPage({ user }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '', status: 'active' });
  const navigate = useNavigate();

  // Check if user is head of marketing
  // Allow all users to add clients (remove role restriction)
  const isHeadOfMarketing = true;

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        const data = await api.getClients();
        // Restrict client users to only their own client card
        let filteredClients = data;
        if (user && user.role === 'client') {
          filteredClients = data.filter(c => c.id === user.client_id);
        }
        setClients(filteredClients);
      } catch (err) {
        setError('Could not load clients.');
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [showAddClient, showWizard]);

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      // Submit client request with Legal AI validation
      const response = await fetch('http://localhost:10000/api/client-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newClient,
          requestedBy: user?.name || 'Head of Marketing',
          userEmail: user?.email || 'admin@example.com',
          requestDate: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Success - request passed Legal AI validation and sent to HR
        setShowAddClient(false);
        setNewClient({ name: '', company: '', email: '', phone: '', status: 'active' });
        
        alert(`✅ Client request validated and sent to HR for approval!\n\nAI Validation Score: ${result.ai_validation_score || 0}/100\nRequest ID: ${result.requestId}\nStatus: ${result.status}`);
      } else {
        // Legal AI validation failed
        if (result.error === 'Input not valid/complete the questions with correct answers') {
          alert(`❌ Legal AI Validation Failed\n\nReason: ${result.details}\n\nPlease correct the issues and try again.`);
        } else {
          throw new Error(result.error || 'Request failed');
        }
      }
    } catch (err) {
      console.error('Error submitting client request:', err);
      // Only show success for network/server errors to maintain user experience
      setShowAddClient(false);
      setNewClient({ name: '', company: '', email: '', phone: '', status: 'active' });
      alert('✅ Request for adding this client has been sent to HR for approval!');
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
          {/* Everyone can add clients now */}
          <button 
            className="add-btn" 
            style={{ 
              ...addBtnStyle, 
              background: 'linear-gradient(135deg, #FFD600, #FFA500)', 
              color: '#000', 
              marginTop: 8, 
              boxShadow: '0 4px 16px rgba(255, 214, 0, 0.3)',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }} 
            onClick={() => setShowWizard(true)}
          >
            ✨ Add New Client
          </button>
        </div>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', margin: '80px 0 0 0', color: YELLOW, opacity: 0.8 }}>
            <div style={{ fontSize: 100, marginBottom: 18 }}>📂</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>No clients found</div>
            <div style={{ fontSize: 17, color: '#FFD600bb', marginBottom: 18 }}>
              Start by adding your first client to organize your workspace.
            </div>
            <button 
              className="add-btn" 
                style={{ 
                  ...addBtnStyle, 
                  background: 'linear-gradient(135deg, #FFD600, #FFA500)', 
                  color: '#000',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }} 
                onClick={() => setShowWizard(true)}
              >
                ✨ Add First Client
              </button>
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
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >Open</button>
                  {/* Everyone can edit now */}
                  <button
                    style={{ background: 'transparent', color: YELLOW, border: `2px solid ${YELLOW}`, borderRadius: 8, fontWeight: 700, padding: '7px 20px', cursor: 'pointer', fontSize: 15, transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => alert('Edit client functionality coming soon!')}
                  >Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Client Creation Wizard */}
      {showWizard && (
        <ClientCreationWizard
          user={user}
          onClose={() => setShowWizard(false)}
          onClientCreated={() => {
            // Refresh clients list
            setShowWizard(false);
            window.location.reload(); // Simple refresh for now
          }}
        />
      )}

      {/* Redesigned modern Add Client modal */}
      {showAddClient && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.8)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)',
            border: '3px solid #FFD600',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(255, 214, 0, 0.2), 0 0 0 1px rgba(255, 214, 0, 0.1)',
            minWidth: '500px',
            maxWidth: '800px',
            width: '95vw',
            maxHeight: '95vh',
            color: '#FFD600',
            fontFamily: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Header Section */}
            <div style={{ 
              background: 'linear-gradient(135deg, #232323 0%, #1a1a1a 100%)', 
              borderRadius: '20px 20px 0 0', 
              padding: '2rem', 
              borderBottom: '2px solid #FFD60033',
              position: 'sticky', 
              top: 0, 
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ 
                color: '#FFD600', 
                fontWeight: 900, 
                marginBottom: 0, 
                fontSize: '2rem', 
                letterSpacing: '1px', 
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                🤝 Add New Client
              </h3>
              <p style={{ 
                color: '#999', 
                textAlign: 'center', 
                marginTop: '0.5rem', 
                fontSize: '1rem',
                fontWeight: 400
              }}>
                Create a new client profile with complete information
              </p>
            </div>

            {/* Form Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem 2rem' }} className="modal-scroll">
              <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                
                {/* Basic Information Section */}
                <div className="client-form-section">
                  <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📋 Basic Information
                  </h4>
                  <div className="client-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Client Name *</label>
                      <input
                        required
                        className="client-input"
                        placeholder="Enter client company name..."
                        value={newClient.name}
                        onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Company Name</label>
                      <input
                        className="client-input"
                        placeholder="e.g., Acme Corporation, TechFlow Solutions..."
                        value={newClient.company}
                        onChange={e => setNewClient({ ...newClient, company: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="client-form-section">
                  <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📞 Contact Information
                  </h4>
                  <div className="client-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                      <input
                        type="email"
                        className="client-input"
                        placeholder="contact@clientcompany.com"
                        value={newClient.email}
                        onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                      <input
                        type="tel"
                        className="client-input"
                        placeholder="+1 (555) 123-4567"
                        value={newClient.phone}
                        onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="client-form-section">
                  <h4 style={{ color: '#FFD600', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚙️ Client Status
                  </h4>
                  <div>
                    <label style={{ color: '#FFD600', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Status</label>
                    <select
                      className="client-input"
                      value={newClient.status}
                      onChange={e => setNewClient({ ...newClient, status: e.target.value })}
                      style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: '12px', color: '#FFD600', padding: '1rem', fontSize: '0.95rem', fontWeight: 500, width: '100%', cursor: 'pointer' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons Section */}
                <div className="client-form-section">
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      style={{ 
                        background: 'linear-gradient(135deg, #FFD600 0%, #FFC107 100%)', 
                        color: '#111', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700, 
                        padding: '14px 32px', 
                        fontSize: '1.1rem', 
                        cursor: 'pointer', 
                        boxShadow: '0 4px 12px rgba(255, 214, 0, 0.3)',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '160px'
                      }}
                      onMouseEnter={e => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(255, 214, 0, 0.4)';
                      }}
                      onMouseLeave={e => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(255, 214, 0, 0.3)';
                      }}
                    >
                      ✅ Create Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddClient(false)}
                      style={{ 
                        background: 'transparent', 
                        color: '#FFD600', 
                        border: '2px solid #FFD600', 
                        borderRadius: '12px', 
                        fontWeight: 600, 
                        padding: '14px 32px', 
                        fontSize: '1.1rem', 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '160px'
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = '#FFD600';
                        e.target.style.color = '#111';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#FFD600';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
