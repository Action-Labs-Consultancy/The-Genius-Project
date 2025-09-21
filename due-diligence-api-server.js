const express = require('express');
const cors = require('cors');
const dueDiligenceApi = require('./due-diligence-api-file');

const app = express();
const PORT = 10002;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api', dueDiligenceApi);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Due Diligence API Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Due Diligence API Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/*`);
});

module.exports = app;
