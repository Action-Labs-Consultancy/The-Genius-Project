-- PostgreSQL Setup Script - User with password 'admin'
-- Run this as PostgreSQL superuser (postgres)

-- Create new user with password 'admin' for n8n
DROP USER IF EXISTS n8n_user;
CREATE USER n8n_user WITH PASSWORD 'admin';

-- Grant all privileges on postgres database
GRANT ALL PRIVILEGES ON DATABASE postgres TO n8n_user;

-- Connect to postgres database to set up schema permissions
\c postgres

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO n8n_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n8n_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO n8n_user;

-- Now create the due diligence tables
-- Drop existing tables (if any)
DROP TABLE IF EXISTS dd_reports CASCADE;
DROP TABLE IF EXISTS dd_sections CASCADE; 
DROP TABLE IF EXISTS dd_companies CASCADE;

-- Create companies table
CREATE TABLE dd_companies (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(500) NOT NULL,
    folder_id VARCHAR(255) NOT NULL,
    folder_name VARCHAR(500),
    processing_status VARCHAR(100) DEFAULT 'initialized',
    total_files INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sections table  
CREATE TABLE dd_sections (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    section_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    status VARCHAR(100) DEFAULT 'pending',
    feedback_checker TEXT,
    feedback_approver TEXT,
    attempt_count INTEGER DEFAULT 1,
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    knowledge_items_used INTEGER DEFAULT 0,
    previous_sections_referenced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_company_section UNIQUE (company_id, section_number)
);

-- Create reports table
CREATE TABLE dd_reports (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    company_name VARCHAR(500) NOT NULL,
    folder_id VARCHAR(255) NOT NULL,
    total_sections INTEGER DEFAULT 20,
    approved_sections INTEGER DEFAULT 0,
    success_rate VARCHAR(20) DEFAULT '0%',
    pdf_url TEXT,
    pdf_file_id VARCHAR(255),
    status VARCHAR(100) DEFAULT 'processing',
    generated_at TIMESTAMP,
    processing_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions on new tables to n8n_user
GRANT ALL PRIVILEGES ON dd_companies TO n8n_user;
GRANT ALL PRIVILEGES ON dd_sections TO n8n_user;
GRANT ALL PRIVILEGES ON dd_reports TO n8n_user;

-- Grant sequence permissions
GRANT ALL PRIVILEGES ON dd_companies_id_seq TO n8n_user;
GRANT ALL PRIVILEGES ON dd_sections_id_seq TO n8n_user;
GRANT ALL PRIVILEGES ON dd_reports_id_seq TO n8n_user;

-- Create indexes for performance
CREATE INDEX idx_dd_companies_company_id ON dd_companies(company_id);
CREATE INDEX idx_dd_companies_status ON dd_companies(processing_status);
CREATE INDEX idx_dd_sections_company_id ON dd_sections(company_id);
CREATE INDEX idx_dd_sections_status ON dd_sections(status);
CREATE INDEX idx_dd_sections_company_section ON dd_sections(company_id, section_number);
CREATE INDEX idx_dd_reports_company_id ON dd_reports(company_id);
CREATE INDEX idx_dd_reports_status ON dd_reports(status);

-- Insert test data to verify setup
INSERT INTO dd_companies (company_id, company_name, folder_id, folder_name) 
VALUES ('test_setup_001', 'Test Setup Company', 'folder_001', 'Test Setup Folder');

-- Test the n8n_user can access the data
SET ROLE n8n_user;
SELECT 'Setup successful! n8n_user can access data.' as status, company_name FROM dd_companies WHERE company_id = 'test_setup_001';
RESET ROLE;

-- Show final setup summary
SELECT 'Database setup complete!' as message;
\du n8n_user
\dt dd_*
