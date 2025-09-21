// Utility endpoint to truncate company_data and due_diligence_reports tables
// Usage: POST http://localhost:10000/api/database/empty

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

const POSTGRES_CONFIG = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'your_password',
  database: process.env.POSTGRES_DB || 'n8n_db',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432
};

router.post('/empty', async (req, res) => {
  try {
    const command = `powershell.exe -Command \`$env:PGPASSWORD=\"${POSTGRES_CONFIG.password}\"; psql -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -c \"TRUNCATE company_data, due_diligence_reports RESTART IDENTITY CASCADE;\"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ success: false, error: error.message, stderr });
      }
      res.json({ success: true, stdout });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
