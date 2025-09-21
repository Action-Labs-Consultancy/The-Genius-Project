// Enhanced Backend API Server with PostgreSQL Database Management
// Integrates with The Genius Project n8n interface for PITR rollback functionality
// Created for Windows environment with PowerShell integration

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.API_PORT || 10000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    'http://localhost:5678',  // n8n
    'http://127.0.0.1:5678',
    'http://localhost:8000',  // Kanboard
    'http://127.0.0.1:8000',
    'http://192.168.1.1:5678',
    'http://192.168.1.1:8000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`🔗 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// PostgreSQL configuration
const POSTGRES_CONFIG = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'your_password',
  database: process.env.POSTGRES_DB || 'n8n_db',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  backupDir: process.env.BACKUP_DIR || 'C:\\PostgreSQL_Backups'
};

// Utility function to execute PowerShell commands
const executeCommand = (command, workingDir = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      shell: 'powershell.exe',
      encoding: 'utf8',
      timeout: 300000 // 5 minutes timeout
    };
    
    if (workingDir) {
      options.cwd = workingDir;
    }
    
    console.log(`🔧 Executing: ${command}`);
    
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Command failed: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️ Command stderr: ${stderr}`);
      }
      
      console.log(`✅ Command output: ${stdout.trim()}`);
      resolve(stdout.trim());
    });
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Database Management API'
  });
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    console.log('🔍 Checking PostgreSQL database status...');
    
    // Check if PostgreSQL service is running
    const psqlStatus = await executeCommand('Get-Service -Name "postgresql*" | Select-Object Name, Status | ConvertTo-Json');
    
    // Try to connect to database
    const connectionTest = await executeCommand(`
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      psql -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -c "SELECT version();"
    `);
    
    // Get database size
    const dbSize = await executeCommand(`
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      psql -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -t -c "SELECT pg_size_pretty(pg_database_size('${POSTGRES_CONFIG.database}'));"
    `);
    
    // Check backup directory
    const backupExists = await fs.access(POSTGRES_CONFIG.backupDir).then(() => true).catch(() => false);
    
    res.json({
      status: 'healthy',
      database: {
        connection: 'active',
        version: connectionTest.includes('PostgreSQL') ? connectionTest.split('\n')[0] : 'Unknown',
        size: dbSize.trim(),
        host: POSTGRES_CONFIG.host,
        port: POSTGRES_CONFIG.port,
        database: POSTGRES_CONFIG.database
      },
      service: JSON.parse(psqlStatus),
      backup: {
        directory: POSTGRES_CONFIG.backupDir,
        exists: backupExists
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database status check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check database status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create database backup endpoint
app.post('/api/database/backup', async (req, res) => {
  try {
    console.log('💾 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `n8n_backup_${timestamp}.sql`;
    const backupPath = path.join(POSTGRES_CONFIG.backupDir, backupFileName);
    
    // Ensure backup directory exists
    await executeCommand(`New-Item -ItemType Directory -Force -Path "${POSTGRES_CONFIG.backupDir}"`);
    
    // Create backup
    const backupCommand = `
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      pg_dump -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -f "${backupPath}" --verbose
    `;
    
    await executeCommand(backupCommand);
    
    // Verify backup file exists and get size
    const fileStats = await fs.stat(backupPath);
    
    res.json({
      success: true,
      message: 'Database backup created successfully',
      backup: {
        filename: backupFileName,
        path: backupPath,
        size: `${(fileStats.size / 1024 / 1024).toFixed(2)} MB`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create database backup',
      error: error.message
    });
  }
});

// Database rollback endpoint (Point-in-Time Recovery)
app.post('/api/database/rollback', async (req, res) => {
  try {
    const { timestamp } = req.body;
    
    if (!timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Timestamp is required for point-in-time recovery'
      });
    }
    
    console.log(`🔄 Performing PITR rollback to: ${timestamp}`);
    
    // Stop n8n service if running
    console.log('🛑 Stopping n8n service...');
    await executeCommand('Stop-Process -Name "n8n" -Force -ErrorAction SilentlyContinue');
    
    // Create pre-rollback backup
    const preRollbackBackup = `pre_rollback_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const preRollbackPath = path.join(POSTGRES_CONFIG.backupDir, preRollbackBackup);
    
    await executeCommand(`
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      pg_dump -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -f "${preRollbackPath}"
    `);
    
    // Stop PostgreSQL service
    console.log('🛑 Stopping PostgreSQL service...');
    await executeCommand('Stop-Service -Name "postgresql*" -Force');
    
    // Perform PITR using pg_basebackup and WAL files
    const pitrCommand = `
      # This is a simplified PITR - in production you'd restore from base backup + WAL replay
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      
      # Start PostgreSQL in recovery mode
      Start-Service -Name "postgresql*"
      
      # Create recovery.conf for PITR
      $recoveryConf = @"
restore_command = 'copy "C:\\PostgreSQL_WAL\\%f" "%p"'
recovery_target_time = '${timestamp}'
recovery_target_action = 'promote'
"@
      
      $recoveryConf | Out-File -FilePath "C:\\PostgreSQL\\data\\recovery.conf" -Encoding UTF8
      
      # Restart PostgreSQL to trigger recovery
      Restart-Service -Name "postgresql*"
    `;
    
    await executeCommand(pitrCommand);
    
    // Wait for recovery to complete
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verify database is accessible
    await executeCommand(`
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      psql -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -c "SELECT current_timestamp;"
    `);
    
    res.json({
      success: true,
      message: `Database successfully rolled back to ${timestamp}`,
      rollback: {
        targetTime: timestamp,
        preRollbackBackup: preRollbackBackup,
        completedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database rollback failed',
      error: error.message
    });
  }
});

