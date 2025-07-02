import React, { useState, useEffect } from 'react';
import AddCardModal from './AddCardModal';
import SMContentCalendar from './SMContentCalendar';
import HeaderBar from './HeaderBar';
import ClientAccessManager from './ClientAccessManager';
import SocialMediaInsightsDashboard from './SocialMediaInsightsDashboard';
import { fetchReviveStats, createReviveCampaign, createReviveBanner } from './api';

function CampaignsCardContent({ client }) {
  const [reviveStats, setReviveStats] = React.useState([]);
  const [campaignForm, setCampaignForm] = React.useState({ name: '', clientid: client.id, start_date: '', end_date: '' });
  const [bannerForm, setBannerForm] = React.useState({ campaignid: '', image_url: '', width: '', height: '', alt_text: '' });
  const [apiMsg, setApiMsg] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('stats');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    fetchReviveStats()
      .then(setReviveStats)
      .catch(() => setReviveStats([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await createReviveCampaign({ ...campaignForm, clientid: client.id });
      setApiMsg(`✅ Campaign created successfully! ID: ${res.campaign_id}`);
      setCampaignForm({ name: '', clientid: client.id, start_date: '', end_date: '' });
    } catch (err) {
      setApiMsg('❌ Error creating campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await createReviveBanner(bannerForm);
      setApiMsg(`✅ Banner created successfully! ID: ${res.banner_id}`);
      setBannerForm({ campaignid: '', image_url: '', width: '', height: '', alt_text: '' });
    } catch (err) {
      setApiMsg('❌ Error creating banner. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    background: '#1a1a1a',
    border: '2px solid #333',
    borderRadius: '8px',
    color: '#FFD600',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
    marginBottom: '12px',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #FFD600 0%, #FFA500 100%)',
    color: '#111',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(255, 214, 0, 0.3)',
    outline: 'none'
  };

  const tabStyle = {
    background: 'transparent',
    border: 'none',
    color: '#888',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const activeTabStyle = {
    ...tabStyle,
    color: '#FFD600',
    background: '#1a1a1a',
    borderBottom: '2px solid #FFD600'
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1a1a1a 0%, #232323 100%)', 
      color: '#FFD600', 
      borderRadius: '16px', 
      padding: '32px', 
      margin: '24px', 
      maxWidth: '900px', 
      marginLeft: 'auto', 
      marginRight: 'auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      border: '1px solid #333'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '24px', marginRight: '12px' }}>📊</div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Campaign Management</h2>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #333', marginBottom: '24px' }}>
        <button 
          style={activeTab === 'stats' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('stats')}
        >
          📈 Statistics
        </button>
        <button 
          style={activeTab === 'campaigns' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('campaigns')}
        >
          🚀 New Campaign
        </button>
        <button 
          style={activeTab === 'banners' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('banners')}
        >
          🎨 New Banner
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'stats' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Performance Overview</h3>
            {isLoading && <div style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>Loading...</div>}
          </div>
          
          {reviveStats.length === 0 ? (
            <div style={{ 
              background: '#1a1a1a', 
              border: '2px dashed #333', 
              borderRadius: '12px', 
              padding: '40px', 
              textAlign: 'center',
              color: '#888'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
              <p style={{ margin: 0, fontSize: '16px' }}>No campaign data available yet</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Create your first campaign to see statistics here</p>
            </div>
          ) : (
            <div style={{ 
              background: '#1a1a1a', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid #333'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #333' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#FFD600' }}>Banner ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#FFD600' }}>Impressions</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#FFD600' }}>Clicks</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#FFD600' }}>CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviveStats.map(row => (
                      <tr key={row.bannerid} style={{ borderBottom: '1px solid #2a2a2a' }}>
                        <td style={{ padding: '12px', color: '#FFD600', fontWeight: '500' }}>{row.bannerid}</td>
                        <td style={{ padding: '12px', color: '#fff' }}>{row.impressions.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: '#fff' }}>{row.clicks.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: '#4CAF50', fontWeight: '500' }}>
                          {row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) + '%' : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Create New Campaign</h3>
          <form onSubmit={handleCampaignSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  Campaign Name
                </label>
                <input 
                  type="text"
                  placeholder="Enter campaign name"
                  value={campaignForm.name} 
                  onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
              <div></div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  Start Date
                </label>
                <input 
                  type="date"
                  value={campaignForm.start_date} 
                  onChange={e => setCampaignForm(f => ({ ...f, start_date: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  End Date
                </label>
                <input 
                  type="date"
                  value={campaignForm.end_date} 
                  onChange={e => setCampaignForm(f => ({ ...f, end_date: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              style={buttonStyle}
              disabled={isLoading}
              onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.target.style.transform = 'translateY(0)'}
            >
              {isLoading ? '⏳ Creating...' : '🚀 Create Campaign'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'banners' && (
        <div>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Create New Banner</h3>
          <form onSubmit={handleBannerSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  Campaign ID
                </label>
                <input 
                  type="text"
                  placeholder="Enter campaign ID"
                  value={bannerForm.campaignid} 
                  onChange={e => setBannerForm(f => ({ ...f, campaignid: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  Image URL
                </label>
                <input 
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={bannerForm.image_url} 
                  onChange={e => setBannerForm(f => ({ ...f, image_url: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  Width (px)
                </label>
                <input 
                  type="number"
                  placeholder="728"
                  value={bannerForm.width} 
                  onChange={e => setBannerForm(f => ({ ...f, width: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  Height (px)
                </label>
                <input 
                  type="number"
                  placeholder="90"
                  value={bannerForm.height} 
                  onChange={e => setBannerForm(f => ({ ...f, height: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ccc' }}>
                  Alt Text
                </label>
                <input 
                  type="text"
                  placeholder="Descriptive text for the banner"
                  value={bannerForm.alt_text} 
                  onChange={e => setBannerForm(f => ({ ...f, alt_text: e.target.value }))} 
                  style={inputStyle}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              style={buttonStyle}
              disabled={isLoading}
              onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.target.style.transform = 'translateY(0)'}
            >
              {isLoading ? '⏳ Creating...' : '🎨 Create Banner'}
            </button>
          </form>
        </div>
      )}

      {/* Success/Error Message */}
      {apiMsg && (
        <div style={{ 
          marginTop: '24px',
          padding: '16px',
          borderRadius: '8px',
          background: apiMsg.includes('✅') ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          border: `1px solid ${apiMsg.includes('✅') ? '#4CAF50' : '#F44336'}`,
          color: apiMsg.includes('✅') ? '#4CAF50' : '#F44336',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {apiMsg}
        </div>
      )}
    </div>
  );
}

// Helper: normalize card type for comparison
function isCampaignsCard(card) {
  if (!card) return false;
  // Try both .type and .title for robustness
  const type = (card.type || '').trim().toLowerCase();
  const title = (card.title || '').trim().toLowerCase();
  return type === 'campaigns' || title === 'campaigns';
}

export default function ClientDetailPage({ client, user, onBack, onNavigate, navigationContext }) {
  const [cards, setCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clientStatus, setClientStatus] = useState(client.status || 'Active');
  const [statusSaving, setStatusSaving] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [openCard, setOpenCard] = useState(null);
  const [userType, setUserType] = useState('employee');
  const [showAccessManagement, setShowAccessManagement] = useState(false);

  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/clients/${client.id}/cards`);
      if (!res.ok) throw new Error('Failed to fetch cards');
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
  };

  useEffect(() => {
    fetchCards();
    // Fetch user type
    if (user?.id) {
      fetchUserType();
    }
  }, [user]);

  // Handle navigation context (e.g., returning from AI content generator)
  useEffect(() => {
    if (navigationContext?.openCalendar && navigationContext?.calendarCard) {
      setOpenCard(navigationContext.calendarCard);
    }
  }, [navigationContext]);

  const fetchUserType = async () => {
    try {
      const res = await fetch(`/api/user/accessible-clients?user_id=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserType(data.user_type || 'employee');
      }
    } catch (err) {
      console.error('Error fetching user type:', err);
    }
  };

  const handleAddCard = async (type) => {
    const cardMeta = [
      { type: 'roadmap', title: 'Roadmap', icon: '🗺️', subtitle: 'Project milestones' },
      { type: 'market', title: 'Market Research', icon: '📊', subtitle: 'Analyze your market' },
      { type: 'campaigns', title: 'Campaigns', icon: '📣', subtitle: 'Track campaigns' },
      { type: 'calendar', title: 'SM Content Calendar', icon: '📅', subtitle: 'Plan content' },
      { type: 'influencers', title: 'Influencers', icon: '🤝', subtitle: 'Manage influencers' },
      { type: 'dashboard', title: 'Data Dashboard', icon: '📈', subtitle: 'Track metrics' },
    ].find(c => c.type === type);
    const res = await fetch(`/api/clients/${client.id}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title: cardMeta?.title || type,
        subtitle: cardMeta?.subtitle || '',
        icon: cardMeta?.icon || '',
      })
    });
    if (res.ok) {
      setShowModal(false);
      fetchCards();
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setClientStatus(newStatus);
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      setClientStatus(client.status);
      alert('Failed to update status.');
    }
    setStatusSaving(false);
  };

  const handleDeleteClient = async () => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
      setShowDeleteClient(false);
      onBack();
    } catch (err) {
      alert('Failed to delete client.');
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete card');
      setDeleteCardId(null);
      fetchCards();
    } catch (err) {
      alert('Failed to delete card.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* Restore style block for client and card grid page, only when not in calendar or dashboard */}
      {!(openCard && (openCard.type === 'calendar' || openCard.type === 'dashboard')) && (
        <style>{`
          .header-bar-client {
            width: 100vw;
            min-width: 100vw;
            background: #181818;
            border-bottom: 1.5px solid #222;
            display: flex;
            align-items: center;
            padding: 0 0 0 0;
            height: 88px;
            position: relative;
            z-index: 2;
          }
          .header-bar-client-content {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            height: 100%;
            gap: 24px;
            padding: 0 32px;
          }
          .arrow-btn {
            background: none;
            border: none;
            color: #FFD600;
            font-size: 2.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            margin-right: 12px;
            padding: 8px 12px 8px 0;
            border-radius: 8px;
            transition: background 0.18s;
          }
          .arrow-btn:hover {
            background: #222;
          }
          .client-header-circle {
            background: #FFD600;
            color: #111;
            font-weight: 900;
            font-size: 28px;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px #0002;
          }
          .client-header-title {
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            letter-spacing: 1px;
            margin-right: 8px;
            margin-left: 4px;
            line-height: 1.1;
          }
          .client-header-status {
            margin-left: 0;
          }
          .client-header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-left: auto;
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
            margin: 0 4px;
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
            margin: 0 4px;
          }
          .btn-outline:hover {
            background: #FFD600;
            color: #111;
            transform: translateY(-2px) scale(1.04);
            box-shadow: 0 4px 16px #FFD60044;
          }
          .card-tile {
            background: #181818;
            border-radius: 18px;
            box-shadow: 0 2px 16px #0003;
            padding: 32px 28px 28px 28px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-height: 180px;
            position: relative;
            border: 2px solid #FFD600;
            transition: box-shadow 0.18s, transform 0.18s, border 0.18s;
            margin: 0 0 18px 0;
          }
          .card-tile:hover {
            box-shadow: 0 6px 32px #FFD60055;
            border: 2.5px solid #FFD600;
            transform: translateY(-4px) scale(1.03);
          }
          .delete-menu-icon {
            font-size: 26px;
            color: #FFD600;
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px 10px;
            border-radius: 8px;
            transition: background 0.18s;
          }
          .delete-menu-icon:hover {
            background: #222;
          }
          .delete-menu-dropdown {
            position: absolute;
            right: 0;
            top: 70px;
            background: #181818;
            border: 2px solid #FFD600;
            border-radius: 10px;
            box-shadow: 0 4px 16px #FFD60044;
            z-index: 10;
            min-width: 160px;
          }
          .delete-menu-dropdown button {
            width: 100%;
            background: none;
            color: #FFD600;
            border: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 16px;
            padding: 12px 18px;
            text-align: left;
            cursor: pointer;
            transition: background 0.18s, color 0.18s;
          }
          .delete-menu-dropdown button:hover {
            background: #FFD600;
            color: #111;
          }
        `}</style>
      )}
      {openCard && openCard.type === 'calendar' ? (
        <>
          {/* No HeaderBar here! Only back arrow and calendar */}
          <style>{`
            .calendar-back-btn {
              background: #181818;
              border: 2px solid #FFD600;
              color: #FFD600;
              font-size: 2.2rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 12px 16px;
              border-radius: 12px;
              transition: all 0.2s;
              font-weight: 700;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              margin: 32px 0 0 16px;
              width: 60px;
              height: 60px;
            }
            .calendar-back-btn:hover {
              background: #FFD600;
              color: #111;
              transform: translateY(-2px) scale(1.04);
              box-shadow: 0 4px 16px rgba(255, 214, 0, 0.3);
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <button className="calendar-back-btn" onClick={() => setOpenCard(null)} title="Back">
              <span>&larr;</span>
            </button>
            <SMContentCalendar 
              clientId={client.id} 
              user={client.user} 
              onBack={() => setOpenCard(null)} 
              onNavigate={(view) => {
                console.log('ClientDetailPage onNavigate called with:', view);
                console.log('openCard:', openCard);
                if (view === 'ai-content') {
                  // Pass the calendar card context to the parent
                  console.log('Calling parent onNavigate with ai-content and context');
                  onNavigate(view, { calendarCard: openCard });
                } else {
                  console.log('Calling parent onNavigate with:', view);
                  onNavigate(view);
                }
              }} 
            />
          </div>
        </>
      ) : openCard && openCard.type === 'dashboard' ? (
        <>
          {/* Social Media Insights Dashboard with back arrow */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '80vh' }}>
            <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0 24px 0' }}>
                <button 
                  onClick={() => setOpenCard(null)} 
                  title="Back"
                  style={{
                    background: '#181818',
                    border: '2px solid #FFD600',
                    color: '#FFD600',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    fontSize: '20px',
                    fontWeight: '700',
                    width: '48px',
                    height: '48px',
                    marginRight: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#FFD600';
                    e.target.style.color = '#111';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#181818';
                    e.target.style.color = '#FFD600';
                  }}
                >
                  ←
                </button>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD600' }}>{client.name} – Dashboard</div>
              </div>
              <SocialMediaInsightsDashboard 
                user={user} 
                onLogout={() => {}} 
                onLogoClick={() => setOpenCard(null)} 
              />
            </div>
          </div>
        </>
      ) : openCard && isCampaignsCard(openCard) ? (
        <>
          {/* Campaigns Card Content */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '80vh' }}>
            <div style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0 24px 0' }}>
                <button className="arrow-btn" onClick={() => setOpenCard(null)} title="Back">
                  <span style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center' }}>&larr;</span>
                </button>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD600', marginLeft: 16 }}>{client.name} – Campaigns</div>
              </div>
              <CampaignsCardContent client={client} />
            </div>
          </div>
        </>
      ) : (
        <>
          <header className="header-bar-client">
            <div className="header-bar-client-content">
              <button className="arrow-btn" onClick={onBack} title="Back">
                <span style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center' }}>&larr;</span>
              </button>
              <div className="client-header-circle">
                {client.name.split(' ').map(w => w[0]).join('').toUpperCase()}
              </div>
              <span className="client-header-title">{client.name}</span>
              <select
                value={clientStatus}
                onChange={handleStatusChange}
                disabled={statusSaving || userType === 'client'}
                className="client-header-status"
                style={{
                  padding: '8px 22px',
                  borderRadius: 10,
                  border: '2px solid #FFD600',
                  fontWeight: 700,
                  fontSize: 16,
                  background: '#111',
                  color: clientStatus === 'Active' ? '#FFD600' : clientStatus === 'On Hold' ? '#fbc02d' : clientStatus === 'Inactive' ? '#FF5E13' : '#fff',
                  minWidth: 120,
                  boxShadow: '0 2px 8px #0002',
                  outline: 'none',
                  cursor: statusSaving ? 'wait' : userType === 'client' ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  margin: '0 4px',
                }}
              >
                <option value="Active" style={{ color: '#FFD600', background: '#111' }}>Active</option>
                <option value="On Hold" style={{ color: '#fbc02d', background: '#111' }}>On Hold</option>
                <option value="Inactive" style={{ color: '#FF5E13', background: '#111' }}>Inactive</option>
                <option value="Archived" style={{ color: '#fff', background: '#111' }}>Archived</option>
              </select>
              {statusSaving && <span style={{ color: '#FFD600', fontSize: 15, marginLeft: 8 }}>Saving…</span>}
              <div className="client-header-actions">
                {userType === 'employee' ? (
                  <>
                    <button className="btn-flat" onClick={() => setShowModal(true)}>
                      + Add a Card
                    </button>
                    <button className="btn-flat" onClick={() => setShowAccessManagement(true)}>
                      🔐 Manage Access
                    </button>
                    <button className="btn-flat" style={{ background: '#dc2626', color: '#fff' }} onClick={() => setShowDeleteClient(true)}>
                      Delete Client
                    </button>
                  </>
                ) : (
                  <span style={{ color: '#FFD600', fontSize: 16, fontWeight: 'bold' }}>
                    📋 Client View
                  </span>
                )}
              </div>
            </div>
          </header>
          <main style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
            {showModal && <AddCardModal client={client} onClose={() => setShowModal(false)} onAdd={handleAddCard} theme="black-yellow" />}
            <div style={{ width: '100%', maxWidth: 1100, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, padding: '2.5rem 2.5rem 2.5rem 2.5rem', margin: '0 auto' }}>
              {cards.length > 0 ? cards.map(card => (
                <div key={card.id} className="card-tile">
                  <div style={{ fontSize: 36, marginBottom: 12, color: '#FFD600' }}>{card.icon || '📄'}</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 6 }}>{card.title}</div>
                  <div style={{ color: '#FFD600', fontSize: 15, marginBottom: 10 }}>{card.subtitle}</div>
                  <div style={{ color: '#bbb', fontSize: 13, marginBottom: 10 }}>{card.created_at ? new Date(card.created_at).toLocaleDateString() : ''}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                    <button className="btn-flat" onClick={() => { console.log('Open clicked for card:', card); setOpenCard({ ...card }); }}>Open</button>
                    {userType === 'employee' && (
                      <>
                        <button className="btn-outline">Edit</button>
                        <button className="btn-outline" onClick={() => setDeleteCardId(card.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              )) : <p style={{ color: '#FFD600', fontSize: 18, gridColumn: '1/-1', textAlign: 'center', margin: '3rem 0' }}>No cards yet.</p>}
            </div>
          </main>
        </>
      )}
      {/* Delete Client Modal */}
      {showDeleteClient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#181818', color: '#FFD600', borderRadius: 18, padding: '2.5rem 2rem', maxWidth: 400, width: '95vw', textAlign: 'center', boxShadow: '0 8px 32px #0005', border: '2px solid #FFD600' }}>
            <h3 style={{ color: '#dc2626', fontWeight: 800, fontSize: 24, marginBottom: 18 }}>Delete Client</h3>
            <p style={{ color: '#fff' }}>Are you sure you want to delete this client? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 24 }}>
              <button className="btn-flat" style={{ background: '#dc2626', color: '#fff' }} onClick={handleDeleteClient}>Delete</button>
              <button className="btn-flat" onClick={() => setShowDeleteClient(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Card Modal */}
      {deleteCardId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#181818', color: '#FFD600', borderRadius: 18, padding: '2.5rem 2rem', maxWidth: 400, width: '95vw', textAlign: 'center', boxShadow: '0 8px 32px #0005', border: '2px solid #FFD600' }}>
            <h3 style={{ color: '#dc2626', fontWeight: 800, fontSize: 24, marginBottom: 18 }}>Delete Card</h3>
            <p style={{ color: '#fff' }}>Are you sure you want to delete this card? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 24 }}>
              <button className="btn-flat" style={{ background: '#dc2626', color: '#fff' }} onClick={() => handleDeleteCard(deleteCardId)}>Delete</button>
              <button className="btn-flat" onClick={() => setDeleteCardId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Client Access Management Modal */}
      {showAccessManagement && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#181818', color: '#FFD600', borderRadius: 18, padding: '2.5rem 2rem', maxWidth: 800, width: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px #0005', border: '2px solid #FFD600' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#FFD600', fontWeight: 800, fontSize: 24, margin: 0 }}>🔐 Client Access Management</h3>
              <button 
                onClick={() => setShowAccessManagement(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD600',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#333'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            <ClientAccessManager clientId={client.id} userType={userType} />
          </div>
        </div>
      )}
      {/* Move any reusable business logic to core/businessLogic.js for architecture consistency */}
    </div>
  );
}
