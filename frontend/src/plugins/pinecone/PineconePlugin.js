// Pinecone plugin implementation
import VectorDBPlugin from '../interfaces/VectorDB';

export default class PineconePlugin extends VectorDBPlugin {
  async upsert(texts = [], metadata = []) {
    const res = await fetch('http://localhost:5001/store_data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, metadata }),
    });
    if (!res.ok) throw new Error('Failed to store data');
    return res.json();
  }

  async query(question = '') {
    const res = await fetch('http://localhost:5001/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error('Failed to query');
    return res.json();
  }

  queryVectors(query) {
    // ...existing Pinecone logic...
  }
}