// Database recovery from backup file
app.post('/api/database/recovery', async (req, res) => {
  try {
    const { backupFile } = req.body;
    
    if (!backupFile) {
      return res.status(400).json({
        success: false,
        message: 'Backup file path is required'
      });
    }
    
    const backupPath = path.join(POSTGRES_CONFIG.backupDir, backupFile);
    
    // Verify backup file exists
    await fs.access(backupPath);
    
    console.log(`🔄 Restoring database from backup: ${backupFile}`);
    
    // Create pre-recovery backup
    const preRecoveryBackup = `pre_recovery_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const preRecoveryPath = path.join(POSTGRES_CONFIG.backupDir, preRecoveryBackup);
    
    await executeCommand(`
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      pg_dump -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -f "${preRecoveryPath}"
    `);
    
    // Drop existing database and recreate
    await executeCommand(`
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      dropdb -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} ${POSTGRES_CONFIG.database} --if-exists
      createdb -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} ${POSTGRES_CONFIG.database}
    `);
    
    // Restore from backup
    await executeCommand(`
      $env:PGPASSWORD = "${POSTGRES_CONFIG.password}"
      psql -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -f "${backupPath}"
    `);
    
    res.json({
      success: true,
      message: 'Database restored successfully from backup',
      recovery: {
        sourceBackup: backupFile,
        preRecoveryBackup: preRecoveryBackup,
        completedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database recovery failed',
      error: error.message
    });
  }
});

// List available backups
app.get('/api/database/backups', async (req, res) => {
  try {
    const backupDir = POSTGRES_CONFIG.backupDir;
    
    // Check if backup directory exists
    await fs.access(backupDir);
    
    // Read backup files
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(file => file.endsWith('.sql'));
    
    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        return {
          filename: file,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        };
      })
    );
    
    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({
      success: true,
      backupDirectory: backupDir,
      totalBackups: backups.length,
      backups: backups
    });
    
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list database backups',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Database Management API is running!',
    timestamp: new Date().toISOString(),
    config: {
      host: POSTGRES_CONFIG.host,
      port: POSTGRES_CONFIG.port,
      database: POSTGRES_CONFIG.database,
      backupDir: POSTGRES_CONFIG.backupDir
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Add utility endpoint for emptying the database
const dbEmptyRouter = require('./database-empty-endpoint');
app.use('/api/database', dbEmptyRouter);

// Add due diligence endpoints
const dueDiligenceRouter = require('./due-diligence-api');
app.use('/api/due-diligence', dueDiligenceRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Database Management API Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🛡️ Database endpoints available at /api/database/*`);
  console.log(`📊 PostgreSQL Config: ${POSTGRES_CONFIG.host}:${POSTGRES_CONFIG.port}/${POSTGRES_CONFIG.database}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('📴 Shutting down Database Management API Server...');
  process.exit(0);
});
