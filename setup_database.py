#!/usr/bin/env python3
"""
PostgreSQL Database Setup for n8n Due Diligence System
Handles database creation and schema setup with proper error handling
"""

import psycopg2
import sys
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database configuration - UPDATE THESE VALUES
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': 'your_password'  # UPDATE THIS WITH YOUR ACTUAL PASSWORD
}

# SQL Schema to create
SCHEMA_SQL = """
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
"""

def create_database_if_not_exists(db_name='n8n_due_diligence'):
    """Create database if it doesn't exist"""
    try:
        # Connect to PostgreSQL server (not to a specific database)
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database='postgres'  # Connect to default postgres database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        if cursor.fetchone():
            print(f"✅ Database '{db_name}' already exists")
        else:
            # Create database
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            print(f"✅ Created database '{db_name}'")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def setup_schema(db_name='n8n_due_diligence'):
    """Set up the database schema"""
    try:
        # Connect to the target database
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=db_name
        )
        cursor = conn.cursor()
        
        # Execute schema creation
        cursor.execute(SCHEMA_SQL)
        conn.commit()
        
        # Verify tables were created
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' AND tablename LIKE 'dd_%'
            ORDER BY tablename
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        print("✅ Schema created successfully!")
        print(f"📋 Created tables: {', '.join(tables)}")
        
        # Test insert and select
        cursor.execute("""
            INSERT INTO dd_companies (company_id, company_name, folder_id, folder_name) 
            VALUES ('test_setup_001', 'Test Setup Company', 'folder_test_001', 'Test Setup Folder')
            ON CONFLICT (company_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        """)
        
        cursor.execute("SELECT company_name FROM dd_companies WHERE company_id = 'test_setup_001'")
        test_result = cursor.fetchone()
        
        if test_result:
            print(f"✅ Database operations working - Test company: {test_result[0]}")
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error setting up schema: {e}")
        return False

def test_connection():
    """Test database connection"""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database='postgres'
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        print(f"✅ PostgreSQL connection successful")
        print(f"📊 Version: {version[:50]}...")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n🔧 Please update the DB_CONFIG in this script with correct:")
        print("- host (currently: localhost)")
        print("- port (currently: 5432)")
        print("- user (currently: postgres)")
        print("- password (currently: your_password)")
        return False

def main():
    print("🗃️ PostgreSQL Setup for n8n Due Diligence System")
    print("=" * 60)
    
    # Step 1: Test connection
    print("\n1️⃣ Testing PostgreSQL connection...")
    if not test_connection():
        print("\n❌ Please fix connection settings and try again")
        return False
    
    # Step 2: Create database
    print("\n2️⃣ Creating database...")
    if not create_database_if_not_exists():
        print("\n❌ Database creation failed")
        return False
    
    # Step 3: Set up schema
    print("\n3️⃣ Setting up schema...")
    if not setup_schema():
        print("\n❌ Schema setup failed")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 DATABASE SETUP COMPLETE!")
    print("✅ All tables created and ready for n8n workflows")
    print("\n📋 Next steps:")
    print("1. Update PostgreSQL credentials in both n8n workflows")
    print("2. Test the Section 1 workflow")
    print("3. Run the Master Workflow with a test company folder")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
