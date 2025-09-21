const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: 'duediligence123',
  database: 'due_diligence_db',
  host: 'localhost',
  port: 5432,
});

async function setupTables() {
  try {
    await client.connect();
    
    // Create the tables with all 20 sections
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_data (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        file_id VARCHAR(255) UNIQUE NOT NULL,
        folder_id VARCHAR(255) NOT NULL,
        content TEXT,
        full_text_content TEXT,
        websites TEXT,
        primary_website VARCHAR(500),
        emails TEXT,
        primary_email VARCHAR(255),
        phones TEXT,
        primary_phone VARCHAR(50),
        addresses TEXT,
        primary_address TEXT,
        file_size BIGINT,
        content_length INTEGER,
        extraction_method VARCHAR(50),
        processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS due_diligence_reports (
        id SERIAL PRIMARY KEY,
        kanboard_task_id INTEGER NOT NULL UNIQUE,
        company_name VARCHAR(255) NOT NULL,
        introduction_engagement_context TEXT,
        methodology_reliability_levels TEXT,
        company_overview TEXT,
        business_model_unit_economics TEXT,
        products_technology TEXT,
        target_market_competitive_set TEXT,
        financials_multi_year TEXT,
        cash_burn_runway TEXT,
        revenue_quality_client_cohorts TEXT,
        partnerships_ecosystem TEXT,
        intellectual_property TEXT,
        legal_regulatory TEXT,
        governance_board_effectiveness TEXT,
        capital_structure_dilution TEXT,
        risk_matrix_mitigations TEXT,
        gaps_uncertainties_disclaimers TEXT,
        scenario_analysis TEXT,
        strategic_options TEXT,
        recommendations_next_steps TEXT,
        source_map_integrity_log TEXT,
        status VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_company_data_company_name ON company_data(company_name);
      CREATE INDEX IF NOT EXISTS idx_company_data_folder_id ON company_data(folder_id);
      CREATE INDEX IF NOT EXISTS idx_due_diligence_reports_task_id ON due_diligence_reports(kanboard_task_id);
    `);
    
    console.log('✅ PostgreSQL database and tables created successfully!');
    console.log('Database: due_diligence_db');
    console.log('User: postgres');
    console.log('Password: duediligence123');
    console.log('Host: localhost');
    console.log('Port: 5432');
    
  } catch (err) {
    console.error('Error setting up tables:', err.message);
  } finally {
    await client.end();
  }
}

setupTables();
