// Utility to send a message to a DM channel between two users
// Usage: sendAutomatedDM({ fromUser, toUser, message })
export async function sendAutomatedDM({ fromUser, toUser, message }) {
  // 1. Find or create the DM channel
  const channelName = [fromUser.id, toUser.id].sort().join('-');
  let channel = null;
  try {
    // Try to find existing DM channel
    const res = await fetch(`/api/channels?user_id=${fromUser.id}`);
    if (res.ok) {
      const channels = await res.json();
      channel = channels.find(c => c.is_dm && c.name === channelName);
    }
    // If not found, create it
    if (!channel) {
      const createRes = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName, is_dm: true, member_ids: [fromUser.id, toUser.id], created_by: fromUser.id })
      });
      if (createRes.ok) channel = await createRes.json();
    }
    // 2. Send the message to the DM channel
    if (channel) {
      await fetch(`/api/channels/${channel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: fromUser.id, content: message, name: fromUser.name })
      });
      return true;
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error('Failed to send automated DM:', e);
  }
  return false;
}
