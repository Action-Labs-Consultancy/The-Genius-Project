-- Section 2 Due Diligence Database Setup
-- This creates a dedicated database for Section 2 (Legal Disclaimers) workflow

-- Create dedicated database for Section 2
CREATE DATABASE section2_due_diligence;

-- Connect to the new database
\c section2_due_diligence;

-- Create the main table for Section 2 content
CREATE TABLE IF NOT EXISTS section2_reports (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    legal_disclaimers_reliance_limitations TEXT,
    jurisdiction VARCHAR(255),
    latest_filing_date VARCHAR(100),
    content_length INTEGER,
    generation_method VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create company data table for storing source documents
CREATE TABLE IF NOT EXISTS company_data_section2 (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    folder_id VARCHAR(255),
    content TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processed'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_section2_company_id ON section2_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_section2_company_name ON section2_reports(company_name);
CREATE INDEX IF NOT EXISTS idx_section2_status ON section2_reports(status);
CREATE INDEX IF NOT EXISTS idx_section2_created ON section2_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_company_data_s2_company_id ON company_data_section2(company_id);
CREATE INDEX IF NOT EXISTS idx_company_data_s2_processed ON company_data_section2(processed_at);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_section2_reports_updated_at 
    BEFORE UPDATE ON section2_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for Section 2 status monitoring
CREATE OR REPLACE VIEW section2_status AS
SELECT 
    id,
    company_id,
    company_name,
    jurisdiction,
    status,
    CASE 
        WHEN legal_disclaimers_reliance_limitations IS NOT NULL 
             AND legal_disclaimers_reliance_limitations != '' 
        THEN 'Completed' 
        ELSE 'Pending' 
    END AS section_status,
    content_length,
    generation_method,
    created_at,
    updated_at
FROM section2_reports
ORDER BY created_at DESC;

-- Sample test data (optional - remove in production)
INSERT INTO company_data_section2 (company_id, company_name, content) VALUES 
('TEST-001', 'Mirriad Advertising plc', 'Mirriad Advertising plc is a technology company incorporated in England and Wales. The company specializes in advertising technology and digital marketing solutions.')
ON CONFLICT (company_id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE section2_due_diligence TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Show table structure for verification
\d section2_reports;
\d company_data_section2;

-- Show sample status
SELECT * FROM section2_status;

PRINT 'Section 2 Due Diligence database setup completed successfully!';
