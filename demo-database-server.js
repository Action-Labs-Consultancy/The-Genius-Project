// Simple Rollback Demo - Works without PostgreSQL CLI
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 10001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple demo data store (simulates database)
let demoDatabase = {
  currentState: {
    timestamp: new Date().toISOString(),
    data: {
      users: 5,
      projects: 3,
      workflows: 8
    }
  },
  backups: []
};

// Create a backup directory
const BACKUP_DIR = path.join(__dirname, 'demo_backups');

async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Demo Database Management API'
  });
});

// Database status
app.get('/api/database/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      database: {
        host: 'localhost',
        port: 5432,
        database: 'demo_db',
        size: '2.5 MB',
        currentState: demoDatabase.currentState
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
});

// Create backup
app.post('/api/database/backup', async (req, res) => {
  try {
    await ensureBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `demo_backup_${timestamp}.json`;
    const backupData = {
      created: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(demoDatabase.currentState))
    };
    
    // Save backup file
    const filePath = path.join(BACKUP_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2));
    
    // Add to backups list
    demoDatabase.backups.push({
      filename,
      size: '1.2 KB',
      created: backupData.created,
      path: filePath
    });
    
    console.log(`📦 Demo backup created: ${filename}`);
    
    res.json({
      success: true,
      message: 'Demo backup created successfully',
      filename,
      timestamp: backupData.created
    });
  } catch (error) {
    console.error('❌ Demo backup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Demo backup failed: ' + error.message
    });
  }
});

// Point-in-time rollback (simulated)
app.post('/api/database/rollback', async (req, res) => {
  try {
    const { timestamp } = req.body;
    
    if (!timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Timestamp is required for PITR'
      });
    }
    
    // Simulate rollback by reducing some data
    const rollbackTime = new Date(timestamp);
    const currentTime = new Date();
    const hoursDiff = (currentTime - rollbackTime) / (1000 * 60 * 60);
    
    // Simulate data loss proportional to time difference
    const dataReduction = Math.min(hoursDiff * 0.1, 0.8);
    
    demoDatabase.currentState = {
      timestamp: rollbackTime.toISOString(),
      data: {
        users: Math.max(1, Math.floor(demoDatabase.currentState.data.users * (1 - dataReduction))),
        projects: Math.max(1, Math.floor(demoDatabase.currentState.data.projects * (1 - dataReduction))),
        workflows: Math.max(1, Math.floor(demoDatabase.currentState.data.workflows * (1 - dataReduction)))
      }
    };
    
    console.log(`🔄 Demo PITR rollback to ${timestamp}`);
    
    res.json({
      success: true,
      message: `Demo database rolled back to ${timestamp}`,
      newState: demoDatabase.currentState
    });
  } catch (error) {
    console.error('❌ Demo rollback failed:', error);
    res.status(500).json({
      success: false,
      message: 'Demo rollback failed: ' + error.message
    });
  }
});

// Restore from backup
app.post('/api/database/recovery', async (req, res) => {
  try {
    const { backupFile } = req.body;
    
    if (!backupFile) {
      return res.status(400).json({
        success: false,
        message: 'Backup file is required'
      });
    }
    
    // Find backup
    const backup = demoDatabase.backups.find(b => b.filename === backupFile);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }
    
    // Read backup file
    const backupData = JSON.parse(await fs.readFile(backup.path, 'utf8'));
    
    // Restore data
    demoDatabase.currentState = backupData.data;
    
    console.log(`🔄 Demo restore from backup: ${backupFile}`);
    
    res.json({
      success: true,
      message: `Demo database restored from ${backupFile}`,
      restoredState: demoDatabase.currentState
    });
  } catch (error) {
    console.error('❌ Demo restore failed:', error);
    res.status(500).json({
      success: false,
      message: 'Demo restore failed: ' + error.message
    });
  }
});

// List backups
app.get('/api/database/backups', async (req, res) => {
  try {
    res.json({
      success: true,
      backups: demoDatabase.backups
    });
  } catch (error) {
    console.error('❌ Failed to list demo backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list demo backups: ' + error.message
    });
  }
});

// Demo data manipulation endpoints
app.post('/api/demo/addData', (req, res) => {
  demoDatabase.currentState.data.users += 1;
  demoDatabase.currentState.data.projects += Math.random() > 0.7 ? 1 : 0;
  demoDatabase.currentState.data.workflows += Math.floor(Math.random() * 3);
  demoDatabase.currentState.timestamp = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Demo data added',
    newState: demoDatabase.currentState
  });
});

app.post('/api/demo/reset', (req, res) => {
  demoDatabase.currentState = {
    timestamp: new Date().toISOString(),
    data: {
      users: 5,
      projects: 3,
      workflows: 8
    }
  };
  
  res.json({
    success: true,
    message: 'Demo data reset',
    newState: demoDatabase.currentState
  });
});

// Start server
app.listen(PORT, async () => {
  await ensureBackupDir();
  console.log(`🚀 Demo Database Management API running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🛡️ Demo rollback interface: file:///${__dirname}/demo-rollback-interface.html`);
  console.log(`📊 Demo Database: ${JSON.stringify(demoDatabase.currentState.data)}`);
});
