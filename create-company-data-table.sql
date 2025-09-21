-- Create comprehensive company data table
-- This replaces the simple pdf_data table with a more complete structure

-- Drop the old table if you want to start fresh
-- DROP TABLE IF EXISTS pdf_data;

-- Create the new comprehensive company data table
CREATE TABLE IF NOT EXISTS company_data (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_id VARCHAR(255) NOT NULL,
    folder_id VARCHAR(255) NOT NULL,
    content TEXT,
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
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_data_company_id ON company_data(company_id);
CREATE INDEX IF NOT EXISTS idx_company_data_company_name ON company_data(company_name);
CREATE INDEX IF NOT EXISTS idx_company_data_folder_id ON company_data(folder_id);
CREATE INDEX IF NOT EXISTS idx_company_data_processed_at ON company_data(processed_at);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_data_updated_at 
    BEFORE UPDATE ON company_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easy querying of company summaries
CREATE OR REPLACE VIEW company_summary AS
SELECT 
    company_id,
    company_name,
    primary_website,
    primary_email,
    primary_phone,
    primary_address,
    COUNT(*) as total_files,
    MAX(processed_at) as last_processed,
    SUM(file_size) as total_file_size
FROM company_data
GROUP BY company_id, company_name, primary_website, primary_email, primary_phone, primary_address;

-- Show the table structure
\d company_data;

-- Show some example queries
/*
-- Get all companies with their basic info
SELECT company_name, primary_website, primary_email, total_files 
FROM company_summary 
ORDER BY company_name;

-- Get all files for a specific company
SELECT file_name, primary_website, processed_at 
FROM company_data 
WHERE company_name = 'YourCompanyName' 
ORDER BY processed_at DESC;

-- Search for companies with specific websites
SELECT DISTINCT company_name, primary_website 
FROM company_data 
WHERE primary_website IS NOT NULL 
ORDER BY company_name;

-- Get companies processed today
SELECT company_name, COUNT(*) as files_processed
FROM company_data 
WHERE DATE(processed_at) = CURRENT_DATE
GROUP BY company_name;
*/
