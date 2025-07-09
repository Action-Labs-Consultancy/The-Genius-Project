// src/pineconeApi.js
import { API_BASE_URL } from './config/api';

export async function storeData(texts = [], metadata = []) {
  const res = await fetch(`${API_BASE_URL}/store_data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, metadata }),
  });
  if (!res.ok) throw new Error('Failed to store data');
  return res.json();
}

export async function queryPinecone(question = '') {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Failed to query');
  return res.json();
}

