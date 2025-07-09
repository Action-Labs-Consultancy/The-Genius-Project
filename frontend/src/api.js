// API functions to interact with Revive Adserver
import { API_BASE_URL } from './config/api';

// Fetch Revive stats
export async function fetchReviveStats() {
  const res = await fetch(`${API_BASE_URL}/api/revive/stats`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch Revive stats');
  return await res.json();
}

// Create a Revive campaign
export async function createReviveCampaign({ name, clientid, start_date, end_date }) {
  const res = await fetch(`${API_BASE_URL}/api/revive/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, clientid, start_date, end_date }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create campaign');
  return await res.json();
}

// Create a Revive banner
export async function createReviveBanner({ campaignid, image_url, width, height, alt_text }) {
  const res = await fetch(`${API_BASE_URL}/api/revive/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignid, image_url, width, height, alt_text }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create banner');
  return await res.json();
}