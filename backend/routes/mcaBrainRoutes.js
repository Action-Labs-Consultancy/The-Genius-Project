// mcaBrainRoutes.js - Backend API routes for MCA Brain system with MongoDB and Pinecone
const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const { PineconeClient } = require('@pinecone-database/pinecone');
require('dotenv').config();

// MongoDB connection
let db;
const connectDB = async () => {
  if (!db) {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    await client.connect();
    db = client.db(process.env.DB_NAME || 'genius_project');
  }
  return db;
};

// Pinecone connection
let pinecone;
const connectPinecone = async () => {
  if (!pinecone) {
    pinecone = new PineconeClient();
    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pinecone;
};

// Get all MCA brains, agents, and sessions
router.get('/mca-brains', async (req, res) => {
  try {
    const database = await connectDB();
    
    const brains = await database.collection('mca_brains').find({}).toArray();
    const agents = await database.collection('mca_agents').find({}).toArray();
    const sessions = await database.collection('mca_sessions').find({}).toArray();
    
    res.json({
      success: true,
      brains: brains,
      agents: agents,
      sessions: sessions
    });
  } catch (error) {
    console.error('Error fetching MCA brains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MCA brains',
      details: error.message
    });
  }
});

// Create new MCA brain
router.post('/mca-brains', async (req, res) => {
  try {
    const database = await connectDB();
    
    const brainData = {
      ...req.body,
      type: 'mca_brain',
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0'
    };
    
    const result = await database.collection('mca_brains').insertOne(brainData);
    
    const savedBrain = {
      ...brainData,
      _id: result.insertedId
    };
    
    // Store in Pinecone for vector search
    try {
      await storeInPinecone(savedBrain);
    } catch (pineconeError) {
      console.warn('Failed to store in Pinecone:', pineconeError.message);
    }
    
    res.status(201).json({
      success: true,
      brain: savedBrain
    });
  } catch (error) {
    console.error('Error creating MCA brain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create MCA brain',
      details: error.message
    });
  }
});

// Update MCA brain
router.put('/mca-brains/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const brainId = req.params.id;
    
    const updateData = {
      ...req.body,
      lastModified: new Date()
    };
    
    const result = await database.collection('mca_brains').updateOne(
      { _id: new ObjectId(brainId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'MCA brain not found'
      });
    }
    
    const updatedBrain = await database.collection('mca_brains').findOne(
      { _id: new ObjectId(brainId) }
    );
    
    // Update in Pinecone
    try {
      await storeInPinecone(updatedBrain);
    } catch (pineconeError) {
      console.warn('Failed to update in Pinecone:', pineconeError.message);
    }
    
    res.json({
      success: true,
      brain: updatedBrain
    });
  } catch (error) {
    console.error('Error updating MCA brain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update MCA brain',
      details: error.message
    });
  }
});

// Delete MCA brain
router.delete('/mca-brains/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const brainId = req.params.id;
    
    // Delete associated agents
    await database.collection('mca_agents').deleteMany({ brainId: brainId });
    
    // Delete associated sessions
    await database.collection('mca_sessions').deleteMany({ brainId: brainId });
    
    // Delete the brain
    const result = await database.collection('mca_brains').deleteOne(
      { _id: new ObjectId(brainId) }
    );
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'MCA brain not found'
      });
    }
    
    // Delete from Pinecone
    try {
      const pc = await connectPinecone();
      const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'mca-brains');
      await index.delete1({ ids: [brainId] });
    } catch (pineconeError) {
      console.warn('Failed to delete from Pinecone:', pineconeError.message);
    }
    
    res.json({
      success: true,
      message: 'MCA brain deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting MCA brain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete MCA brain',
      details: error.message
    });
  }
});

// Create new MCA agent
router.post('/mca-agents', async (req, res) => {
  try {
    const database = await connectDB();
    
    const agentData = {
      ...req.body,
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    const result = await database.collection('mca_agents').insertOne(agentData);
    
    const savedAgent = {
      ...agentData,
      _id: result.insertedId
    };
    
    res.status(201).json({
      success: true,
      agent: savedAgent
    });
  } catch (error) {
    console.error('Error creating MCA agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create MCA agent',
      details: error.message
    });
  }
});

// Update MCA agent
router.put('/mca-agents/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const agentId = req.params.id;
    
    const updateData = {
      ...req.body,
      lastModified: new Date()
    };
    
    const result = await database.collection('mca_agents').updateOne(
      { _id: new ObjectId(agentId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'MCA agent not found'
      });
    }
    
    const updatedAgent = await database.collection('mca_agents').findOne(
      { _id: new ObjectId(agentId) }
    );
    
    res.json({
      success: true,
      agent: updatedAgent
    });
  } catch (error) {
    console.error('Error updating MCA agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update MCA agent',
      details: error.message
    });
  }
});

// Delete MCA agent
router.delete('/mca-agents/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const agentId = req.params.id;
    
    const result = await database.collection('mca_agents').deleteOne(
      { _id: new ObjectId(agentId) }
    );
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'MCA agent not found'
      });
    }
    
    res.json({
      success: true,
      message: 'MCA agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting MCA agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete MCA agent',
      details: error.message
    });
  }
});

// Save MCA session
router.post('/mca-sessions', async (req, res) => {
  try {
    const database = await connectDB();
    
    const sessionData = {
      ...req.body,
      savedAt: new Date()
    };
    
    const result = await database.collection('mca_sessions').insertOne(sessionData);
    
    const savedSession = {
      ...sessionData,
      _id: result.insertedId
    };
    
    res.status(201).json({
      success: true,
      session: savedSession
    });
  } catch (error) {
    console.error('Error saving MCA session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save MCA session',
      details: error.message
    });
  }
});

