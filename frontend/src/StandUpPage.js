import React, { useState, useRef } from 'react';
import './StandUpPage.css';

const TEAM = [
  { id: 1, name: 'Alex', avatar: '🦸‍♂️', streak: 5 },
  { id: 2, name: 'Sam', avatar: '🦸‍♀️', streak: 7 },
  { id: 3, name: 'Jordan', avatar: '🧙‍♂️', streak: 3 },
  { id: 4, name: 'Taylor', avatar: '🧑‍🚀', streak: 2 }
];
const LEADER = TEAM.reduce((a, b) => (a.streak > b.streak ? a : b));
const COLUMNS = [
  { id: 'planned', label: 'Planned' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' }
];

function getToday() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function StandUpPage() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [dragged, setDragged] = useState(null);
  const [showPane, setShowPane] = useState(false);
  const [blockers, setBlockers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [autoPost, setAutoPost] = useState(false);
  const [timer, setTimer] = useState(900); // 15 min
  const confettiRef = useRef(null);

  React.useEffect(() => {
    const interval = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(interval);
  }, []);

  function handleAddTask(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setTasks([...tasks, {
      id: Date.now(),
      text: input,
      user: TEAM[0], // Assume current user is TEAM[0]
      col: 'planned',
      blocker: false
    }]);
    setInput('');
  }

  function handleDragStart(id) { setDragged(id); }
  function handleDrop(col) {
    if (dragged) {
      setTasks(ts => ts.map(t => t.id === dragged ? { ...t, col } : t));
      if (col === 'done') {
        confettiRef.current && confettiRef.current();
        setActivity(a => [
          { user: TEAM[0].name, text: tasks.find(t => t.id === dragged)?.text, time: new Date().toLocaleTimeString() },
          ...a
        ]);
      }
      setDragged(null);
    }
  }
  function handleBlocker(id) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, blocker: !t.blocker } : t));
    setBlockers(ts => {
      const task = tasks.find(t => t.id === id);
      if (!task) return ts;
      return task.blocker ? ts.filter(b => b.id !== id) : [...ts, task];
    });
  }
  // Confetti burst (simple)
  function confettiBurst() {
    const el = document.createElement('div');
    el.className = 'confetti-burst';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
  confettiRef.current = confettiBurst;

  // Timer display
  const min = String(Math.floor(timer / 60)).padStart(2, '0');
  const sec = String(timer % 60).padStart(2, '0');

  return (
    <div className="standup-root">
      {/* Header */}
      <div className="standup-header">
        <div className="standup-date">{getToday()}</div>
        <div className="standup-timer">Roll-up in {min}:{sec}</div>
        <div className="standup-streaks">
          {TEAM.map(m => (
            <span key={m.id} className={`streak-badge${m.id === LEADER.id ? ' leader' : ''}`}>{m.avatar} {m.streak}{m.id === LEADER.id && <span className="crown">👑</span>}</span>
          ))}
        </div>
      </div>
      {/* Add Task Bar */}
      <form className="standup-addbar" onSubmit={handleAddTask}>
        <input
          type="text"
          placeholder="What will you finish today?"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </form>
      {/* Kanban Grid */}
      <div className="standup-kanban">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className="kanban-col"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="col-title">{col.label}</div>
            {tasks.filter(t => t.col === col.id).map(t => (
              <div
                key={t.id}
                className="kanban-card"
                draggable
                onDragStart={() => handleDragStart(t.id)}
                onDoubleClick={() => handleBlocker(t.id)}
              >
                <div className="card-avatar">{t.user.avatar}</div>
                <div className="card-text">{t.text}</div>
                {col.id === 'done' && <div className="card-reactions">👍 🔥 🙌</div>}
                {t.blocker && <div className="card-blocker">🚧 Blocker</div>}
              </div>
            ))}
          </div>
        ))}
        {/* Collapsible Blockers Pane */}
        <div className={`standup-pane${showPane ? ' open' : ''}`}>
          <button className="pane-toggle" onClick={() => setShowPane(v => !v)}>{showPane ? '→' : '←'}</button>
          {showPane && (
            <div className="pane-content">
              <div className="pane-title">Blockers</div>
              {tasks.filter(t => t.blocker).length === 0 ? <div className="empty">No blockers</div> :
                tasks.filter(t => t.blocker).map(t => (
                  <div key={t.id} className="blocker-item">{t.text}</div>
                ))}
              <div className="pane-title" style={{ marginTop: 24 }}>Filter</div>
              <select>
                <option>All People</option>
                {TEAM.map(m => <option key={m.id}>{m.name}</option>)}
              </select>
              <select>
                <option>All Projects</option>
                <option>Q2 Deck</option>
                <option>Website</option>
              </select>
            </div>
          )}
        </div>
      </div>
      {/* Activity Ticker */}
      <div className="standup-ticker">
        {activity.map((a, i) => (
          <div key={i} className="ticker-item">{a.user} completed: <b>{a.text}</b> <span className="ticker-time">{a.time}</span></div>
        ))}
      </div>
      {/* Footer */}
      <div className="standup-footer">
        <label>
          <input type="checkbox" checked={autoPost} onChange={e => setAutoPost(e.target.checked)} />
          Auto-post summary to Slack/Teams
        </label>
      </div>
    </div>
  );
}

export default StandUpPage;
