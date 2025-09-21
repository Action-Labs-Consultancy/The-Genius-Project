const { Pool } = require('pg');

// Try different password configurations
const connectionConfigs = [
  { password: '' },
  { password: 'postgres' },
  { password: 'admin' },
  { password: '123456' }
];

async function setupDatabase() {
  let pool = null;
  
  console.log('🔄 Attempting to connect to PostgreSQL default database...');
  
  for (const config of connectionConfigs) {
    try {
      pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres', // Connect to default database first
        password: config.password,
        port: 5432,
      });
      
      await pool.query('SELECT NOW()');
      console.log(`✅ Connected to postgres database with password: '${config.password || '(empty)'}'`);
      break;
    } catch (error) {
      console.log(`❌ Failed with password: '${config.password || '(empty)'}'`);
      if (pool) {
        await pool.end();
        pool = null;
      }
    }
  }
  
  if (!pool) {
    console.error('❌ Could not connect to PostgreSQL with any configuration');
    console.log('📝 Please ensure PostgreSQL is running and try these manual steps:');
    console.log('   1. Open pgAdmin or psql');
    console.log('   2. Connect to PostgreSQL');
    console.log('   3. Create database "n8n_db"');
    console.log('   4. Run this script again');
    process.exit(1);
  }
  
  try {
    // Check if n8n_db exists
    const dbCheck = await pool.query(`
      SELECT 1 FROM pg_database WHERE datname = 'n8n_db'
    `);
    
    if (dbCheck.rows.length === 0) {
      console.log('📋 Creating n8n_db database...');
      await pool.query('CREATE DATABASE n8n_db');
      console.log('✅ n8n_db database created');
    } else {
      console.log('✅ n8n_db database already exists');
    }
    
    await pool.end();
    
    // Now connect to n8n_db
    console.log('🔄 Connecting to n8n_db...');
    const workingPassword = pool.options.password;
    
    const n8nPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'n8n_db',
      password: workingPassword,
      port: 5432,
    });
    
    await n8nPool.query('SELECT NOW()');
    console.log('✅ Connected to n8n_db successfully');
    
    // Create tables
    console.log('📋 Creating tables...');
    
    // Create company_data table
    await n8nPool.query(`
      CREATE TABLE IF NOT EXISTS company_data (
        company_id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        folder_id VARCHAR(255),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create complete_dd_reports table
    await n8nPool.query(`
      CREATE TABLE IF NOT EXISTS complete_dd_reports (
        company_id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Section columns
        introduction_engagement_context TEXT,
        legal_disclaimers_reliance_limitations TEXT,
        methodology_source_validation TEXT,
        financial_trajectory_revenue_quality TEXT,
        partnerships_ecosystem_alliances TEXT,
        intellectual_property_technology TEXT,
        governance_disclosures_risks TEXT,
        appendix_management_rfi TEXT,
        
        -- Additional sections for n8n workflow
        section_9 TEXT,
        section_10 TEXT,
        section_11 TEXT,
        section_12 TEXT,
        section_13 TEXT,
        section_14 TEXT,
        section_15 TEXT,
        section_16 TEXT,
        section_17 TEXT,
        section_18 TEXT,
        section_19 TEXT,
        section_20 TEXT,
        
        -- Consolidated report
        consolidated_report TEXT
      )
    `);
    
    console.log('✅ Tables created successfully');
    
    // Insert sample company
    const companyCheck = await n8nPool.query('SELECT COUNT(*) FROM company_data');
    if (parseInt(companyCheck.rows[0].count) === 0) {
      console.log('📊 Inserting sample company data...');
      
      const sampleCompanyId = 'techstart_innovation';
      
      await n8nPool.query(`
        INSERT INTO company_data (company_id, company_name, folder_id, content)
        VALUES ($1, $2, $3, $4)
      `, [sampleCompanyId, 'TechStart Innovation Inc.', 'demo_folder', 'Technology company specializing in AI and machine learning solutions']);
      
      await n8nPool.query(`
        INSERT INTO complete_dd_reports (company_id, company_name, status)
        VALUES ($1, $2, $3)
      `, [sampleCompanyId, 'TechStart Innovation Inc.', 'in_progress']);
      
      console.log('✅ Sample company data inserted');
    }
    
    console.log('🎯 Database setup complete!');
    console.log(`💡 Use password: '${workingPassword}' for future connections`);
    
    await n8nPool.end();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
