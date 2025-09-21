// Node.js script to empty the company_data and due_diligence_reports tables using the pg library
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: 'duediligence123',
  database: 'due_diligence_db',
  host: 'localhost',
  port: 5432,
});

async function emptyTables() {
  try {
    await client.connect();
    await client.query('TRUNCATE company_data, due_diligence_reports RESTART IDENTITY CASCADE;');
    console.log('Database tables emptied successfully.');
  } catch (err) {
    console.error('Error emptying tables:', err.message);
  } finally {
    await client.end();
  }
}

emptyTables();
