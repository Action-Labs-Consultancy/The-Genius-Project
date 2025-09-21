#!/usr/bin/env python3
"""
Simple PostgreSQL table creation script
Creates tables directly in postgres database
"""

import subprocess
import os
import tempfile

def create_tables_with_psql():
    """Create tables using psql command with different connection methods"""
    
    # SQL to create tables
    sql_commands = '''
-- Create the tables for n8n due diligence system
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dd_companies_company_id ON dd_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_sections_company_id ON dd_sections(company_id);
CREATE INDEX IF NOT EXISTS idx_dd_sections_status ON dd_sections(status);
CREATE INDEX IF NOT EXISTS idx_dd_reports_company_id ON dd_reports(company_id);

-- Insert test data
INSERT INTO dd_companies (company_id, company_name, folder_id, folder_name) 
VALUES ('test_001', 'Test Company', 'folder_001', 'Test Folder')
ON CONFLICT (company_id) DO NOTHING;

-- Show success
SELECT 'Tables created successfully!' as result;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'dd_%';
'''

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
        f.write(sql_commands)
        temp_file = f.name

    print("🗃️ Creating PostgreSQL Tables")
    print("=" * 40)
    print(f"📝 SQL file: {temp_file}")
    
    # Try different approaches
    psql_paths = [
        r"C:\Program Files\PostgreSQL\17\bin\psql.exe",
        r"C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "psql"
    ]
    
    for psql_path in psql_paths:
        if os.path.exists(psql_path) or psql_path == "psql":
            print(f"\n🔧 Trying: {psql_path}")
            
            # Try connecting with different methods
            connection_methods = [
                # Try with environment variables (no password prompt)
                {"env": {"PGPASSWORD": "postgres"}, "args": [psql_path, "-U", "postgres", "-d", "postgres", "-f", temp_file]},
                {"env": {"PGPASSWORD": "admin"}, "args": [psql_path, "-U", "postgres", "-d", "postgres", "-f", temp_file]},
                {"env": {"PGPASSWORD": "123456"}, "args": [psql_path, "-U", "postgres", "-d", "postgres", "-f", temp_file]},
                # Try peer authentication (Unix socket style)
                {"env": {}, "args": [psql_path, "-d", "postgres", "-f", temp_file]},
            ]
            
            for i, method in enumerate(connection_methods):
                try:
                    print(f"   Attempt {i+1}: ", end="")
                    result = subprocess.run(
                        method["args"],
                        env={**os.environ, **method["env"]},
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode == 0:
                        print("✅ SUCCESS!")
                        print("📊 Output:")
                        print(result.stdout)
                        if result.stderr:
                            print("⚠️ Warnings:")
                            print(result.stderr)
                        
                        # Clean up
                        os.unlink(temp_file)
                        return True
                    else:
                        print("❌ Failed")
                        if "authentication failed" not in result.stderr:
                            print(f"   Error: {result.stderr[:100]}...")
                
                except subprocess.TimeoutExpired:
                    print("⏱️ Timeout")
                except Exception as e:
                    print(f"❌ Error: {e}")
            
            break
    
    print("\n❌ All connection methods failed")
    print(f"📁 Manual SQL file created: {temp_file}")
    return False

def show_credentials():
    """Show the PostgreSQL credentials to use"""
    print("\n" + "=" * 60)
    print("🔧 POSTGRESQL CREDENTIALS FOR N8N")
    print("=" * 60)
    print()
    print("📋 Use these settings in n8n PostgreSQL credentials:")
    print()
    print("   Host: localhost")
    print("   Port: 5432") 
    print("   Database: postgres")
    print("   User: postgres")
    print("   Password: [your PostgreSQL password]")
    print("   SSL Mode: disable")
    print()
    print("🔍 Common PostgreSQL passwords to try:")
    print("   • postgres")
    print("   • admin") 
    print("   • 123456")
    print("   • password")
    print("   • [blank/empty]")
    print()
    print("💡 If you don't know the password:")
    print("   1. Check password manager or installation notes")
    print("   2. Try the common passwords above")
    print("   3. Reset password using pgAdmin")
    print("   4. Reinstall PostgreSQL if necessary")
    print()
    print("🎯 After creating PostgreSQL credentials in n8n:")
    print("   1. Note the credential ID (e.g., 'abc123')")
    print("   2. Update both workflow files:")
    print("      - DD_Master_Workflow.json")
    print("      - DD_Section_01_Introduction.json")
    print("   3. Replace 'REPLACE_WITH_POSTGRES_CRED_ID' with your ID")

def main():
    print("🚀 PostgreSQL Setup for n8n Due Diligence")
    print("=" * 50)
    
    # Try to create tables automatically
    success = create_tables_with_psql()
    
    if not success:
        print("\n🔧 MANUAL SETUP REQUIRED")
        print("-" * 30)
        print("1. Copy the SQL from create_tables.sql")
        print("2. Open pgAdmin or connect via command line")
        print("3. Execute the SQL in 'postgres' database")
        print("4. Verify tables exist with: \\dt dd_*")
    
    # Always show credentials
    show_credentials()
    
    print("\n✅ After tables are created and credentials configured:")
    print("   The error 'relation public.dd_sections does not exist' will be resolved!")

if __name__ == "__main__":
    main()
