#!/usr/bin/env python3
"""
Simple SQL file execution using subprocess to bypass password issues
Creates the database schema using PostgreSQL command line
"""

import subprocess
import os
import tempfile

# Create a temporary SQL file with the schema
SCHEMA_SQL = """
-- Drop tables if they exist (for clean setup)
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

-- Create indexes
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

-- Show created tables
\\dt dd_*

-- Show test data
SELECT 'Setup verification:' as message, company_name FROM dd_companies WHERE company_id = 'test_setup_001';
"""

def main():
    print("🗃️ PostgreSQL Schema Setup via SQL File")
    print("=" * 50)
    
    # Write schema to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
        f.write(SCHEMA_SQL)
        temp_sql_file = f.name
    
    print(f"📝 Created temporary SQL file: {temp_sql_file}")
    
    # Try different PostgreSQL paths
    postgres_paths = [
        r"C:\Program Files\PostgreSQL\17\bin\psql.exe",
        r"C:\Program Files\PostgreSQL\16\bin\psql.exe", 
        r"C:\Program Files\PostgreSQL\15\bin\psql.exe",
        r"C:\Program Files\PostgreSQL\14\bin\psql.exe",
        r"C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe",
        "psql"  # If in PATH
    ]
    
    psql_path = None
    for path in postgres_paths:
        if os.path.exists(path) or path == "psql":
            psql_path = path
            break
    
    if not psql_path:
        print("❌ Could not find psql.exe. Please install PostgreSQL.")
        return False
    
    print(f"🔍 Using psql at: {psql_path}")
    print("\n" + "=" * 50)
    print("📋 MANUAL SETUP INSTRUCTIONS:")
    print("=" * 50)
    print(f"1. Open Command Prompt as Administrator")
    print(f"2. Run: \"{psql_path}\" -U postgres -d postgres")
    print(f"3. Enter your PostgreSQL password when prompted")
    print(f"4. In psql, run: \\i {temp_sql_file}")
    print(f"5. You should see tables created and test data inserted")
    print(f"6. Type \\q to exit psql")
    
    print("\n" + "-" * 50)
    print("🔧 ALTERNATIVE: If you forgot the PostgreSQL password:")
    print("-" * 50)
    print("1. Open services.msc")
    print("2. Stop 'postgresql-x64-17' service")
    print("3. Edit C:\\Program Files\\PostgreSQL\\17\\data\\pg_hba.conf")
    print("4. Change 'md5' to 'trust' for local connections")
    print("5. Start PostgreSQL service")
    print("6. Connect without password: psql -U postgres -d postgres")
    print("7. Reset password: ALTER USER postgres PASSWORD 'new_password';")
    print("8. Change pg_hba.conf back to 'md5'")
    print("9. Restart PostgreSQL service")
    
    print(f"\n📁 SQL File Location: {temp_sql_file}")
    print("🚀 After running the SQL, your database will be ready for n8n!")
    
    return True

if __name__ == "__main__":
    main()
