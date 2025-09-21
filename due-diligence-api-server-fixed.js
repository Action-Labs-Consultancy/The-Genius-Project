const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 10002;

// Basic error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (before loading routes)
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    success: true,
    message: 'Due Diligence API Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

console.log('Loading routes...');

// Try to load the API routes with error handling
try {
  const apiRoutes = require('./due-diligence-api-file.js');
  app.use('/api', apiRoutes);
  console.log('✅ API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading API routes:', error.message);
  console.error('Stack:', error.stack);
  
  // Create a fallback route
  app.use('/api', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'API routes failed to load',
      error: error.message
    });
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);
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
    message: 'Route not found',
    path: req.path
  });
});

console.log('Starting server...');

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Due Diligence API Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API endpoints: http://localhost:${PORT}/api/`);
  console.log('✅ Server started successfully');
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or change the port.`);
  }
  process.exit(1);
});

// Graceful shutdown handlers
const gracefulShutdown = () => {
  console.log('Received shutdown signal, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('Server script loaded successfully');
