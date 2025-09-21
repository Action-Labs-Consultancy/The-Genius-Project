const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:2345', 'http://192.168.100.63:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const dueDiligenceRoutes = require('./due-diligence-api-file');
app.use('/api/due-diligence', dueDiligenceRoutes);

// Folder Explorer API endpoints
app.get('/api/folders/:folderName', async (req, res) => {
  try {
    const { folderName } = req.params;
    const allowedFolders = ['build', '.storage', 'cover', 'workspace'];
    
    if (!allowedFolders.includes(folderName)) {
      return res.status(400).json({
        success: false,
        error: 'Folder not allowed'
      });
    }

    const folderPath = path.join(__dirname, folderName);
    
    try {
      const items = await fs.readdir(folderPath, { withFileTypes: true });
      const contents = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(folderPath, item.name);
          let size = null;
          
          try {
            if (item.isFile()) {
              const stats = await fs.stat(itemPath);
              size = (stats.size / 1024).toFixed(1) + ' KB';
            }
          } catch (err) {
            // Ignore stat errors
          }
          
          return {
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            size: size
          };
        })
      );
      
      res.json(contents);
    } catch (err) {
      res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }
  } catch (error) {
    console.error('Error reading folder:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Serve files from folders
app.get('/api/serve/:folderName/*', (req, res) => {
  const { folderName } = req.params;
  const filePath = req.params[0]; // Gets everything after folderName/
  const allowedFolders = ['build', '.storage', 'cover', 'workspace'];
  
  if (!allowedFolders.includes(folderName)) {
    return res.status(400).json({
      success: false,
      error: 'Folder not allowed'
    });
  }
  
  const fullPath = path.join(__dirname, folderName, filePath);
  
  // Security check - ensure we're not going outside allowed directories
  const resolvedPath = path.resolve(fullPath);
  const allowedPath = path.resolve(__dirname, folderName);
  
  if (!resolvedPath.startsWith(allowedPath)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  res.sendFile(resolvedPath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  });
});

// Download files from folders
app.get('/api/download/:folderName/:fileName', (req, res) => {
  const { folderName, fileName } = req.params;
  const allowedFolders = ['build', '.storage', 'cover', 'workspace'];
  
  if (!allowedFolders.includes(folderName)) {
    return res.status(400).json({
      success: false,
      error: 'Folder not allowed'
    });
  }
  
  const filePath = path.join(__dirname, folderName, fileName);
  
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  });
});

