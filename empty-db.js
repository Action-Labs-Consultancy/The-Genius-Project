const { exec } = require('child_process');

const POSTGRES_CONFIG = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'your_password',
  database: process.env.POSTGRES_DB || 'n8n_db',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432
};

const command = `$env:PGPASSWORD=\"${POSTGRES_CONFIG.password}\"; psql -h ${POSTGRES_CONFIG.host} -p ${POSTGRES_CONFIG.port} -U ${POSTGRES_CONFIG.user} -d ${POSTGRES_CONFIG.database} -c \"TRUNCATE company_data, due_diligence_reports RESTART IDENTITY CASCADE;\"`;

exec(`powershell.exe -Command "${command}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    if (stderr) console.error('STDERR:', stderr);
    process.exit(1);
  }
  console.log('STDOUT:', stdout);
  process.exit(0);
});
