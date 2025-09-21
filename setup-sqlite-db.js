// Simple SQLite database setup for n8n workflow
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'due_diligence.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS company_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    file_id TEXT UNIQUE NOT NULL,
    folder_id TEXT NOT NULL,
    content TEXT,
    full_text_content TEXT,
    websites TEXT,
    primary_website TEXT,
    emails TEXT,
    primary_email TEXT,
    phones TEXT,
    primary_phone TEXT,
    addresses TEXT,
    primary_address TEXT,
    file_size INTEGER,
    content_length INTEGER,
    extraction_method TEXT,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS due_diligence_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kanboard_task_id INTEGER NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
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
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_company_data_company_name ON company_data(company_name);
  CREATE INDEX IF NOT EXISTS idx_company_data_folder_id ON company_data(folder_id);
  CREATE INDEX IF NOT EXISTS idx_due_diligence_reports_task_id ON due_diligence_reports(kanboard_task_id);
`);

console.log('✅ SQLite database and tables created successfully');
console.log('Database location:', dbPath);

db.close();
