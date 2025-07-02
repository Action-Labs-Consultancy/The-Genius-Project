import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import popupStyles from './MeetingSchedulerPopup.module.css';
import modernStyles from './MeetingSchedulerModern.module.css';

// Replace the mocked implementation with a real API call
async function fetchUserMeetings(userId, date) {
  try {
    console.log(`Fetching meetings for user ${userId} on date ${date}`);
    const response = await fetch(`/api/meetings?user_id=${userId}`);
    if (!response.ok) {
      console.error('Error fetching meetings:', response.statusText);
      // Return empty array on error instead of throwing
      return [];
    }
    const meetings = await response.json();
    console.log(`All meetings for user ${userId}:`, meetings);
    
    // Filter meetings for the specific date
    const dateMeetings = meetings
      .filter(m => m.date === date)
      .map(m => ({ start: m.start_time, end: m.end_time, title: m.title, id: m.id }));
    
    console.log(`Meetings for user ${userId} on ${date}:`, dateMeetings);
    return dateMeetings;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    // Return empty array on error
    return [];
  }
}

function isTimeOverlap(start1, end1, start2, end2) {
  function toMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
  return (toMinutes(start1) < toMinutes(end2) && toMinutes(start2) < toMinutes(end1));
}

export default function MeetingScheduler({ currentUser, onSendChatMessage, onMeetingCreated }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [meetingReason, setMeetingReason] = useState('');
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [popup, setPopup] = useState({ open: false, type: '', message: '' });
  const searchRef = useRef();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data.filter(u => u.id !== currentUser?.id));
      } catch (err) {
        setUsers([]);
      }
    }
    fetchUsers();
  }, [currentUser]);

  const handleUserToggle = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Check meeting availability
  const handleCheckAvailability = async () => {
    setChecking(true);
    setError('');
    setPopup({ open: false, type: '', message: '' });
    
    if (!date || !startTime || !endTime || selectedUsers.length === 0) {
      setChecking(false);
      setError('Please fill all fields and select at least one person.');
      return;
    }
    
    try {
      // Check organizer's availability first
      const organizerMeetings = await fetchUserMeetings(currentUser.id, date);
      console.log(`Organizer (${currentUser.name}) meetings on ${date}:`, organizerMeetings);
      
      const organizerHasConflict = organizerMeetings.some(m => {
        const conflict = isTimeOverlap(startTime, endTime, m.start, m.end);
        console.log(`Checking conflict: ${startTime}-${endTime} vs ${m.start}-${m.end} = ${conflict}`);
        return conflict;
      });
      
      console.log(`Organizer has conflict: ${organizerHasConflict}`);
      
      if (organizerHasConflict) {
        setAvailability([]);
        setError('You are not available at this time. Please choose a different time slot.');
        setChecking(false);
        return;
      }
      
      // Check each invitee's meetings for conflicts
      const available = [];
      const unavailable = [];
      
      for (const uid of selectedUsers) {
        const meetings = await fetchUserMeetings(uid, date);
        const user = users.find(u => u.id === uid);
        console.log(`User ${user?.name} (${uid}) meetings on ${date}:`, meetings);
        
        const hasConflict = meetings.some(m => {
          const conflict = isTimeOverlap(startTime, endTime, m.start, m.end);
          console.log(`  Checking conflict: ${startTime}-${endTime} vs ${m.start}-${m.end} = ${conflict}`);
          return conflict;
        });
        
        console.log(`User ${user?.name} has conflict: ${hasConflict}`);
        
        if (!hasConflict) {
          available.push(uid);
        } else {
          unavailable.push(user?.name || 'Unknown');
        }
      }
      
      setAvailability(available);
      
      if (available.length === 0) {
        setError('No invitees are available at this time.');
      } else if (available.length !== selectedUsers.length) {
        const unavailableNames = unavailable.join(', ');
        setError(`Some invitees are not available: ${unavailableNames}. Meeting will only include available participants.`);
      } else {
        setError('All participants are available!');
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError(`Failed to check availability: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  // Add: handleScheduleMeeting
  const handleScheduleMeeting = async () => {
    if (!availability || availability.length === 0) {
      setPopup({ open: true, type: 'error', message: 'No available invitees to schedule a meeting.' });
      return;
    }
    
    // Double-check organizer availability before scheduling
    try {
      const organizerMeetings = await fetchUserMeetings(currentUser.id, date);
      const organizerHasConflict = organizerMeetings.some(m =>
        isTimeOverlap(startTime, endTime, m.start, m.end)
      );
      
      if (organizerHasConflict) {
        setPopup({ open: true, type: 'error', message: 'You are no longer available at this time. Please check availability again.' });
        setAvailability(null);
        return;
      }
    } catch (err) {
      setPopup({ open: true, type: 'error', message: 'Failed to verify your availability. Please try again.' });
      return;
    }
    
    setPopup({ open: true, type: 'info', message: 'Scheduling meeting...' });
    
    try {
      const meetingData = {
        title: 'Meeting',
        reason: meetingReason,
        date,
        start_time: startTime,
        end_time: endTime,
        organizer_id: currentUser.id,
        invitee_ids: availability
      };
      
      console.log('Scheduling meeting with data:', meetingData);
      
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Meeting scheduling error:', data);
        
        // Show a more specific error message based on the status code
        if (res.status === 409) {
          setPopup({ 
            open: true, 
            type: 'error', 
            message: 'Scheduling conflict detected. Meeting could not be saved.' 
          });
        } else {
          setPopup({ 
            open: true, 
            type: 'error', 
            message: data.error || data.details || 'Failed to schedule meeting.' 
          });
        }
        return;
      }
      
      console.log('Meeting scheduled successfully:', data);
      setPopup({ 
        open: true, 
        type: 'success', 
        message: 'Meeting scheduled and saved!' 
      });

      // Trigger meetings refresh in parent component
      if (typeof onMeetingCreated === 'function') {
        onMeetingCreated();
      }
      
      // Optionally send chat messages to available users
      if (typeof onSendChatMessage === 'function') {
        const timeStr = `${date} from ${startTime} to ${endTime}`;
        const msg = `You have been invited to a meeting by ${currentUser.name} on ${timeStr}. Reason: ${meetingReason}`;
        availability.forEach(uid => {
          const user = users.find(u => u.id === uid);
          if (user) {
            onSendChatMessage({ to: user, from: currentUser, message: msg })
              .catch(err => console.error('Failed to send notification message:', err));
          }
        });
      }
      
      // Reset form
      setSelectedUsers([]);
      setDate('');
      setStartTime('');
      setEndTime('');
      setMeetingReason('');
      setAvailability(null);
      setError('');
    } catch (e) {
      console.error('Error scheduling meeting:', e);
      setPopup({ 
        open: true, 
        type: 'error', 
        message: `Network error: ${e.message}. Could not save meeting.` 
      });
    }
  };

  // Show error/info as popup
  useEffect(() => {
    if (error) setPopup({ open: true, type: 'error', message: error });
  }, [error]);
  useEffect(() => {
    if (availability && !checking && availability.length === selectedUsers.length) {
      setPopup({ open: true, type: 'success', message: 'All invitees are available!' });
    }
  }, [availability, checking, selectedUsers.length]);

  return (
    <div
      style={{
        background: '#181818',
        borderRadius: 22,
        boxShadow: '0 8px 32px #0008, 0 2px 12px #FFD60044',
        border: '2.5px solid #FFD60044',
        padding: '2.5rem 2.2rem 2.2rem 2.2rem',
        maxWidth: 720,
        width: '100%',
        minWidth: 440,
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        fontSize: '1.1rem',
        fontWeight: 600,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        animation: 'fadeInPop 0.22s cubic-bezier(.4,1.4,.6,1) both',
      }}
    >
      <h2 style={{ color: '#FFD600', fontWeight: 900, fontSize: '1.7rem', marginBottom: 24, marginTop: 0, letterSpacing: 1 }}>Schedule a Meeting</h2>
      {popup.open && (
        <div style={{
          margin: '0 auto 18px auto',
          position: 'relative',
          boxShadow: '0 2px 12px #FFD60044',
          fontSize: 17,
          borderRadius: 14,
          padding: '12px 18px',
          background: 
            popup.type === 'error' ? '#dc2626' : 
            popup.type === 'success' ? '#FFD600' : 
            popup.type === 'info' ? '#232323' : '#232323',
          color: 
            popup.type === 'error' ? '#fff' : 
            popup.type === 'success' ? '#181818' : 
            popup.type === 'info' ? '#FFD600' : '#FFD600',
          border: 
            popup.type === 'error' ? '2px solid #dc2626' : 
            popup.type === 'success' ? '2px solid #FFD600' : 
            popup.type === 'info' ? '2px solid #FFD60044' : '2px solid #FFD60044',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 48
        }}>
          <span style={{ flex: 1, textAlign: 'left' }}>{popup.message}</span>
          <button 
            className={popupStyles.popupCloseBtn} 
            style={{ 
              position: 'static', 
              marginLeft: 12, 
              top: 'unset', 
              right: 'unset',
              background: popup.type === 'error' ? '#fff' : '#181818',
              color: popup.type === 'error' ? '#dc2626' : '#FFD600'
            }} 
            onClick={() => setPopup({ open: false, type: '', message: '' })}
          >
            Close
          </button>
        </div>
      )}
      {/* --- Scheduler Content --- */}
      <label className={modernStyles.label}>Invite People:</label>
      <div className={modernStyles.dropdown} ref={searchRef}>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by name or email..."
          className={modernStyles.input}
          autoComplete="off"
        />
        {showDropdown && search && (
          <div className={modernStyles.dropdownList}>
            {users.filter(user =>
              !selectedUsers.includes(user.id) &&
              (user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase()))
            ).length === 0 ? (
              <div style={{ color: '#FFD600', padding: 12, textAlign: 'center' }}>No users found</div>
            ) : (
              users.filter(user =>
                !selectedUsers.includes(user.id) &&
                (user.name.toLowerCase().includes(search.toLowerCase()) ||
                  user.email.toLowerCase().includes(search.toLowerCase()))
              ).map(user => (
                <div
                  key={user.id}
                  className={modernStyles.dropdownItem}
                  onClick={() => {
                    setSelectedUsers([...selectedUsers, user.id]);
                    setSearch('');
                    setShowDropdown(false);
                  }}
                  onMouseDown={e => e.preventDefault()}
                >
                  <span>{user.name}</span> <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>({user.email})</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div className={modernStyles.chips}>
        {selectedUsers.map(uid => {
          const user = users.find(u => u.id === uid);
          if (!user) return null;
          return (
            <span key={uid} className={modernStyles.chip}>
              {user.name}
              <button
                onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== uid))}
                className={modernStyles.chipRemove}
                title="Remove"
              >×</button>
            </span>
          );
        })}
      </div>
      <div className={modernStyles.row}>
        <div>
          <label className={modernStyles.label}>Date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={modernStyles.input} />
        </div>
        <div>
          <label className={modernStyles.label}>Start Time:</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={modernStyles.input} />
        </div>
        <div>
          <label className={modernStyles.label}>End Time:</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={modernStyles.input} />
        </div>
      </div>
      <label className={modernStyles.label}>Meeting Reason:</label>
      <input
        type="text"
        value={meetingReason}
        onChange={e => setMeetingReason(e.target.value)}
        placeholder="Why is this meeting?"
        className={modernStyles.input}
      />
      <button
        onClick={handleCheckAvailability}
        disabled={checking || !date || !startTime || !endTime || selectedUsers.length === 0 || !meetingReason}
        className={modernStyles.actionBtn}
      >
        {checking ? 'Checking...' : 'Check Availability'}
      </button>
      {/* Show Schedule Meeting button if availability is checked and at least one is available */}
      {availability && !checking && availability.length > 0 && (
        <button
          className={modernStyles.actionBtn}
          style={{ marginTop: 8 }}
          onClick={handleScheduleMeeting}
        >
          Schedule Meeting
        </button>
      )}
    </div>
  );
}
