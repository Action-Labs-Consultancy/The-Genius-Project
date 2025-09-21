-- PostgreSQL Schema Setup for n8n Due Diligence System
-- Execute this script in your PostgreSQL database

-- Create database if it doesn't exist
-- CREATE DATABASE n8n_due_diligence;

-- Use the database
-- \c n8n_due_diligence;

-- Create companies table
CREATE TABLE IF NOT EXISTS dd_companies (
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
CREATE TABLE IF NOT EXISTS dd_sections (
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
CREATE TABLE IF NOT EXISTS dd_reports (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dd_companies_company_id ON dd_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_companies_status ON dd_companies(processing_status);

CREATE INDEX IF NOT EXISTS idx_dd_sections_company_id ON dd_sections(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_sections_status ON dd_sections(status);
CREATE INDEX IF NOT EXISTS idx_dd_sections_company_section ON dd_sections(company_id, section_number);

CREATE INDEX IF NOT EXISTS idx_dd_reports_company_id ON dd_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_reports_status ON dd_reports(status);

-- Create a view for progress tracking
CREATE OR REPLACE VIEW dd_progress AS
SELECT 
    c.company_id,
    c.company_name,
    c.processing_status as company_status,
    COUNT(s.id) as sections_created,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as sections_approved,
    ROUND(
        (COUNT(CASE WHEN s.status = 'approved' THEN 1 END) * 100.0 / 20), 
        1
    ) as completion_percentage,
    c.started_at,
    c.completed_at,
    r.pdf_url,
    r.status as report_status
FROM dd_companies c
LEFT JOIN dd_sections s ON c.company_id = s.company_id
LEFT JOIN dd_reports r ON c.company_id = r.company_id
GROUP BY c.company_id, c.company_name, c.processing_status, c.started_at, c.completed_at, r.pdf_url, r.status;

-- Test data insertion (optional - remove in production)
-- INSERT INTO dd_companies (company_id, company_name, folder_id, folder_name) 
-- VALUES ('test_company_001', 'Test Company Inc', 'folder_123', 'Test Company Folder')
-- ON CONFLICT (company_id) DO NOTHING;

COMMENT ON TABLE dd_companies IS 'Stores company information and processing status';
COMMENT ON TABLE dd_sections IS 'Stores individual due diligence section content and approval status';
COMMENT ON TABLE dd_reports IS 'Stores final report generation information and PDF links';
COMMENT ON VIEW dd_progress IS 'Provides real-time progress tracking across all companies and sections';

-- Verify tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'dd_%';
