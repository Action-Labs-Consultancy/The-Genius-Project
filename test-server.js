// Simple test server to debug the issue
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 10001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});
