#!/usr/bin/env python3
"""
Interactive PostgreSQL Setup for n8n Due Diligence System
Prompts for database credentials and sets up the schema
"""

import psycopg2
import sys
import getpass
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_db_config():
    """Interactively get database configuration"""
    print("🔧 Database Configuration")
    print("-" * 30)
    
    host = input("PostgreSQL Host [localhost]: ").strip() or 'localhost'
    port = input("PostgreSQL Port [5432]: ").strip() or '5432'
    user = input("PostgreSQL User [postgres]: ").strip() or 'postgres'
    password = getpass.getpass("PostgreSQL Password: ")
    
    return {
        'host': host,
        'port': int(port),
        'user': user,
        'password': password
    }

def test_connection(config):
    """Test database connection"""
    try:
        conn = psycopg2.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database='postgres'
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        print(f"✅ PostgreSQL connection successful")
        print(f"📊 Version: {version[:80]}...")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def create_schema(config):
    """Create the n8n due diligence schema"""
    
    schema_sql = """
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

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_dd_companies_company_id ON dd_companies(company_id);
    CREATE INDEX IF NOT EXISTS idx_dd_companies_status ON dd_companies(processing_status);
    CREATE INDEX IF NOT EXISTS idx_dd_sections_company_id ON dd_sections(company_id);
    CREATE INDEX IF NOT EXISTS idx_dd_sections_status ON dd_sections(status);
    CREATE INDEX IF NOT EXISTS idx_dd_sections_company_section ON dd_sections(company_id, section_number);
    CREATE INDEX IF NOT EXISTS idx_dd_reports_company_id ON dd_reports(company_id);
    CREATE INDEX IF NOT EXISTS idx_dd_reports_status ON dd_reports(status);
    """
    
    try:
        # Use the postgres database (should always exist)
        conn = psycopg2.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database='postgres'  # Connect to default database
        )
        cursor = conn.cursor()
        
        # Execute schema creation
        cursor.execute(schema_sql)
        conn.commit()
        
        # Verify tables
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' AND tablename LIKE 'dd_%'
            ORDER BY tablename
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"✅ Created {len(tables)} tables: {', '.join(tables)}")
        
        # Test data insertion
        cursor.execute("""
            INSERT INTO dd_companies (company_id, company_name, folder_id, folder_name) 
            VALUES ('setup_test_001', 'Setup Test Company', 'folder_001', 'Test Folder')
            ON CONFLICT (company_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        """)
        
        cursor.execute("SELECT COUNT(*) FROM dd_companies WHERE company_id = 'setup_test_001'")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print("✅ Database operations working correctly")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Schema creation failed: {e}")
        return False

def main():
    print("🗃️ n8n Due Diligence Database Setup")
    print("=" * 50)
    
    # Get database configuration
    config = get_db_config()
    
    print(f"\n🔍 Testing connection to {config['host']}:{config['port']}...")
    if not test_connection(config):
        print("❌ Connection test failed. Please check your credentials.")
        return False
    
    print(f"\n📊 Creating schema in PostgreSQL...")
    if not create_schema(config):
        print("❌ Schema creation failed.")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 DATABASE SETUP COMPLETE!")
    print("\n✅ Tables created:")
    print("   • dd_companies - Company information and processing status")
    print("   • dd_sections - Individual section content and approvals")  
    print("   • dd_reports - Final report generation and PDF links")
    
    print(f"\n🔧 PostgreSQL Credentials for n8n:")
    print(f"   Host: {config['host']}")
    print(f"   Port: {config['port']}")
    print(f"   Database: postgres")
    print(f"   User: {config['user']}")
    print(f"   Password: [use the same password you just entered]")
    
    print("\n📋 Next Steps:")
    print("1. In n8n, create PostgreSQL credentials with the above settings")
    print("2. Update both workflows to use your PostgreSQL credential ID")
    print("3. Test Section 1 workflow: http://localhost:5678/workflow/IbkJEatTulMiGv9C")
    print("4. Import and test the Master Workflow")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