// Get MCA sessions for a brain
router.get('/mca-sessions/:brainId', async (req, res) => {
  try {
    const database = await connectDB();
    const brainId = req.params.brainId;
    
    const sessions = await database.collection('mca_sessions')
      .find({ brainId: brainId })
      .sort({ startTime: -1 })
      .limit(50)
      .toArray();
    
    res.json({
      success: true,
      sessions: sessions
    });
  } catch (error) {
    console.error('Error fetching MCA sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MCA sessions',
      details: error.message
    });
  }
});

// Store brain in Pinecone for vector search
const storeInPinecone = async (brainData) => {
  if (!process.env.PINECONE_API_KEY) {
    console.warn('Pinecone API key not configured, skipping vector storage');
    return;
  }
  
  try {
    const pc = await connectPinecone();
    const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'mca-brains');
    
    // Create text for embedding
    const textContent = [
      brainData.name,
      brainData.description,
      brainData.tone,
      brainData.style,
      ...(brainData.protocol?.rules || []),
      ...(brainData.protocol?.forbidden || [])
    ].join(' ');
    
    // For demonstration, using a simple text-based vector
    // In production, you'd use a proper embedding model like OpenAI's text-embedding-ada-002
    const simpleVector = createSimpleVector(textContent);
    
    await index.upsert({
      upsertRequest: {
        vectors: [{
          id: brainData._id.toString(),
          values: simpleVector,
          metadata: {
            name: brainData.name,
            description: brainData.description,
            tone: brainData.tone,
            style: brainData.style,
            type: 'mca_brain',
            agentCount: brainData.agents?.length || 0,
            protocolVersion: brainData.protocol?.version || '1.0',
            createdAt: brainData.createdAt
          }
        }]
      }
    });
  } catch (error) {
    console.error('Pinecone storage error:', error);
    throw error;
  }
};

// Simple vector creation (replace with proper embedding model in production)
const createSimpleVector = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(384).fill(0); // 384-dimensional vector
  
  words.forEach((word, index) => {
    const hash = simpleHash(word);
    vector[hash % 384] += 1;
  });
  
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
};

// Simple hash function
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Search brains using Pinecone
router.post('/pinecone/search-brains', async (req, res) => {
  try {
    if (!process.env.PINECONE_API_KEY) {
      return res.json({
        success: false,
        error: 'Pinecone not configured',
        matches: []
      });
    }
    
    const { query } = req.body;
    const pc = await connectPinecone();
    const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'mca-brains');
    
    const queryVector = createSimpleVector(query);
    
    const searchResponse = await index.query({
      queryRequest: {
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
        includeValues: false
      }
    });
    
    res.json({
      success: true,
      matches: searchResponse.matches || []
    });
  } catch (error) {
    console.error('Pinecone search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message,
      matches: []
    });
  }
});

// Store brain in Pinecone (direct endpoint)
router.post('/pinecone/store-brain', async (req, res) => {
  try {
    if (!process.env.PINECONE_API_KEY) {
      return res.json({
        success: false,
        error: 'Pinecone not configured'
      });
    }
    
    const { id, metadata, text } = req.body;
    const pc = await connectPinecone();
    const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'mca-brains');
    
    const vector = createSimpleVector(text);
    
    await index.upsert({
      upsertRequest: {
        vectors: [{
          id: id,
          values: vector,
          metadata: metadata
        }]
      }
    });
    
    res.json({
      success: true,
      message: 'Brain stored in Pinecone successfully'
    });
  } catch (error) {
    console.error('Pinecone storage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store in Pinecone',
      details: error.message
    });
  }
});

// Get MCA brain analytics
router.get('/mca-analytics/:brainId', async (req, res) => {
  try {
    const database = await connectDB();
    const brainId = req.params.brainId;
    
    const brain = await database.collection('mca_brains').findOne(
      { _id: new ObjectId(brainId) }
    );
    
    if (!brain) {
      return res.status(404).json({
        success: false,
        error: 'MCA brain not found'
      });
    }
    
    const agents = await database.collection('mca_agents').find({ brainId: brainId }).toArray();
    const sessions = await database.collection('mca_sessions').find({ brainId: brainId }).toArray();
    
    const analytics = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      failedSessions: sessions.filter(s => s.status === 'failed').length,
      successRate: sessions.length > 0 
        ? (sessions.filter(s => s.status === 'completed').length / sessions.length) * 100 
        : 0,
      averageExecutionTime: sessions.length > 0 
        ? sessions
            .filter(s => s.endTime && s.startTime)
            .reduce((acc, s) => acc + (new Date(s.endTime) - new Date(s.startTime)), 0) / sessions.length 
        : 0,
      agentCount: agents.length,
      agentsByRole: {
        maker: agents.filter(a => a.role === 'maker').length,
        checker: agents.filter(a => a.role === 'checker').length,
        approver: agents.filter(a => a.role === 'approver').length
      },
      protocolVersion: brain.protocol?.version || '1.0',
      lastUsed: sessions.length > 0 
        ? Math.max(...sessions.map(s => new Date(s.startTime).getTime()))
        : null
    };
    
    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error('Error fetching MCA analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MCA analytics',
      details: error.message
    });
  }
});

module.exports = router;
