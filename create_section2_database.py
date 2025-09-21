#!/usr/bin/env python3
"""
Create and setup Section 2 Due Diligence Database
This script creates a dedicated database for Section 2 workflow
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

def create_section2_database():
    """Create Section 2 database and setup tables"""
    
    # Database connection parameters for admin connection
    admin_configs = [
        {
            'host': 'localhost',
            'database': 'postgres',  # Connect to postgres db to create new db
            'user': 'postgres',
            'password': 'postgres'
        },
        {
            'host': 'localhost',
            'database': 'postgres',
            'user': 'postgres',
            'password': 'password'
        },
        {
            'host': 'localhost',
            'database': 'postgres',
            'user': 'postgres',
            'password': 'admin'
        }
    ]
    
    for config in admin_configs:
        try:
            print(f"Connecting to PostgreSQL server...")
            
            # Connect to PostgreSQL server
            conn = psycopg2.connect(**config)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Check if section2_due_diligence database exists
            cursor.execute("SELECT datname FROM pg_database WHERE datname = 'section2_due_diligence';")
            db_exists = cursor.fetchone()
            
            if not db_exists:
                print("Creating section2_due_diligence database...")
                cursor.execute("CREATE DATABASE section2_due_diligence;")
                print("✅ Created section2_due_diligence database")
            else:
                print("✅ section2_due_diligence database already exists")
            
            cursor.close()
            conn.close()
            
            # Now connect to the new database and create tables
            section2_config = config.copy()
            section2_config['database'] = 'section2_due_diligence'
            
            print("Setting up tables in section2_due_diligence database...")
            conn = psycopg2.connect(**section2_config)
            cursor = conn.cursor()
            
            # Create section2_reports table
            cursor.execute("""
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
            """)
            
            # Create company_data_section2 table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS company_data_section2 (
                    id SERIAL PRIMARY KEY,
                    company_id VARCHAR(255) UNIQUE NOT NULL,
                    company_name VARCHAR(255) NOT NULL,
                    folder_id VARCHAR(255),
                    content TEXT,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'processed'
                );
            """)
            
            # Create indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_section2_company_id ON section2_reports(company_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_section2_status ON section2_reports(status);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_company_data_s2_company_id ON company_data_section2(company_id);")
            
            # Create update trigger function
            cursor.execute("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            """)
            
            # Create trigger
            cursor.execute("""
                DROP TRIGGER IF EXISTS update_section2_reports_updated_at ON section2_reports;
                CREATE TRIGGER update_section2_reports_updated_at 
                    BEFORE UPDATE ON section2_reports 
                    FOR EACH ROW 
                    EXECUTE FUNCTION update_updated_at_column();
            """)
            
            # Insert test data
            cursor.execute("""
                INSERT INTO company_data_section2 (company_id, company_name, content) VALUES 
                ('MIRRIAD-001', 'Mirriad Advertising plc', 'Mirriad Advertising plc is a technology company incorporated in England and Wales. The company specializes in advertising technology and digital marketing solutions.')
                ON CONFLICT (company_id) DO NOTHING;
            """)
            
            conn.commit()
            
            # Show current table schemas
            cursor.execute("""
                SELECT table_name, column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name IN ('section2_reports', 'company_data_section2')
                ORDER BY table_name, ordinal_position;
            """)
            
            columns = cursor.fetchall()
            print("\n=== SECTION 2 DATABASE SCHEMA ===")
            current_table = None
            for col in columns:
                if col[0] != current_table:
                    print(f"\n📋 Table: {col[0]}")
                    print(f"{'Column':<35} | {'Type':<20} | {'Nullable'}")
                    print("-" * 70)
                    current_table = col[0]
                print(f"{col[1]:<35} | {col[2]:<20} | {col[3]}")
            
            # Show test data
            cursor.execute("SELECT company_id, company_name, status FROM company_data_section2;")
            test_data = cursor.fetchall()
            print(f"\n📊 Test Data: {len(test_data)} companies loaded")
            for row in test_data:
                print(f"  - {row[1]} ({row[0]}) - Status: {row[2]}")
            
            cursor.close()
            conn.close()
            
            print(f"\n🎉 Section 2 database setup completed successfully!")
            print(f"✅ Database: section2_due_diligence")
            print(f"✅ Tables: section2_reports, company_data_section2")
            print(f"✅ Connection config: {section2_config}")
            return True, section2_config
            
        except Exception as e:
            print(f"❌ Failed with config {config}: {e}")
            continue
    
    print("❌ Could not connect to PostgreSQL server with any configuration")
    return False, None

if __name__ == "__main__":
    print("🚀 Creating Section 2 Due Diligence Database...")
    success, config = create_section2_database()
    
    if success:
        print("\n🔥 Ready to update n8n workflow!")
        print("Next steps:")
        print("1. Update n8n PostgreSQL credentials to point to 'section2_due_diligence' database")
        print("2. Update workflow table names to 'section2_reports' and 'company_data_section2'")
        print("3. Test the Section 2 workflow")
    else:
        print("\n💥 Setup failed. Please check PostgreSQL installation and credentials.")
        sys.exit(1)
