const { Pool } = require('pg');

// Try different password configurations
const connectionConfigs = [
  { password: '' },
  { password: 'postgres' },
  { password: 'admin' },
  { password: '123456' }
];

async function initializeDatabase() {
  let pool = null;
  
  console.log('🔄 Attempting to connect to PostgreSQL...');
  
  for (const config of connectionConfigs) {
    try {
      pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'n8n_db',
        password: config.password,
        port: 5432,
      });
      
      await pool.query('SELECT NOW()');
      console.log(`✅ Connected with password: '${config.password || '(empty)'}'`);
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
    console.error('❌ Could not connect to database with any configuration');
    process.exit(1);
  }
  
  try {
    console.log('📋 Creating tables if they don\'t exist...');
    
    // Create company_data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_data (
        company_id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        folder_id VARCHAR(255),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create complete_dd_reports table
    await pool.query(`
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
        
        -- Additional sections for completeness
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
    
    console.log('✅ Database tables initialized successfully');
    
    // Insert sample company if none exists
    const companyCheck = await pool.query('SELECT COUNT(*) FROM company_data');
    if (parseInt(companyCheck.rows[0].count) === 0) {
      console.log('📊 Inserting sample company data...');
      
      const sampleCompanyId = 'demo_company_' + Date.now();
      
      await pool.query(`
        INSERT INTO company_data (company_id, company_name, folder_id, content)
        VALUES ($1, $2, $3, $4)
      `, [sampleCompanyId, 'TechStart Innovation Inc.', 'demo_folder', 'Sample technology company for AI solutions']);
      
      await pool.query(`
        INSERT INTO complete_dd_reports (company_id, company_name, status)
        VALUES ($1, $2, $3)
      `, [sampleCompanyId, 'TechStart Innovation Inc.', 'in_progress']);
      
      console.log('✅ Sample company data inserted');
    }
    
    console.log('🎯 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
