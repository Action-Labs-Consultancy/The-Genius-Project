import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://localhost:5001';
const EMOJIS = ['😀','😂','😍','😎','👍','🎉','🔥','🙏','😅','😢','😡','🤔','🙌','🥳','💡','🚀','❤️','👏','😇','😬'];

function getAvatarColor(name) {
  const colors = ['#F8C400', '#3F47AA', '#8e44ad', '#e67e22', '#16a085', '#e74c3c'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ChatPage({ user }) {
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [parentCache, setParentCache] = useState({}); // {msgId: msg}
  const [popup, setPopup] = useState(null); // {channel, count}
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Track which channel is currently viewed for divider logic
  const [viewedChannelId, setViewedChannelId] = useState(null);

  // Remove hiddenDMs logic and always show all DMs
  // --- Clear DM logic ---
  const handleClearDM = () => {
    setMessages([]);
    setShowSettings(false);
  };

  // Fetch channels
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/channels?user_id=${user.id}`)
      .then(res => res.json())
      .then(setChannels);
  }, [user?.id]);

  // Fetch all users for DMs
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setAllUsers);
  }, []);

  // Connect socket
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    // Global listener for channel refresh (when meeting invitations are sent)
    socketRef.current.on('refresh_channels', (data) => {
      console.log('� Refresh channels event:', data);
      
      // If this refresh is for the current user
      if (data.user_id === user.id) {
        // Show a notification
        alert(`📅 ${data.message}`);
        
        // Refresh channels list to show updated last message
        fetch(`/api/channels?user_id=${user.id}`)
          .then(res => res.json())
          .then(setChannels);
      }
    });
    
    return () => { 
      socketRef.current.off('refresh_channels');
      socketRef.current.disconnect(); 
    };
  }, [user.id]);

  // Join channel
  useEffect(() => {
    if (!currentChannel || !socketRef.current) return;
    socketRef.current.emit('join', { channel_id: currentChannel.id });
    fetch(`/api/channels/${currentChannel.id}/messages`)
      .then(res => res.json())
      .then(setMessages);
    fetch(`/api/channels/${currentChannel.id}/members`)
      .then(res => res.json())
      .then(setMembers);
    socketRef.current.on('receive_message', msg => {
      if (msg.channel_id === currentChannel.id) {
        setMessages(m => [...m, msg]);
      }
    });
    socketRef.current.on('typing', ({ user_id, name }) => {
      if (user_id !== user.id) setTypingUsers(u => [...new Set([...u, name])]);
      setTimeout(() => setTypingUsers(u => u.filter(n => n !== name)), 2000);
    });
    return () => {
      socketRef.current.emit('leave', { channel_id: currentChannel.id });
      socketRef.current.off('receive_message');
      socketRef.current.off('typing');
    };
  }, [currentChannel, user.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sort DMs and channels by most recent message
  const getLastMessageTime = (chan) => {
    if (!chan.last_message) return 0;
    return new Date(chan.last_message).getTime();
  };
  const sortedChannels = [...channels.filter(c => !c.is_dm)].sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));
  const sortedDMs = [...channels.filter(c => c.is_dm)].sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));

  // Helper to get user name by id
  const getUserName = id => {
    const u = allUsers.find(u => u.id === id);
    return u ? u.name : '?';
  };

  // Unique users for DMs (by email), strictly exclude self by email
  const uniqueUsers = Object.values(
    allUsers
      .filter(u => u.email && u.email !== user.email)
      .reduce((acc, u) => {
        if (!acc[u.email]) acc[u.email] = u;
        return acc;
      }, {})
  );
  // Debug: log uniqueUsers and allUsers
  console.log('allUsers:', allUsers);
  console.log('uniqueUsers:', uniqueUsers);

  // Helper: get last message time for a DM
  function getLastDmTime(u) {
    const dm = channels.find(c => c.is_dm && c.name === [user.id, u.id].sort().join('-'));
    if (!dm || !dm.last_message) return 0;
    return new Date(dm.last_message).getTime();
  }
  // Sort uniqueUsers by last DM time (descending)
  const sortedDmUsers = [...uniqueUsers].sort((a, b) => getLastDmTime(b) - getLastDmTime(a));

  // Click user to open/create DM
  const handleUserClick = async (otherUserId) => {
    let dm = channels.find(c => c.is_dm && c.name === [user.id, otherUserId].sort().join('-'));
    if (!dm) {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: [user.id, otherUserId].sort().join('-'), is_dm: true, member_ids: [user.id, otherUserId], created_by: user.id })
      });
      dm = await res.json();
      setChannels(c => [...c, dm]);
    }
    setCurrentChannel(dm);
  };

  const handleSend = e => {
    e.preventDefault();
    if (!input.trim() || !currentChannel) return;
    socketRef.current.emit('send_message', {
      channel_id: currentChannel.id,
      user_id: user.id,
      content: input,
      name: user.name
    });
    setInput('');
  };

  const handleInput = e => {
    setInput(e.target.value);
    if (currentChannel && e.target.value)
      socketRef.current.emit('typing', { channel_id: currentChannel.id, user_id: user.id, name: user.name });
  };

  // Channel creation with multi-select
  const handleCreateChannel = async e => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const memberIds = [user.id, ...selectedMembers.map(Number)];
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChannelName, is_dm: false, member_ids: memberIds, created_by: user.id })
    });
    await res.json(); // ignore returned data, always re-fetch
    // Re-fetch channels so the new one appears with correct members
    fetch(`/api/channels?user_id=${user.id}`)
      .then(res => res.json())
      .then(chs => {
        setChannels(chs);
        // Find the new channel by name and select it
        const found = chs.find(c => c.name === newChannelName && !c.is_dm);
        if (found) setCurrentChannel(found);
      });
    setShowCreateModal(false);
    setNewChannelName('');
    setSelectedMembers([]);
  };

  const handleEmojiClick = emoji => {
    setInput(input + emoji);
    setShowEmoji(false);
  };

  // Only show channels where the user is a member (robust to missing members or type mismatches)
  const userChannelIds = new Set(
    channels
      .filter(c => Array.isArray(c.members) && c.members.some(m => Number(m.user_id) === Number(user.id)))
      .map(c => c.id)
  );
  const filteredChannels = channels.filter(c => !c.is_dm && (userChannelIds.has(c.id) || !Array.isArray(c.members)));

  // --- Channel Settings Modal logic ---
  const isAdmin = currentChannel && currentChannel.created_by === user.id;
  const canLeave = currentChannel && (!isAdmin || (members.length > 1));
  const handleRename = async () => {
    setSettingsError('');
    const res = await fetch(`/api/channels/${currentChannel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, name: renameValue })
    });
    if (res.ok) {
      const data = await res.json();
      setChannels(chs => chs.map(c => c.id === currentChannel.id ? { ...c, name: data.name } : c));
      setShowSettings(false);
    } else {
      setSettingsError('Rename failed');
    }
  };
  const handleDelete = async () => {
    setSettingsError('');
    const res = await fetch(`/api/channels/${currentChannel.id}?user_id=${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      setChannels(chs => chs.filter(c => c.id !== currentChannel.id));
      setCurrentChannel(null);
      setShowSettings(false);
    } else {
      setSettingsError('Delete failed');
    }
  };
  const handleKick = async (memberId) => {
    setSettingsError('');
    const res = await fetch(`/api/channels/${currentChannel.id}/members/${memberId}?user_id=${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers(m => m.filter(mem => mem.user_id !== memberId));
    } else {
      setSettingsError('Kick failed');
    }
  };
  const handleAssignAdmin = async (newAdminId) => {
    setSettingsError('');
    const res = await fetch(`/api/channels/${currentChannel.id}/admin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, new_admin_id: newAdminId })
    });
    if (res.ok) {
      setChannels(chs => chs.map(c => c.id === currentChannel.id ? { ...c, created_by: newAdminId } : c));
    } else {
      setSettingsError('Assign admin failed');
    }
  };
  const handleLeave = async () => {
    setSettingsError('');
    const res = await fetch(`/api/channels/${currentChannel.id}/members/${user.id}?user_id=${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      setChannels(chs => chs.filter(c => c.id !== currentChannel.id));
      setCurrentChannel(null);
      setShowSettings(false);
    } else {
      setSettingsError('Leave failed');
    }
  };

  // --- Reply logic ---
  const handleReply = (msg) => setReplyTo(msg);
  const cancelReply = () => setReplyTo(null);

  // --- Unread logic ---
  // Mark channel as read and clear unread count on open
  useEffect(() => {
    if (!currentChannel || !messages.length) return;
    // Mark as read in backend
    const lastMsg = messages[messages.length - 1];
    fetch(`/api/channels/${currentChannel.id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, message_id: lastMsg.id })
    });
    // Set unread_count to 0 in state immediately
    setChannels(chs => chs.map(c => c.id === currentChannel.id ? { ...c, unread_count: 0 } : c));
    // Hide unread separator after opening
    setViewedChannelId(currentChannel.id);
  }, [currentChannel, messages.length]);

  // Place all hooks and helpers before the return statement
  const fetchParentMessage = async (parentId) => {
    if (parentCache[parentId]) return parentCache[parentId];
    try {
      const res = await fetch(`/api/messages/${parentId}`);
      if (res.ok) {
        const data = await res.json();
        setParentCache(pc => ({ ...pc, [parentId]: data }));
        return data;
      }
    } catch (e) {
      console.error('[DEBUG] Failed to fetch parent message', parentId, e);
    }
    return null;
  };
  const getFirstUnreadIndex = () => {
    if (!currentChannel || !currentChannel.unread_count || !messages.length) return -1;
    if (!currentChannel.last_message_id) return -1;
    // Find the index of the first unread message by comparing IDs
    const firstUnreadIdx = messages.findIndex(m => m.id > (currentChannel.last_message_id - currentChannel.unread_count));
    return firstUnreadIdx;
  };

  // When switching channels, update viewedChannelId
  useEffect(() => {
    setViewedChannelId(currentChannel ? currentChannel.id : null);
  }, [currentChannel]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#18191c' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#232428', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, fontWeight: 700, fontSize: 22, borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Chat
          <button onClick={() => setShowCreateModal(true)} style={{ background: '#F8C400', color: '#222', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, padding: '2px 12px', cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ padding: '12px 16px 0 16px' }}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', fontSize: 15, marginBottom: 8 }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ margin: '8px 0 8px 16px', fontSize: 13, color: '#bbb' }}>Direct Messages</div>
          {sortedDmUsers.filter(u => {
            // Always show all DMs, no hiddenDMs logic
            return !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
          }).map(u => {
            let dm = channels.find(c => c.is_dm && c.name === [user.id, u.id].sort().join('-'));
            return (
              <div key={u.id} style={{ position: 'relative', padding: '8px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', background: currentChannel?.is_dm && currentChannel.name === [user.id, u.id].sort().join('-') ? '#2d2e32' : 'none', borderLeft: currentChannel?.is_dm && currentChannel.name === [user.id, u.id].sort().join('-') ? '4px solid #F8C400' : '4px solid transparent' }} onClick={() => handleUserClick(u.id)}>
                <span style={{ background: getAvatarColor(u.name), color: '#222', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, marginRight: 8 }}>{u.name[0]?.toUpperCase() || '?'}</span>
                <span style={{ fontWeight: 700 }}>{u.name}</span>
                {dm && dm.unread_count > 0 && <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, marginLeft: 8 }}>{dm.unread_count}</span>}
              </div>
            );
          })}
          <div style={{ margin: '16px 0 8px 16px', fontSize: 13, color: '#bbb' }}>Channels</div>
          {filteredChannels.map(c => (
            <div key={c.id} className={currentChannel?.id === c.id ? 'active' : ''}
              style={{ position: 'relative', padding: '8px 20px', cursor: 'pointer', background: currentChannel?.id === c.id ? '#2d2e32' : 'none', borderLeft: currentChannel?.id === c.id ? '4px solid #F8C400' : '4px solid transparent' }}
              onClick={() => setCurrentChannel(c)}>
              # {c.name}
              {c.unread_count > 0 && <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, marginLeft: 8 }}>{c.unread_count}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #222', fontSize: 13, color: '#bbb' }}>Logged in as <b>{user.name}</b></div>
      </aside>
      {/* Main chat area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#18191c' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #222', color: '#fff', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {currentChannel ? (currentChannel.is_dm ? getUserName(Number(currentChannel.name.split('-').find(id => id !== String(user.id)))) : `#${currentChannel.name}`) : 'Select a channel'}
          {currentChannel && (
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 22, marginLeft: 12, cursor: 'pointer' }} title="Chat Settings">⚙️</button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#18191c' }}>
          {messages.map((msg, i) => {
            // Find parent message if this is a reply
            let parentMsg = null;
            if (msg.parent_message_id) {
              parentMsg = messages.find(m => m.id === msg.parent_message_id) || parentCache[msg.parent_message_id];
              if (!parentMsg) {
                fetchParentMessage(msg.parent_message_id);
                console.log('[DEBUG] Fetching parent message', msg.parent_message_id);
              }
            }
            // Insert unread divider BEFORE the first unread message, but only if viewing this chat
            const firstUnread = currentChannel && currentChannel.unread_count && viewedChannelId === currentChannel.id
              ? getFirstUnreadIndex()
              : -1;
            const showDivider = i === firstUnread && firstUnread !== -1;
            return (
              <React.Fragment key={msg.id || i}>
                {showDivider && (
                  <div style={{ textAlign: 'center', margin: '16px 0', borderTop: '2px solid #F8C400', color: '#F8C400', fontWeight: 700 }}>
                    Unread Messages
                  </div>
                )}
                <div style={{ margin: '8px 0', textAlign: msg.user_id === user.id ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                  <span style={{ background: getAvatarColor(getUserName(msg.user_id)), color: '#222', borderRadius: '50%', width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                    {getUserName(msg.user_id)[0]?.toUpperCase() || '?'}
                  </span>
                  <div style={{ display: 'inline-block', background: msg.user_id === user.id ? '#F8C400' : '#232428', color: msg.user_id === user.id ? '#222' : '#fff', borderRadius: 12, padding: '8px 14px', maxWidth: 480, wordBreak: 'break-word', position: 'relative' }}>
                    {/* Show quoted parent if this is a reply */}
                    {msg.parent_message_id && (
                      parentMsg ? (
                        <div style={{ borderLeft: '3px solid #F8C400', background: '#222', color: '#bbb', padding: '6px 10px', marginBottom: 6, borderRadius: 6, fontSize: 13 }}>
                          <span style={{ fontWeight: 700 }}>{getUserName(parentMsg.user_id)}</span>: {parentMsg.content.slice(0, 60)}
                        </div>
                      ) : (
                        <div style={{ borderLeft: '3px solid #F8C400', background: '#222', color: '#bbb', padding: '6px 10px', marginBottom: 6, borderRadius: 6, fontSize: 13, fontStyle: 'italic' }}>
                          Loading parent message...
                        </div>
                      )
                    )}
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{getUserName(msg.user_id)}</div>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{new Date(msg.created_at).toLocaleTimeString()}</div>
                  {/* Reply button */}
                  <button onClick={() => handleReply(msg)} style={{ background: 'none', border: 'none', color: '#3F47AA', fontSize: 14, marginLeft: 6, cursor: 'pointer' }}>Reply</button>
                </div>
              </React.Fragment>
            );
          })}
          {typingUsers.length > 0 && (
            <div style={{ color: '#bbb', fontStyle: 'italic', margin: '8px 0' }}>{typingUsers.join(', ')} typing…</div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {currentChannel && (
          <form onSubmit={e => { e.preventDefault(); if (!input.trim()) return; socketRef.current.emit('send_message', { channel_id: currentChannel.id, user_id: user.id, content: input, name: user.name, parent_message_id: replyTo?.id || null }); setInput(''); setReplyTo(null); }} style={{ display: 'flex', padding: 16, borderTop: '1px solid #222', background: '#232428', position: 'relative' }}>
            {/* Show quoted message if replying */}
            {replyTo && (
              <div style={{ position: 'absolute', top: -36, left: 0, right: 0, background: '#333', color: '#fff', borderRadius: 8, padding: 8, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Replying to: {getUserName(replyTo.user_id)}: {replyTo.content.slice(0, 40)}...</span>
                <button type="button" onClick={cancelReply} style={{ background: 'none', border: 'none', color: '#F8C400', fontWeight: 700, fontSize: 16, marginLeft: 12, cursor: 'pointer' }}>✕</button>
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={handleInput}
              placeholder="Message..."
              style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 16, outline: 'none', padding: 8 }}
              autoFocus
            />
            <button type="button" onClick={() => setShowEmoji(e => !e)} style={{ background: 'none', border: 'none', color: '#F8C400', fontSize: 22, marginLeft: 8, cursor: 'pointer' }} title="Add emoji">😊</button>
            <button type="submit" style={{ background: '#F8C400', color: '#222', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, marginLeft: 8, padding: '8px 24px', cursor: 'pointer' }}>Send</button>
            {showEmoji && (
              <div style={{ position: 'absolute', bottom: 56, right: 0, background: '#232428', borderRadius: 8, boxShadow: '0 2px 8px #0006', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8, zIndex: 1000 }}>
                {EMOJIS.map(e => (
                  <span key={e} style={{ fontSize: 24, cursor: 'pointer' }} onClick={() => handleEmojiClick(e)}>{e}</span>
                ))}
              </div>
            )}
          </form>
        )}
        {/* Channel Settings Modal */}
        {showSettings && currentChannel && !currentChannel.is_dm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#232428', color: '#fff', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 4px 32px #0008' }}>
              <h2 style={{ marginBottom: 16 }}>Channel Settings</h2>
              {settingsError && <div style={{ color: '#FE3E3D', marginBottom: 8 }}>{settingsError}</div>}
              {isAdmin && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label>Rename Channel:</label>
                    <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', marginBottom: 8, fontSize: 15 }} />
                    <button onClick={handleRename} className="btn btn-primary" style={{ marginRight: 8 }}>Rename</button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <button onClick={handleDelete} className="btn btn-secondary" style={{ background: '#e74c3c', color: '#fff' }}>Delete Channel</button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div>Members:</div>
                    {members.map(m => (
                      <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span>{getUserName(m.user_id)}</span>
                        {m.user_id !== user.id && <button onClick={() => handleKick(m.user_id)} className="btn btn-light" style={{ fontSize: 13 }}>Kick</button>}
                        {m.user_id !== user.id && <button onClick={() => handleAssignAdmin(m.user_id)} className="btn btn-light" style={{ fontSize: 13 }}>Make Admin</button>}
                        {m.user_id === user.id && <span style={{ color: '#bbb', fontSize: 12 }}>(You)</span>}
                        {m.user_id === currentChannel.created_by && <span style={{ color: '#F8C400', fontSize: 12 }}>(Admin)</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {/* Leave channel for everyone */}
              {canLeave && <button onClick={handleLeave} className="btn btn-secondary" style={{ background: '#3F47AA', color: '#fff' }}>Leave Channel</button>}
              <button onClick={() => setShowSettings(false)} className="btn btn-light" style={{ marginLeft: 8 }}>Close</button>
            </div>
          </div>
        )}
        {/* Chat Settings Modal (DM specific) */}
        {showSettings && currentChannel && currentChannel.is_dm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#232428', color: '#fff', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 4px 32px #0008' }}>
              <h2 style={{ marginBottom: 16 }}>Chat Settings</h2>
              <button onClick={handleClearDM} className="btn btn-secondary" style={{ background: '#e74c3c', color: '#fff', marginBottom: 16 }}>Clear this chat (just for me)</button>
              <button onClick={() => setShowSettings(false)} className="btn btn-light">Close</button>
            </div>
          </div>
        )}
        {/* Channel Creation Modal */}
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
            <div style={{ background: '#232428', color: '#fff', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 4px 32px #0008', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ marginBottom: 8 }}>Create Channel</h2>
              <form onSubmit={handleCreateChannel}>
                <input type="text" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="Channel name" style={{ padding: 8, borderRadius: 6, border: 'none', fontSize: 15, marginBottom: 8, width: '100%' }} />
                <div>
                  <div style={{ marginBottom: 6 }}>Add Members:</div>
                  <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search users..." style={{ padding: 6, borderRadius: 6, border: 'none', fontSize: 14, marginBottom: 6, width: '100%' }} />
                  <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8 }}>
                    {allUsers.filter(u => u.id !== user.id && (!memberSearch || u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase()))).map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <input type="checkbox" checked={selectedMembers.includes(u.id)} onChange={e => {
                          if (e.target.checked) setSelectedMembers(m => [...m, u.id]);
                          else setSelectedMembers(m => m.filter(id => id !== u.id));
                        }} />
                        <span>{u.name} <span style={{ color: '#bbb', fontSize: 12 }}>({u.email})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary" style={{ background: '#F8C400', color: '#222', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 8, padding: '8px 24px' }}>Create</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ background: '#eee', color: '#222', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 8, padding: '8px 18px' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      {/* Popup notification for new messages */}
      {popup && popup.channel && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#232428', color: '#fff', borderRadius: 12, boxShadow: '0 4px 16px #0008', padding: '18px 32px', zIndex: 10001, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>New message in {popup.channel.is_dm ? 'DM' : '#'}{popup.channel.name}</span>
          <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 15, fontWeight: 700 }}>{popup.count}</span>
        </div>
      )}
    </div>
  );
}
