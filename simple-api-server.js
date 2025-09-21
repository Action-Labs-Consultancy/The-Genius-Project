const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 10002;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Simple health check
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    success: true,
    message: 'Due Diligence API Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Simple companies endpoint
app.get('/api/companies', (req, res) => {
  console.log('Companies requested');
  res.json({
    success: true,
    companies: [
      {
        id: 'sample_company',
        name: 'Sample Company Inc.',
        created_at: new Date().toISOString(),
        status: 'active'
      }
    ]
  });
});

// Simple webhook endpoint
app.post('/api/webhook/due-diligence-upload', (req, res) => {
  console.log('Upload webhook received:', req.body);
  res.json({
    success: true,
    message: 'Upload received',
    data: req.body
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple API Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Companies endpoint: http://localhost:${PORT}/api/companies`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});

// Keep the process running
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

console.log('Server script loaded successfully');
