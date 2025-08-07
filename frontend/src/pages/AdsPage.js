import React, { useState, useEffect, useMemo } from 'react';

const AdsPage = ({ user }) => {
  // Theme matching your site's black and yellow design
  const theme = {
    bg: '#111',
    cardBg: '#181818',
    accent: '#FFD600',
    text: '#FFD600',
    border: '#FFD600',
    green: '#10B981',
    red: '#F87171',
    orange: '#FFA500',
  };

  // Client selection state
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');

  // Weekly timeline state
  const [weekData, setWeekData] = useState({
    weekRange: "August 4–10, 2025",
    days: [
      { id: 'mon', name: 'Monday', date: 'Aug 4', active: true, campaigns: [] },
      { id: 'tue', name: 'Tuesday', date: 'Aug 5', active: true, campaigns: [] },
      { id: 'wed', name: 'Wednesday', date: 'Aug 6', active: false, campaigns: [] },
      { id: 'thu', name: 'Thursday', date: 'Aug 7', active: true, campaigns: [] },
      { id: 'fri', name: 'Friday', date: 'Aug 8', active: true, campaigns: [] },
      { id: 'sat', name: 'Saturday', date: 'Aug 9', active: false, campaigns: [] },
      { id: 'sun', name: 'Sunday', date: 'Aug 10', active: true, campaigns: [] }
    ]
  });

  // Incoming requests state - ensure it's always an array
  const [incomingRequests, setIncomingRequests] = useState([
    { id: 1, brand: 'Nike', campaign: 'Air Max 2025 Launch', budget: '$50K', urgency: 'high', client_id: null },
    { id: 2, brand: 'Apple', campaign: 'iPhone 17 Pro', budget: '$100K', urgency: 'medium', client_id: null }
  ]);

  // Sponsorship history state
  const [sponsorshipHistory, setSponsorshipHistory] = useState([
    {
      id: 1,
      campaign: 'Summer Fashion Week',
      brand: 'Zara',
      client_id: '1', // Action Labs
      totalSponsorships: 15,
      engagement: 'high',
      recentRuns: ['July 15', 'July 22', 'July 29'],
      performance: [85, 92, 78, 88, 95],
      aiTip: 'Best performing day: Thursday'
    },
    {
      id: 2,
      campaign: 'Tech Innovation',
      brand: 'Samsung',
      client_id: '2', // Sample Client
      totalSponsorships: 8,
      engagement: 'medium',
      recentRuns: ['July 10', 'July 17', 'July 24'],
      performance: [65, 70, 68, 72, 75],
      aiTip: 'Try more Friday runs for higher engagement'
    },
    {
      id: 3,
      campaign: 'AI Revolution 2025',
      brand: 'OpenAI',
      client_id: '1', // Action Labs
      totalSponsorships: 22,
      engagement: 'high',
      recentRuns: ['Aug 1', 'Aug 3', 'Aug 5'],
      performance: [95, 88, 92, 90, 98],
      aiTip: 'Peak engagement on weekdays'
    }
  ]);

  const [showHistory, setShowHistory] = useState(false);
  const [draggedCampaign, setDraggedCampaign] = useState(null);
  const [draggedRequest, setDraggedRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
    fetchIncomingRequests();
    fetchSponsorshipHistory();
  }, []);

  // Fetch data when selected client changes
  useEffect(() => {
    if (selectedClient) {
      fetchIncomingRequests();
      fetchSponsorshipHistory();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Set fallback clients if API fails
      setClients([
        { id: '1', name: 'Action Labs', industry: 'Technology' },
        { id: '2', name: 'Sample Client', industry: 'Business' }
      ]);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const url = selectedClient === 'all' 
        ? '/api/ads/incoming-requests' 
        : `/api/ads/incoming-requests?client_id=${selectedClient}`;
      const response = await fetch(url);
      const data = await response.json();
      setIncomingRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      setIncomingRequests([]); // Set to empty array on error
    }
  };

  const fetchSponsorshipHistory = async () => {
    try {
      const url = selectedClient === 'all' 
        ? '/api/ads/sponsorship-history' 
        : `/api/ads/sponsorship-history?client_id=${selectedClient}`;
      const response = await fetch(url);
      const data = await response.json();
      setSponsorshipHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sponsorship history:', error);
      setSponsorshipHistory([]); // Set to empty array on error
    }
  };

  const saveTimelineData = async () => {
    try {
      const timelineData = {
        week_start: '2025-08-04', // You can calculate this dynamically
        week_range: weekData.weekRange,
        client_id: selectedClient,
        days: weekData.days
      };

      await fetch('/api/ads/timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timelineData)
      });
    } catch (error) {
      console.error('Error saving timeline data:', error);
    }
  };

  // Sample campaigns with categories and colors
  const sampleCampaigns = [
    { id: 'camp1', title: 'Summer Collection Launch', brand: 'H&M', category: 'fashion', color: '#3B82F6', icon: '👗' },
    { id: 'camp2', title: 'New Smartphone Release', brand: 'OnePlus', category: 'tech', color: '#F97316', icon: '📱' },
    { id: 'camp3', title: 'Wellness Challenge', brand: 'Nike', category: 'wellness', color: theme.green, icon: '🏃‍♂️' }
  ];

  // Initialize with sample data
  useEffect(() => {
    const updatedWeekData = { ...weekData };
    updatedWeekData.days[0].campaigns = [sampleCampaigns[0]];
    updatedWeekData.days[1].campaigns = [sampleCampaigns[1]];
    updatedWeekData.days[3].campaigns = [sampleCampaigns[2]];
    setWeekData(updatedWeekData);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e, campaign, sourceDayId) => {
    setDraggedCampaign({ campaign, sourceDayId });
    setDraggedRequest(null);
  };

  const handleRequestDragStart = (e, request) => {
    setDraggedRequest(request);
    setDraggedCampaign(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDayId) => {
    e.preventDefault();
    
    if (draggedCampaign) {
      const { campaign, sourceDayId } = draggedCampaign;
      if (sourceDayId === targetDayId) {
        setDraggedCampaign(null);
        return;
      }

      const newWeekData = { ...weekData };
      const sourceDay = newWeekData.days.find(day => day.id === sourceDayId);
      const targetDay = newWeekData.days.find(day => day.id === targetDayId);
      
      if (sourceDay && targetDay && targetDay.active) {
        sourceDay.campaigns = (sourceDay.campaigns || []).filter(c => c.id !== campaign.id);
        targetDay.campaigns = [...(targetDay.campaigns || []), campaign];
        setWeekData(newWeekData);
      }
      setDraggedCampaign(null);
    }

    if (draggedRequest) {
      const targetDay = weekData.days.find(day => day.id === targetDayId);
      if (targetDay && targetDay.active) {
        // Convert request to campaign and add to timeline
        const newCampaign = {
          id: `req_${draggedRequest.id}_${Date.now()}`,
          title: draggedRequest.campaign,
          brand: draggedRequest.brand,
          category: 'sponsored',
          color: draggedRequest.urgency === 'high' ? theme.red : theme.orange,
          icon: '💰'
        };

        const newWeekData = { ...weekData };
        const day = newWeekData.days.find(d => d.id === targetDayId);
        day.campaigns = [...(day.campaigns || []), newCampaign];
        setWeekData(newWeekData);

        // Remove from incoming requests and save changes
        setIncomingRequests(prev => Array.isArray(prev) ? prev.filter(req => req.id !== draggedRequest.id) : []);
        
        // Delete from backend (async but don't block UI)
        fetch(`/api/ads/incoming-requests/${draggedRequest.id}`, {
          method: 'DELETE'
        }).catch(error => console.error('Error deleting request:', error));

        // Save updated timeline (async but don't block UI)
        saveTimelineData();
      }
      setDraggedRequest(null);
    }
  };

  const toggleDayActive = (dayId) => {
    const newWeekData = { ...weekData };
    const day = newWeekData.days.find(d => d.id === dayId);
    if (day) {
      day.active = !day.active;
      // If deactivating, move campaigns back to incoming requests
      if (!day.active && (day.campaigns || []).length > 0) {
        const newRequests = (day.campaigns || []).map(campaign => ({
          id: Date.now() + Math.random(),
          brand: campaign.brand,
          campaign: campaign.title,
          budget: '$TBD',
          urgency: 'medium',
          client_id: selectedClient !== 'all' ? selectedClient : null
        }));
        setIncomingRequests(prev => [...prev, ...newRequests]);
        day.campaigns = [];
      }
      setWeekData(newWeekData);
      
      // Save changes to backend (async)
      saveTimelineData();
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const handleCloseRequestDetails = () => {
    setSelectedRequest(null);
    setShowRequestDetails(false);
  };

  const handleRemoveCampaign = (dayId, campaignId) => {
    const newWeekData = { ...weekData };
    const day = newWeekData.days.find(d => d.id === dayId);
    if (day) {
      // Find the campaign to remove
      const campaignToRemove = (day.campaigns || []).find(c => c.id === campaignId);
      
      if (campaignToRemove) {
        // Convert campaign back to a request format
        const newRequest = {
          id: Date.now(), // Generate new ID for the request
          brand: campaignToRemove.brand,
          campaign: campaignToRemove.campaign,
          budget: campaignToRemove.budget,
          urgency: 'medium',
          client_id: campaignToRemove.client_id,
          description: `Moved back from ${day.name} ${day.date}`,
          status: 'pending'
        };
        
        // Add back to incoming requests
        setIncomingRequests(prev => Array.isArray(prev) ? [...prev, newRequest] : [newRequest]);
      }
      
      // Remove from timeline
      day.campaigns = (day.campaigns || []).filter(c => c.id !== campaignId);
      setWeekData(newWeekData);
      
      // Save changes to backend (async)
      saveTimelineData();
    }
  };

  // Campaign card component
  const CampaignCard = ({ campaign, dayId }) => (
    <div
      style={{
        background: theme.cardBg,
        border: `2px solid ${campaign.color}`,
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '8px',
        cursor: 'grab',
        color: theme.text,
        position: 'relative',
        boxShadow: `0 2px 8px ${theme.accent}22`
      }}
      draggable
      onDragStart={(e) => handleDragStart(e, campaign, dayId)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '20px' }}>{campaign.icon}</span>
        <button
          onClick={() => handleRemoveCampaign(dayId, campaign.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.text,
            fontSize: '18px',
            cursor: 'pointer',
            padding: '2px'
          }}
        >
          ×
        </button>
      </div>
      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{campaign.title}</h4>
      <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>{campaign.brand}</p>
    </div>
  );

  // Sparkline component for performance charts
  const Sparkline = ({ data, color }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '30px', gap: '2px', marginTop: '8px' }}>
      {data.map((value, index) => (
        <div
          key={index}
          style={{
            width: '4px',
            height: `${Math.max(4, (value / 100) * 30)}px`,
            background: color,
            borderRadius: '2px'
          }}
        />
      ))}
    </div>
  );

  // Filter data based on selected client with null safety
  const filteredIncomingRequests = useMemo(() => {
    if (!Array.isArray(incomingRequests)) return [];
    
    return selectedClient === 'all' 
      ? incomingRequests
      : incomingRequests.filter(req => req.client_id === selectedClient);
  }, [incomingRequests, selectedClient]);

  const filteredSponsorshipHistory = useMemo(() => {
    if (!Array.isArray(sponsorshipHistory)) return [];
    
    return selectedClient === 'all'
      ? sponsorshipHistory
      : sponsorshipHistory.filter(item => item.client_id === selectedClient);
  }, [sponsorshipHistory, selectedClient]);

  const getEngagementColor = (level) => {
    switch (level) {
      case 'high': return theme.green;
      case 'medium': return theme.accent;
      case 'low': return theme.red;
      default: return theme.accent;
    }
  };

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', padding: '20px', color: theme.text }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: theme.accent, fontWeight: 'bold', fontSize: '32px', margin: 0 }}>
            Ads Sponsorship Timeline
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: theme.text, fontWeight: 'bold', fontSize: '18px' }}>
              {weekData.weekRange}
            </span>
            <button style={{
              background: theme.accent,
              color: theme.bg,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              ← Previous
            </button>
            <button style={{
              background: theme.accent,
              color: theme.bg,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Next →
            </button>
          </div>
        </div>

        {/* Client Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <label style={{ color: theme.text, fontWeight: 'bold' }}>Client:</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{
              background: theme.cardBg,
              color: theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Clients</option>
            {(clients || []).map(client => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.industry})
              </option>
            ))}
          </select>
          <span style={{ 
            color: theme.accent, 
            fontSize: '12px',
            background: theme.cardBg,
            padding: '4px 8px',
            borderRadius: '6px',
            border: `1px solid ${theme.border}22`
          }}>
            📊 {filteredIncomingRequests.length} pending • {filteredSponsorshipHistory.length} campaigns
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Weekly Timeline View */}
        <div style={{ flex: 2 }}>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
            {(weekData.days || []).map(day => (
              <div
                key={day.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.id)}
                style={{
                  background: theme.cardBg,
                  border: day.active ? `2px solid ${theme.border}` : '2px solid #333',
                  borderRadius: '16px',
                  minWidth: '180px',
                  padding: '16px',
                  boxShadow: day.active ? `0 0 12px ${theme.accent}44` : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{day.name}</h3>
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>{day.date}</p>
                  </div>
                  <button
                    onClick={() => toggleDayActive(day.id)}
                    style={{
                      background: day.active ? theme.accent : 'transparent',
                      color: day.active ? theme.bg : theme.text,
                      border: `2px solid ${day.active ? theme.accent : '#666'}`,
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {day.active ? '✅ Active' : '⚪ Inactive'}
                  </button>
                </div>
                
                <div style={{ minHeight: '200px' }}>
                  {(day.campaigns || []).map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} dayId={day.id} />
                  ))}
                  {(day.campaigns || []).length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      color: day.active ? '#888' : '#555',
                      fontStyle: 'italic',
                      marginTop: '50px',
                      padding: '20px',
                      border: `2px dashed ${day.active ? '#333' : '#222'}`,
                      borderRadius: '8px',
                      pointerEvents: day.active ? 'auto' : 'none'
                    }}>
                      {day.active ? 'Drop campaigns here' : 'Day inactive'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Incoming Requests Panel */}
          <div style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${theme.border}22`
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>Incoming Requests</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                background: theme.orange,
                color: theme.bg,
                borderRadius: '12px',
                padding: '4px 10px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {filteredIncomingRequests.length}
              </span>
              <span style={{ fontWeight: 'bold' }}>Pending</span>
              {selectedClient !== 'all' && (
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  for {clients.find(c => c.id === selectedClient)?.name}
                </span>
              )}
            </div>
            
            {filteredIncomingRequests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredIncomingRequests.map(request => (
                  <div 
                    key={request.id} 
                    style={{
                      background: '#222',
                      borderRadius: '8px',
                      padding: '12px',
                      border: `1px solid ${theme.border}22`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    draggable
                    onDragStart={(e) => handleRequestDragStart(e, request)}
                    onClick={() => handleRequestClick(request)}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#333';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = `0 4px 12px ${theme.accent}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#222';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{request.campaign}</h4>
                      <span style={{
                        background: request.urgency === 'high' ? theme.red : request.urgency === 'medium' ? theme.orange : theme.green,
                        color: theme.bg,
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {request.urgency}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '12px', opacity: 0.8 }}>{request.brand}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: theme.accent, fontWeight: 'bold' }}>{request.budget}</p>
                      <span style={{ fontSize: '10px', opacity: 0.6 }}>👆 Click for details</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No pending requests</p>
            )}
          </div>

          {/* Sponsorship History Section */}
          <div style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${theme.border}22`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Sponsorship History</h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  background: theme.accent,
                  color: theme.bg,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </div>

            {showHistory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredSponsorshipHistory.map(item => (
                  <div key={item.id} style={{
                    background: '#222',
                    borderRadius: '8px',
                    padding: '16px',
                    border: `1px solid ${theme.border}22`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{item.campaign}</h4>
                      <span style={{
                        background: getEngagementColor(item.engagement),
                        color: item.engagement === 'medium' ? theme.bg : '#fff',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {item.engagement}
                      </span>
                    </div>
                    
                    <p style={{ margin: '4px 0', fontSize: '12px', opacity: 0.8 }}>{item.brand}</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: theme.accent }}>
                      {item.totalSponsorships} sponsorships
                    </p>
                    
                    {/* Performance Chart */}
                    <Sparkline data={item.performance} color={getEngagementColor(item.engagement)} />
                    
                    {/* Recent Run Dates */}
                    <div style={{ display: 'flex', gap: '4px', margin: '12px 0 8px 0', flexWrap: 'wrap' }}>
                      {(item.recentRuns || []).map((date, index) => (
                        <span key={index} style={{
                          background: theme.accent,
                          color: theme.bg,
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {date}
                        </span>
                      ))}
                    </div>
                    
                    {/* AI Tip */}
                    <div style={{
                      color: theme.text,
                      fontSize: '11px',
                      fontStyle: 'italic',
                      opacity: 0.8,
                      marginTop: '8px'
                    }}>
                      💡 {item.aiTip}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `2px solid ${theme.border}`,
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: theme.text, fontSize: '20px' }}>Request Details</h2>
              <button
                onClick={handleCloseRequestDetails}
                style={{
                  background: theme.red,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  CAMPAIGN NAME
                </label>
                <p style={{ margin: 0, color: theme.text, fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedRequest.campaign}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  BRAND
                </label>
                <p style={{ margin: 0, color: theme.text, fontSize: '16px' }}>
                  {selectedRequest.brand}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    BUDGET
                  </label>
                  <p style={{ margin: 0, color: theme.accent, fontSize: '18px', fontWeight: 'bold' }}>
                    {selectedRequest.budget}
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    URGENCY
                  </label>
                  <span style={{
                    background: selectedRequest.urgency === 'high' ? theme.red : selectedRequest.urgency === 'medium' ? theme.orange : theme.green,
                    color: theme.bg,
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {selectedRequest.urgency}
                  </span>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    DESCRIPTION
                  </label>
                  <p style={{ margin: 0, color: theme.text, fontSize: '14px', lineHeight: '1.5' }}>
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              {selectedRequest.contact_email && (
                <div>
                  <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    CONTACT EMAIL
                  </label>
                  <p style={{ margin: 0, color: theme.text, fontSize: '14px' }}>
                    {selectedRequest.contact_email}
                  </p>
                </div>
              )}

              {selectedRequest.deadline && (
                <div>
                  <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    DEADLINE
                  </label>
                  <p style={{ margin: 0, color: theme.text, fontSize: '14px' }}>
                    {new Date(selectedRequest.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  STATUS
                </label>
                <span style={{
                  background: selectedRequest.status === 'pending' ? theme.orange : theme.green,
                  color: theme.bg,
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {selectedRequest.status}
                </span>
              </div>

              {selectedRequest.created_at && (
                <div>
                  <label style={{ display: 'block', color: theme.accent, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    SUBMITTED
                  </label>
                  <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div style={{ 
              marginTop: '20px',
              padding: '16px',
              background: '#1a1a1a',
              borderRadius: '8px',
              border: `1px solid ${theme.border}22`
            }}>
              <p style={{ margin: 0, color: theme.accent, fontSize: '12px', fontWeight: 'bold' }}>
                💡 TIP: Drag this request to any active day on the timeline to schedule it!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsPage;
