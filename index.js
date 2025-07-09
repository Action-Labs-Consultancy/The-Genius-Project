require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB setup
const mongoUri = 'mongodb+srv://rhasan:16nqDFnauBTEDORs@cluster0.tj04exd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const mongoClient = new MongoClient(mongoUri);

// Pinecone setup
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

async function main() {
  // Connect to MongoDB
  await mongoClient.connect();
  const db = mongoClient.db('genius_db'); // or your db name

  // Connect to Pinecone
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  app.get('/api/test', async (req, res) => {
    // Example: fetch a user from MongoDB
    const user = await db.collection('users').findOne({});
    // Example: upsert a vector to Pinecone
    await pineconeIndex.upsert([
      { id: 'user1', values: [0.1, 0.2, 0.3] }
    ]);
    res.json({ user, pinecone: 'Upserted vector!' });
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

main().catch(console.error);
