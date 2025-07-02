import React, { useState, useRef, useEffect } from 'react';
import './WeeklyStandUpPlanner.css';
import confetti from 'canvas-confetti';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TIMES = Array.from({ length: 18 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '30' : '00';
  return `${String(hour).padStart(2, '0')}:${min}`;
});

function getTodayIdx() {
  const d = new Date();
  return d.getDay(); // Sunday=0, Monday=1, ...
}
function getToday() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function WeeklyStandUpPlanner({ user, users = [] }) {
  const [tasks, setTasks] = useState([]); // {id, name, client, notes, day, startIdx, endIdx}
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ name: '', client: '', notes: '', day: getTodayIdx(), startIdx: 0, endIdx: 0 });
  const [draggingTask, setDraggingTask] = useState(null);
  const [resizingTask, setResizingTask] = useState(null);
  const [done, setDone] = useState([]); // array of task ids
  const [streak, setStreak] = useState(0); // days all tasks completed on time
  const [timeRemaining, setTimeRemaining] = useState('');
  // Countdown to next standup at 9:45 AM daily
  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const target = new Date(now);
      target.setHours(9, 45, 0, 0);
      if (now >= target) target.setDate(target.getDate() + 1);
      const diff = target - now;
      const hrs = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeRemaining(`${hrs}:${mins}:${secs}`);
    }
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, []);
  const confettiRef = useRef(null);
  const gridRef = useRef(null);

  // Load tasks from API
  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/standup-tasks?user_id=${user.id}`);
      if (response.ok) {
        const apiTasks = await response.json();
        // Convert API format to component format
        const convertedTasks = apiTasks.map(task => ({
          id: task.id,
          name: task.task,
          client: task.client || '',
          notes: task.notes || '',
          day: DAYS.indexOf(task.day),
          startIdx: convertTimeToIndex(task.time),
          endIdx: convertTimeToIndex(task.time) + 1, // Default 30-minute duration
          status: task.status,
          blocker: task.blocker,
          streak: task.streak
        }));
        setTasks(convertedTasks);
      }
    } catch (error) {
      console.error('Failed to fetch standup tasks:', error);
    }
  };

  const convertTimeToIndex = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const baseHour = 9; // Start at 9:00 AM
    const hourDiff = hours - baseHour;
    const minuteIndex = minutes === 30 ? 1 : 0;
    return Math.max(0, hourDiff * 2 + minuteIndex);
  };

  const convertIndexToTime = (index) => {
    const hour = 9 + Math.floor(index / 2);
    const minute = index % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
  };

  // Confetti burst using canvas-confetti library
  function confettiBurst(gold) {
    const colors = gold ? ['#FFD700', '#FFC700'] : undefined;
    confetti({
      particleCount: 150,
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      gravity: 0.7,
      origin: { x: 0.5, y: 0.5 },
      colors,
    });
  }
  confettiRef.current = confettiBurst;

  // Modal handlers
  function openModal(day, startIdx) {
    setModalData({ name: '', client: '', notes: '', day, startIdx, endIdx: startIdx });
    setModalOpen(true);
  }
  function handleModalChange(field, value) {
    setModalData(m => ({ ...m, [field]: value }));
  }
  function handleModalSubmit() {
    if (!user?.id) return;
    
    const taskData = {
      user_id: user.id,
      client: modalData.client,
      day: DAYS[modalData.day],
      time: convertIndexToTime(modalData.startIdx),
      task: modalData.name,
      status: 'Not Started',
      notes: modalData.notes,
      blocker: false
    };

    fetch('/api/standup-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    })
    .then(response => response.json())
    .then(newTask => {
      // Add to local state
      const convertedTask = {
        id: newTask.id,
        name: newTask.task,
        client: newTask.client || '',
        notes: newTask.notes || '',
        day: modalData.day,
        startIdx: modalData.startIdx,
        endIdx: modalData.endIdx,
        status: newTask.status,
        blocker: newTask.blocker,
        streak: newTask.streak
      };
      setTasks(ts => [...ts, convertedTask]);
      setModalOpen(false);
    })
    .catch(error => {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    });
  }

  // Themed clear-all confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  function clearAllTasks() {
    setConfirmOpen(true);
  }
  function confirmClear() {
    if (!user?.id) return;

    // Delete all tasks from API
    const deletePromises = tasks.map(task => 
      fetch(`/api/standup-tasks/${task.id}`, { method: 'DELETE' })
    );

    Promise.all(deletePromises)
      .then(() => {
        setTasks([]);
        setDone([]);
        setStreak(0);
        setConfirmOpen(false);
      })
      .catch(error => {
        console.error('Failed to clear tasks:', error);
        alert('Failed to clear some tasks. Please try again.');
      });
  }

  // Drag/resize handlers
  function onTaskDrag(id, newDay, newStartIdx) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updatedTask = {
      ...task,
      day: newDay,
      startIdx: newStartIdx,
      endIdx: newStartIdx + (task.endIdx - task.startIdx)
    };

    // Update API
    fetch(`/api/standup-tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        day: DAYS[newDay],
        time: convertIndexToTime(newStartIdx)
      }),
    })
    .then(response => {
      if (response.ok) {
        setTasks(ts => ts.map(t => t.id === id ? updatedTask : t));
      }
    })
    .catch(error => {
      console.error('Failed to update task:', error);
    });
  }

  function onTaskResize(id, newEndIdx) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, endIdx: newEndIdx } : t));
  }

  // Resizing logic
  useEffect(() => {
    function onMouseMove(e) {
      if (!resizingTask || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const slotHeight = 60; // increased cell height for easier resizing
      let newIdx = Math.floor(offsetY / slotHeight) - 1; // subtract header row
      if (newIdx < 0) newIdx = 0;
      if (newIdx >= TIMES.length) newIdx = TIMES.length - 1;
      setTasks(ts => ts.map(t => t.id === resizingTask ? { ...t, endIdx: newIdx } : t));
    }
    function onMouseUp() {
      if (resizingTask) setResizingTask(null);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [resizingTask]);

  // Countdown to next standup at 9:45 AM daily
  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const target = new Date(now);
      target.setHours(9, 45, 0, 0);
      if (now >= target) target.setDate(target.getDate() + 1);
      const diff = target - now;
      const hrs = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeRemaining(`${hrs}:${mins}:${secs}`);
    }
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Checklist logic
  const todayIdx = getTodayIdx();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  function getTime(idx) {
    const [h, m] = TIMES[idx].split(':');
    return parseInt(h) * 60 + parseInt(m);
  }
  const todaysTasks = tasks.filter(t => t.day === todayIdx).sort((a, b) => a.startIdx - b.startIdx);

  function handleCheck(task) {
    const end = getTime(task.endIdx + 1);
    const start = getTime(task.startIdx);
    const isOnTime = nowMinutes >= start && nowMinutes <= end;
    setDone(d => {
      const newDone = [...d, task.id];
      // check if all today's tasks are done on time
      const todays = tasks.filter(t => t.day === todayIdx);
      const allIds = todays.map(t => t.id);
      const allDone = allIds.every(id => newDone.includes(id));
      if (allDone && isOnTime) {
        setStreak(s => s + 1);
      }
      return newDone;
    });
    // confetti burst
    confettiRef.current(isOnTime);
  }

  // --- Add streak/user header at the top ---
  return (
    <div className="weekly-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'linear-gradient(135deg, #181818 60%, #232323 100%)' }}>
      {/* Next Standup Countdown */}
      <div style={{ textAlign: 'center', padding: '8px 0', background: '#232323', color: '#FFD600', fontWeight: 700 }}>Standup in: {timeRemaining}</div>
     {/* Calendar and Today checklist row */}
     <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflowX: 'hidden' }}>
       {/* rely on global HeaderBar for date and streak and calendar */}
       <div style={{ flex: 1, padding: '32px', minWidth: 0, overflow: 'auto' }}>
        <div className="calendar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button className="fab" onClick={() => openModal(todayIdx, 0)} title="Add Task">＋</button>
          </div>
        </div>
        <div className="calendar-grid" ref={gridRef} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`, gap: 0 }}>
          <div></div>
          {DAYS.map(day => <div key={day} className="calendar-day-label">{day}</div>)}
          {TIMES.map((time, tIdx) => [
            <div key={time} className="calendar-time-label">{time}</div>,
            ...DAYS.map((day, dIdx) => {
              // Find task(s) for this cell
              const cellTasks = tasks.filter(t => t.day === dIdx && t.startIdx <= tIdx && t.endIdx >= tIdx);
              return (
                <div key={day + time} className="calendar-cell" style={{ minHeight: 48, position: 'relative' }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    if (draggingTask != null) {
                      onTaskDrag(draggingTask, dIdx, tIdx);
                      setDraggingTask(null);
                    }
                  }}
                >
                  {cellTasks.map(task => {
                    const isResizing = resizingTask === task.id;
                    const isDragging = draggingTask === task.id;
                    const blockHeight = (task.endIdx - task.startIdx + 1) * 48 - 4;
                    return (
                      <div
                        key={task.id}
                        className="calendar-task-block"
                        style={{
                          position: 'absolute',
                          top: (task.startIdx - tIdx) * 48,
                          left: 0,
                          width: '100%',
                          height: blockHeight,
                          background: '#FFD600',
                          color: '#181818',
                          borderRadius: 8,
                          marginBottom: 4,
                          zIndex: 2,
                          boxShadow: '0 2px 8px #FFD60033',
                          cursor: isDragging ? 'grabbing' : 'pointer',
                          opacity: done.includes(task.id) ? 0.5 : 1,
                          transition: 'box-shadow 0.2s, opacity 0.2s',
                          display: tIdx === task.startIdx ? 'block' : 'none',
                        }}
                        draggable
                        onDragStart={() => setDraggingTask(task.id)}
                        onDragEnd={() => setDraggingTask(null)}
                        onDoubleClick={() => onTaskResize(task.id, Math.min(task.endIdx + 1, TIMES.length - 1))}
                      >
                        <div style={{ fontWeight: 700 }}>{task.name}</div>
                        <div style={{ fontSize: '0.95em', color: '#333' }}>{task.client}</div>
                        <div style={{ fontSize: '0.92em', color: '#555' }}>{task.notes}</div>
                        {/* Resize handle */}
                        <div
                          className="resize-handle"
                          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, cursor: 'ns-resize', background: '#FFD60044', borderRadius: '0 0 8px 8px' }}
                          onMouseDown={e => {
                            e.stopPropagation();
                            setResizingTask(task.id);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })
          ])}
        </div>  {/* end of calendar-grid */}
        {/* Clear All tasks button below grid */}
        <div style={{ textAlign: 'center', marginTop: 16 }}> 
          <button onClick={clearAllTasks} style={{ background: 'transparent', border: '1px solid #FFD600', color: '#FFD600', padding: '8px 12px', borderRadius: 6 }}>
            Clear All Tasks
          </button>
        </div>
      </div>
       {/* Today checklist on right */}
       <div className="today-checklist premium-checklist" style={{ width: 340, background: '#232323', borderRadius: 16, boxShadow: '0 2px 16px #FFD60011', padding: 22, margin: '0 32px 32px 32px', alignSelf: 'flex-start', position: 'sticky', top: 160 }}>
        {/* streak display box */}
        <div style={{ background: '#333', padding: '8px 12px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', marginBottom: 16 }}>
          <span role="img" aria-label="fire" style={{ fontSize: '1.2em', marginRight: 6 }}>🔥</span>
          <span style={{ color: '#FFD600', fontSize: '1.1em', fontWeight: 700 }}>
            Streak: {streak} {streak !== 1 ? 'days' : 'day'}
          </span>
        </div>
        <div className="premium-checklist-title">Today's Tasks</div>
        {todaysTasks.length === 0 && <div style={{ color: '#FFD60099', fontWeight: 500 }}>No tasks for today.</div>}
        {todaysTasks.map(task => {
          const end = getTime(task.endIdx + 1);
          const start = getTime(task.startIdx);
          const isOnTime = nowMinutes >= start && nowMinutes <= end;
          return (
            <div className="checklist-row premium-checklist-row" key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12, background: '#181818', borderRadius: 10, padding: '10px 16px', boxShadow: '0 2px 8px #FFD60022' }}>
              <div className="checklist-time premium-checklist-time">{TIMES[task.startIdx]}–{TIMES[task.endIdx]}</div>
              <div className="checklist-task premium-checklist-task" style={{ textDecoration: done.includes(task.id) ? 'line-through' : 'none', color: done.includes(task.id) ? (isOnTime ? 'gold' : '#4ade80') : '#FFD600', fontWeight: 700, fontSize: '1.13em', flex: 1 }}>{task.name}</div>
              <input type="checkbox" checked={done.includes(task.id)} disabled={done.includes(task.id)} onChange={() => handleCheck(task)} style={{ width: 24, height: 24, accentColor: isOnTime ? 'gold' : '#4ade80' }} />
            </div>
          );
        })}
      </div>
     </div>  {/* end of calendar and checklist row */}
      {/* Modal for new task */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Task</h2>
            <label>
              Task Name
              <input value={modalData.name} onChange={e => handleModalChange('name', e.target.value)} />
            </label>
            <label>
              Client
              <input value={modalData.client} onChange={e => handleModalChange('client', e.target.value)} />
            </label>
            <label>
              Notes
              <textarea
                rows={4}
                value={modalData.notes}
                onChange={e => handleModalChange('notes', e.target.value)}
              />
            </label>
            <div className="modal-buttons">
              <button onClick={handleModalSubmit}>Add</button>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
     {/* Confirmation Modal for clearing all tasks */}
      {confirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete all tasks? This cannot be undone.</p>
            <div className="modal-buttons">
              <button onClick={confirmClear}>Yes, Delete All</button>
              <button onClick={() => setConfirmOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklyStandUpPlanner;
