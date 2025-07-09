import React, { useEffect, useState } from 'react';
import modernStyles from './MeetingSchedulerModern.module.css';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm
const TIME_LABELS = HOURS.map(h => (h < 10 ? `0${h}:00` : `${h}:00`));

function getWeekDates(startDate) {
  const result = [];
  const date = new Date(startDate);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() + i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export default function MeetingsCalendar({ currentUser }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return today.toISOString().slice(0, 10);
  });
  const weekDates = getWeekDates(weekStart);

  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null); // Clear any previous errors
    
    fetch(`/api/meetings?user_id=${currentUser.id}`)
      .then(res => {
        if (!res.ok) {
          console.error('Error response:', res.status, res.statusText);
          return res.json().then(errData => {
            throw new Error(`Server responded with status: ${res.status}. ${errData.error || errData.details || ''}`);
          }).catch(e => {
            throw new Error(`Server responded with status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('Meetings loaded:', data);
        setMeetings(data || []);
        setError(null);
      })
      .catch(err => {
        console.error('Error fetching meetings:', err);
        setError(`Failed to load meetings: ${err.message}`);
        setMeetings([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser]);

  function handlePrevWeek() {
    const d = new Date(weekDates[0]);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().slice(0, 10));
  }
  
  function handleNextWeek() {
    const d = new Date(weekDates[0]);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().slice(0, 10));
  }

  // Helper to get meetings for a day and hour
  function getMeetingsForSlot(date, hour) {
    try {
      return meetings.filter(m => 
        m.date === date && 
        parseInt(m.start_time.split(':')[0], 10) === hour
      );
    } catch (err) {
      console.error('Error getting meetings for slot:', err);
      return [];
    }
  }
  
  // Calculate meeting height based on duration
  function getMeetingHeight(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Calculate duration in minutes
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    // Base height per hour is 48px
    return Math.max(30, Math.min(140, (durationMinutes / 60) * 48));
  }
  
  // Calculate meeting position within a time slot
  function getMeetingPosition(startTime) {
    const [_, startMin] = startTime.split(':').map(Number);
    // Convert minutes to position percentage within the hour slot
    return (startMin / 60) * 100;
  }

  return (
    <div className={modernStyles.schedulerWrapper} style={{ minHeight: '100vh', background: '#111', padding: 0 }}>
      {/* Countdown timer removed; appears on Weekly Stand-Up page only */}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto 18px auto', width: '100%' }}>
        <button onClick={handlePrevWeek} className={modernStyles.actionBtn} style={{ width: 120 }}>Previous</button>
        <h2 className={modernStyles.schedulerTitle + ' ' + modernStyles.calendarTitle} style={{ margin: 0, textAlign: 'center', flex: 1 }}>Weekly Calendar</h2>
        <button onClick={handleNextWeek} className={modernStyles.actionBtn} style={{ width: 120 }}>Next</button>
      </div>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#FFD600' }}>
          Loading meetings...
        </div>
      )}
      
      {!loading && !error && meetings.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '30px', 
          color: '#FFD600', 
          background: '#232323', 
          borderRadius: 8, 
          margin: '0 auto 20px auto', 
          maxWidth: 600 
        }}>
          No meetings scheduled. Use the + button to schedule a new meeting.
        </div>
      )}
      
      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '15px 20px', 
          color: '#fff', 
          background: '#dc2626', 
          borderRadius: 8, 
          margin: '0 auto 20px auto', 
          maxWidth: 1200,
          width: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              marginLeft: 10
            }}
          >×</button>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', maxWidth: 1200, width: '100%', margin: '0 auto', background: '#181818', borderRadius: 18, boxShadow: '0 4px 32px #0005', overflow: 'hidden' }}>
        {/* Header row: days */}
        <div style={{ background: '#232323', color: '#FFD600', fontWeight: 700, padding: '12px 4px', borderRight: '2px solid #FFD60022', borderBottom: '2px solid #FFD60022' }}>Time</div>
        {weekDates.map(date => (
          <div key={date} style={{ background: '#232323', color: '#FFD600', fontWeight: 700, textAlign: 'center', padding: '12px 4px', borderBottom: '2px solid #FFD60022' }}>
            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        ))}
        
        {/* Time slots */}
        {TIME_LABELS.map((label, i) => [
          <div key={label} style={{ background: '#232323', color: '#FFD600', fontWeight: 600, textAlign: 'right', padding: '8px 6px', borderRight: '2px solid #FFD60022', borderBottom: '1px solid #FFD60022', fontSize: 15 }}>{label}</div>,
          ...weekDates.map(date => (
            <div key={date + label} style={{ 
              height: 60, 
              borderBottom: '1px solid #FFD60022', 
              position: 'relative', 
              background: '#181818', 
              padding: 2 
            }}>
              {getMeetingsForSlot(date, HOURS[i]).map(m => {
                const height = getMeetingHeight(m.start_time, m.end_time);
                const topPosition = getMeetingPosition(m.start_time);
                const isOrganizer = currentUser && m.organizer_id === currentUser.id;
                
                return (
                  <div 
                    key={m.id} 
                    style={{
                      background: isOrganizer ? '#FFD600' : '#EBC649',
                      color: '#181818',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontWeight: 700,
                      fontSize: 14,
                      boxShadow: '0 2px 8px #FFD60055',
                      position: 'absolute',
                      left: 2,
                      right: 2,
                      top: `${topPosition}%`,
                      height: `${height}px`,
                      zIndex: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    title={`${m.title || 'Meeting'}\n${m.start_time} - ${m.end_time}\n${m.reason || ''}\nOrganizer: ${m.organizer_name || 'Unknown'}\nInvitees: ${m.invitees?.map(u => u.name).join(', ') || 'None'}`}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.title || 'Meeting'}
                    </div>
                    <div style={{ fontWeight: 400, fontSize: 11, whiteSpace: 'nowrap' }}>
                      {m.start_time} - {m.end_time}
                    </div>
                    {height > 40 && m.reason && (
                      <div style={{ fontWeight: 400, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.reason}
                      </div>
                    )}
                    {height > 60 && (
                      <div style={{ fontWeight: 400, fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                        {isOrganizer ? 'You organized' : `By: ${m.organizer_name || 'Unknown'}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        ])}
      </div>
    </div>
  );
}