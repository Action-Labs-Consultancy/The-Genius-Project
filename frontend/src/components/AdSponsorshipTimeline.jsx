import React, { useState, useRef } from 'react';
import './AdSponsorshipTimeline.css';

const AdSponsorshipTimeline = ({ user }) => {
  const [activeDays, setActiveDays] = useState(new Set());
  const [scheduledAds, setScheduledAds] = useState({});
  const [selectedClient, setSelectedClient] = useState('all');
  const [activeTab, setActiveTab] = useState('timeline');
  
  // Mock clients data - replace with real data from your API
  const [clients] = useState([
    { id: 'all', name: 'All Clients' },
    { id: 1, name: 'Nike Corporation' },
    { id: 2, name: 'Apple Inc.' },
    { id: 3, name: 'Protein World Ltd.' },
    { id: 4, name: 'Razer Gaming' },
    { id: 5, name: 'Tesla Motors' }
  ]);

  const [incomingRequests, setIncomingRequests] = useState([
    {
      id: 1,
      title: "Summer Sale Campaign",
      brand: "Nike",
      product: "Air Jordan Sneakers",
      duration: "30 seconds",
      budget: "$2,500",
      clientId: 1,
      status: "pending",
      priority: "high",
      requestDate: "2025-08-05"
    },
    {
      id: 2,
      title: "Tech Review Sponsorship",
      brand: "Apple",
      product: "iPhone 15 Pro",
      duration: "45 seconds",
      budget: "$3,800",
      clientId: 2,
      status: "pending",
      priority: "medium",
      requestDate: "2025-08-04"
    },
    {
      id: 3,
      title: "Fitness Challenge",
      brand: "Protein World",
      product: "Whey Protein",
      duration: "20 seconds",
      budget: "$1,200",
      clientId: 3,
      status: "pending",
      priority: "low",
      requestDate: "2025-08-06"
    },
    {
      id: 4,
      title: "Gaming Setup Review",
      brand: "Razer",
      product: "Gaming Keyboard",
      duration: "35 seconds",
      budget: "$1,800",
      clientId: 4,
      status: "pending",
      priority: "medium",
      requestDate: "2025-08-03"
    }
  ]);

  const [sponsorshipHistory, setSponsorshipHistory] = useState([
    {
      id: 1,
      title: "Holiday Collection Launch",
      brand: "Nike",
      client: "Nike Corporation",
      scheduledDate: "2025-07-28",
      completedDate: "2025-07-28",
      performance: { views: 125000, clicks: 8500, ctr: "6.8%" },
      revenue: "$2,500",
      status: "completed"
    },
    {
      id: 2,
      title: "MacBook Pro Review",
      brand: "Apple", 
      client: "Apple Inc.",
      scheduledDate: "2025-07-25",
      completedDate: "2025-07-25",
      performance: { views: 89000, clicks: 12400, ctr: "13.9%" },
      revenue: "$4,200",
      status: "completed"
    },
    {
      id: 3,
      title: "Workout Supplement Demo",
      brand: "Protein World",
      client: "Protein World Ltd.",
      scheduledDate: "2025-07-22",
      completedDate: null,
      performance: { views: 0, clicks: 0, ctr: "0%" },
      revenue: "$0",
      status: "cancelled"
    }
  ]);

  const draggedItem = useRef(null);
  const dragOverDay = useRef(null);

  // Generate week days (Monday to Sunday)
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push({
        date: day,
        dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day.getDate().toString().padStart(2, '0'),
        fullDate: day.toISOString().split('T')[0]
      });
    }
    return weekDays;
  };

  const weekDays = getWeekDays();

  const toggleDayActive = (dayKey) => {
    const newActiveDays = new Set(activeDays);
    if (newActiveDays.has(dayKey)) {
      newActiveDays.delete(dayKey);
      // Remove scheduled ads for inactive day
      const newScheduledAds = { ...scheduledAds };
      delete newScheduledAds[dayKey];
      setScheduledAds(newScheduledAds);
    } else {
      newActiveDays.add(dayKey);
    }
    setActiveDays(newActiveDays);
  };

  const handleDragStart = (e, request) => {
    draggedItem.current = request;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    draggedItem.current = null;
    dragOverDay.current = null;
  };

  const handleDragOver = (e, dayKey) => {
    e.preventDefault();
    dragOverDay.current = dayKey;
    
    if (activeDays.has(dayKey)) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e) => {
    dragOverDay.current = null;
  };

  const handleDrop = (e, dayKey) => {
    e.preventDefault();
    
    if (!activeDays.has(dayKey) || !draggedItem.current) {
      return;
    }

    const draggedRequest = draggedItem.current;

    // Add the ad to the scheduled day
    const newScheduledAds = { ...scheduledAds };
    if (!newScheduledAds[dayKey]) {
      newScheduledAds[dayKey] = [];
    }
    newScheduledAds[dayKey].push(draggedRequest);
    setScheduledAds(newScheduledAds);

    // Remove from incoming requests - using the saved reference
    setIncomingRequests(prev => 
      prev.filter(request => request.id !== draggedRequest.id)
    );

    draggedItem.current = null;
    dragOverDay.current = null;
  };

  const removeAdFromDay = (dayKey, adId) => {
    const newScheduledAds = { ...scheduledAds };
    newScheduledAds[dayKey] = newScheduledAds[dayKey].filter(ad => ad.id !== adId);
    
    if (newScheduledAds[dayKey].length === 0) {
      delete newScheduledAds[dayKey];
    }
    
    setScheduledAds(newScheduledAds);

    // Add back to incoming requests
    const removedAd = scheduledAds[dayKey].find(ad => ad.id === adId);
    if (removedAd) {
      setIncomingRequests(prev => [...prev, removedAd]);
    }
  };

  // Filter requests based on selected client
  const filteredRequests = selectedClient === 'all' 
    ? incomingRequests 
    : incomingRequests.filter(req => req.clientId === selectedClient);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFD600';
      case 'low': return '#4ECDC4';
      default: return '#FFD600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4ECDC4';
      case 'cancelled': return '#FF6B6B';
      case 'pending': return '#FFD600';
      default: return '#FFD600';
    }
  };

  return (
    <div className="ad-sponsorship-timeline">
      {/* Header Section */}
      <div className="timeline-header">
        <div className="header-content">
          <div className="title-section">
            <h1>📺 Ad Sponsorship Manager</h1>
            <p>Manage and schedule sponsored content across your timeline</p>
          </div>
          
          <div className="header-controls">
            <div className="client-selector">
              <label htmlFor="client-select">Client:</label>
              <select 
                id="client-select"
                value={selectedClient} 
                onChange={(e) => setSelectedClient(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="client-dropdown"
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                📅 Timeline
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                📊 History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'timeline' ? (
        <div className="timeline-content">
          <div className="timeline-container">
            <div className="timeline-main">
              <div className="timeline-instructions">
                <div className="instruction-card">
                  <div className="instruction-icon">👆</div>
                  <div className="instruction-text">
                    <h4>Activate Days</h4>
                    <p>Click on any day to make it active for sponsored content</p>
                  </div>
                </div>
                <div className="instruction-card">
                  <div className="instruction-icon">🖱️</div>
                  <div className="instruction-text">
                    <h4>Schedule Content</h4>
                    <p>Drag sponsorship requests onto active days to schedule them</p>
                  </div>
                </div>
              </div>

              <div className="weekly-calendar">
                {weekDays.map((day) => {
                  const dayKey = day.fullDate;
                  const isActive = activeDays.has(dayKey);
                  const isDragOver = dragOverDay.current === dayKey;
                  const dayAds = scheduledAds[dayKey] || [];

                  return (
                    <div
                      key={dayKey}
                      className={`day-block ${isActive ? 'active' : ''} ${isDragOver && isActive ? 'drag-over' : ''} ${isDragOver && !isActive ? 'drag-invalid' : ''}`}
                      onClick={() => toggleDayActive(dayKey)}
                      onDragOver={(e) => handleDragOver(e, dayKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayKey)}
                    >
                      <div className="day-header">
                        <div className="day-info">
                          <div className="day-name">{day.dayName}</div>
                          <div className="day-number">{day.dayNumber}</div>
                        </div>
                        {isActive && <div className="active-indicator">🟢</div>}
                      </div>

                      <div className="day-content">
                        {isActive ? (
                          dayAds.length === 0 ? (
                            <div className="empty-day">
                              <div className="drop-zone">
                                <div className="drop-icon">📤</div>
                                <span>Drop ads here</span>
                              </div>
                            </div>
                          ) : (
                            <div className="scheduled-ads">
                              {dayAds.map((ad) => (
                                <div key={ad.id} className="scheduled-ad-card">
                                  <div className="ad-priority" style={{ backgroundColor: getPriorityColor(ad.priority) }}></div>
                                  <div className="ad-content">
                                    <div className="ad-title">{ad.title}</div>
                                    <div className="ad-brand">{ad.brand}</div>
                                    <div className="ad-meta">
                                      <span className="ad-budget">{ad.budget}</span>
                                      <span className="ad-duration">{ad.duration}</span>
                                    </div>
                                  </div>
                                  <button
                                    className="remove-ad-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeAdFromDay(dayKey, ad.id);
                                    }}
                                    title="Remove sponsorship"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className="inactive-day">
                            <div className="activate-prompt">
                              <div className="activate-icon">⚫</div>
                              <span>Click to activate</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="requests-panel">
              <div className="panel-header">
                <h3>🔔 Pending Requests</h3>
                <div className="request-stats">
                  <span className="stat-badge">{filteredRequests.length} Total</span>
                  <span className="stat-badge priority-high">{filteredRequests.filter(r => r.priority === 'high').length} High</span>
                </div>
              </div>

              <div className="requests-list">
                {filteredRequests.length === 0 ? (
                  <div className="empty-requests">
                    <div className="empty-illustration">
                      <div className="empty-icon">📭</div>
                      <h4>No Pending Requests</h4>
                      <p>All sponsorship requests have been scheduled or there are no requests for the selected client.</p>
                    </div>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="request-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, request)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="request-priority" style={{ backgroundColor: getPriorityColor(request.priority) }}></div>
                      <div className="request-content">
                        <div className="request-header">
                          <div className="request-title">{request.title}</div>
                          <div className="drag-handle">⋮⋮</div>
                        </div>
                        <div className="request-brand">{request.brand}</div>
                        <div className="request-product">{request.product}</div>
                        <div className="request-details">
                          <div className="detail-row">
                            <span className="detail-label">Budget:</span>
                            <span className="detail-value budget">{request.budget}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{request.duration}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Requested:</span>
                            <span className="detail-value">{new Date(request.requestDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="request-status">
                          <span className="status-badge" style={{ backgroundColor: getPriorityColor(request.priority) }}>
                            {request.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredRequests.length > 0 && (
                <div className="panel-footer">
                  <div className="footer-tip">
                    💡 <strong>Tip:</strong> Drag high-priority requests first for better scheduling
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-header">
            <h2>📊 Sponsorship History</h2>
            <div className="history-stats">
              <div className="stat-card">
                <div className="stat-number">{sponsorshipHistory.filter(h => h.status === 'completed').length}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {sponsorshipHistory
                    .filter(h => h.status === 'completed')
                    .reduce((sum, h) => sum + parseFloat(h.revenue.replace('$', '').replace(',', '')), 0)
                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {sponsorshipHistory
                    .filter(h => h.status === 'completed')
                    .reduce((sum, h) => sum + h.performance.views, 0)
                    .toLocaleString()}
                </div>
                <div className="stat-label">Total Views</div>
              </div>
            </div>
          </div>

          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Brand</th>
                  <th>Client</th>
                  <th>Scheduled</th>
                  <th>Performance</th>
                  <th>Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sponsorshipHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="campaign-info">
                        <div className="campaign-title">{item.title}</div>
                      </div>
                    </td>
                    <td>
                      <div className="brand-name">{item.brand}</div>
                    </td>
                    <td>
                      <div className="client-name">{item.client}</div>
                    </td>
                    <td>
                      <div className="schedule-date">{new Date(item.scheduledDate).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="performance-metrics">
                        <div className="metric">
                          <span className="metric-value">{item.performance.views.toLocaleString()}</span>
                          <span className="metric-label">views</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">{item.performance.clicks.toLocaleString()}</span>
                          <span className="metric-label">clicks</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">{item.performance.ctr}</span>
                          <span className="metric-label">CTR</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="revenue-amount">{item.revenue}</div>
                    </td>
                    <td>
                      <span 
                        className="status-indicator" 
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdSponsorshipTimeline;
