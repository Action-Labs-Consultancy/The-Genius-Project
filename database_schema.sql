-- PostgreSQL Database Schema for Due Diligence System
-- Run this to create the required tables for the DD workflows

-- Create the main companies table
CREATE TABLE IF NOT EXISTS dd_companies (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(500) NOT NULL,
    folder_name VARCHAR(500),
    folder_id VARCHAR(255),
    processing_status VARCHAR(100) DEFAULT 'initialized',
    total_files INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the sections table for storing individual DD sections
CREATE TABLE IF NOT EXISTS dd_sections (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    section_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(100) DEFAULT 'draft',
    feedback_checker TEXT,
    feedback_approver TEXT,
    attempt_count INTEGER DEFAULT 1,
    word_count INTEGER,
    character_count INTEGER,
    knowledge_items_used INTEGER DEFAULT 0,
    previous_sections_referenced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    UNIQUE(company_id, section_number),
    FOREIGN KEY (company_id) REFERENCES dd_companies(company_id) ON DELETE CASCADE
);

-- Create the reports table for final DD reports
CREATE TABLE IF NOT EXISTS dd_reports (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    company_name VARCHAR(500) NOT NULL,
    report_title VARCHAR(500),
    report_content TEXT,
    total_sections INTEGER DEFAULT 20,
    completed_sections INTEGER DEFAULT 0,
    failed_sections INTEGER DEFAULT 0,
    pdf_file_path TEXT,
    pdf_url TEXT,
    processing_status VARCHAR(100) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES dd_companies(company_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dd_sections_company_id ON dd_sections(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_sections_status ON dd_sections(status);
CREATE INDEX IF NOT EXISTS idx_dd_sections_section_number ON dd_sections(section_number);
CREATE INDEX IF NOT EXISTS idx_dd_reports_company_id ON dd_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_reports_status ON dd_reports(processing_status);
CREATE INDEX IF NOT EXISTS idx_dd_companies_status ON dd_companies(processing_status);

-- Create a view for easy reporting
CREATE OR REPLACE VIEW dd_company_progress AS
SELECT 
    c.company_id,
    c.company_name,
    c.processing_status as company_status,
    COUNT(s.id) as sections_created,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as sections_approved,
    COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as sections_failed,
    ROUND(
        COUNT(CASE WHEN s.status = 'approved' THEN 1 END) * 100.0 / 20, 2
    ) as completion_percentage,
    c.total_files,
    c.total_chunks,
    c.created_at,
    MAX(s.approved_at) as last_section_approved
FROM dd_companies c
LEFT JOIN dd_sections s ON c.company_id = s.company_id
GROUP BY c.company_id, c.company_name, c.processing_status, c.total_files, c.total_chunks, c.created_at;

-- Sample data queries (for testing)
-- SELECT * FROM dd_company_progress;
-- SELECT * FROM dd_sections WHERE company_id = 'your_company_id' ORDER BY section_number;
-- SELECT company_name, completion_percentage FROM dd_company_progress WHERE completion_percentage > 50;