// Simple authentication routes
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check user in database
    const user = await database.get(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (user) {
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_admin: user.is_admin
        },
        token: 'demo-token-123'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

app.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/user', async (req, res) => {
  try {
    // Return first admin user for demo
    const user = await database.get('SELECT * FROM users WHERE is_admin = 1 LIMIT 1');
    if (user) {
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_admin: user.is_admin
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Additional endpoint for users/current (compatibility)
app.get('/api/users/current', async (req, res) => {
  try {
    // Return first admin user for demo
    const user = await database.get('SELECT * FROM users WHERE is_admin = 1 LIMIT 1');
    if (user) {
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_admin: user.is_admin
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Notifications endpoint
app.get('/api/notifications', (req, res) => {
  const limit = req.query.limit || 10;
  // Return demo notifications
  res.json({
    success: true,
    notifications: [
      {
        id: 1,
        title: 'Welcome to The Genius Project',
        message: 'System is ready for use',
        type: 'info',
        read: false,
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Project Folders Integrated',
        message: 'Build, storage, cover, and workspace folders are now accessible',
        type: 'success',
        read: false,
        timestamp: new Date(Date.now() - 60000).toISOString()
      }
    ].slice(0, limit),
    total: 2
  });
});

// Feature requests endpoints
app.get('/api/feature-requests', (req, res) => {
  res.json({ success: true, requests: [] });
});

app.post('/api/feature-requests', (req, res) => {
  res.json({ success: true, message: 'Feature request submitted successfully' });
});

app.get('/api/admin/feature-requests', (req, res) => {
  res.json({ success: true, requests: [] });
});

app.put('/api/admin/feature-requests/:id/status', (req, res) => {
  res.json({ success: true, message: 'Status updated successfully' });
});

// Access requests endpoints
app.get('/api/access-requests', async (req, res) => {
  try {
    const requests = await database.all('SELECT * FROM access_requests ORDER BY created_at DESC');
    res.json(requests);
  } catch (error) {
    console.error('Get access requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/access-requests', async (req, res) => {
  try {
    const { name, email, requested_role, department, message } = req.body;
    
    const result = await database.run(
      'INSERT INTO access_requests (name, email, requested_role, department, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, requested_role, department, message, 'pending']
    );
    
    res.json({ success: true, message: 'Access request submitted successfully', id: result.id });
  } catch (error) {
    console.error('Create access request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Users endpoint for Settings page
app.get('/api/users', async (req, res) => {
  try {
    const users = await database.all('SELECT id, name, email, role, user_type, department, is_admin, start_date, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, user_type, department, is_admin, start_date } = req.body;
    
    const result = await database.run(
      'INSERT INTO users (name, email, password, role, user_type, department, is_admin, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, role || 'employee', user_type || 'employee', department, is_admin ? 1 : 0, start_date]
    );
    
    const newUser = await database.get('SELECT * FROM users WHERE id = ?', [result.id]);
    res.json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', (req, res) => {
  const userData = req.body;
  res.json({
    success: true,
    user: {
      id: Date.now(),
      ...userData,
      created_at: new Date().toISOString()
    }
  });
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, message: `User ${id} deleted successfully` });
});

// Update user endpoint
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const userData = req.body;
  res.json({
    success: true,
    user: {
      id: parseInt(id),
      ...userData,
      updated_at: new Date().toISOString()
    }
  });
});

// Access request actions
app.post('/api/access-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('UPDATE access_requests SET status = ? WHERE id = ?', ['approved', id]);
    res.json({ success: true, message: `Access request ${id} approved` });
  } catch (error) {
    console.error('Approve access request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/access-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('UPDATE access_requests SET status = ? WHERE id = ?', ['rejected', id]);
    res.json({ success: true, message: `Access request ${id} rejected` });
  } catch (error) {
    console.error('Reject access request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Due Diligence API',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Due Diligence API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dueDiligence: '/api/due-diligence/*'
    },
    integration: 'Frontend + n8n Workflow',
    database: 'PostgreSQL (n8n_db)',
    documentation: 'See FRONTEND_N8N_INTEGRATION_GUIDE.md'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/due-diligence/sections',
      'GET /api/due-diligence/companies',
      'POST /api/due-diligence/generate',
      'POST /api/due-diligence/companies'
    ]
  });
});

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database
    await database.init();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log('🚀 Due Diligence API Server Started');
      console.log(`📍 Server running at: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API endpoints: http://localhost:${PORT}/api/due-diligence`);
      console.log(`🔗 Frontend integration: http://localhost:2345`);
      console.log(`⚙️  n8n webhook: http://localhost:5678/webhook/generate-section`);
      console.log('');
      console.log('📋 Available API endpoints:');
      console.log('  GET  /api/due-diligence/sections - Get all sections');
      console.log('  GET  /api/due-diligence/companies - Get all companies');
      console.log('  POST /api/due-diligence/generate - Generate section content');
      console.log('  POST /api/due-diligence/companies - Create new company');
      console.log('  POST /api/due-diligence/webhook/section-complete - n8n webhook');
      console.log('');
  console.log('🗄️  Database: MongoDB Atlas (genius_db)');
      console.log('🔧 Integration: Ready for n8n workflow');
      console.log('👥 Authentication: Database-driven user management');
      console.log('📋 Settings: Connected to MongoDB database');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
