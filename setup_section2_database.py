#!/usr/bin/env python3
"""
Setup Section 2 database column for due diligence workflow
"""

import psycopg2
import sys

def setup_section2_database():
    """Add the legal_disclaimers_reliance_limitations column if it doesn't exist"""
    
    # Database connection parameters (update these based on your setup)
    db_configs = [
        {
            'host': 'localhost',
            'database': 'n8n_db', 
            'user': 'postgres',
            'password': 'password'
        },
        {
            'host': 'localhost',
            'database': 'postgres',
            'user': 'postgres', 
            'password': 'postgres'
        },
        {
            'host': 'localhost',
            'database': 'n8n',
            'user': 'postgres',
            'password': 'admin'
        }
    ]
    
    for config in db_configs:
        try:
            print(f"Trying to connect to database: {config['database']}")
            conn = psycopg2.connect(**config)
            cursor = conn.cursor()
            
            # Check if due_diligence_reports table exists
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'due_diligence_reports';
            """)
            
            table_exists = cursor.fetchone()
            if not table_exists:
                print("❌ due_diligence_reports table does not exist")
                print("Creating the table...")
                
                # Create the table with all necessary columns
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS due_diligence_reports (
                        id SERIAL PRIMARY KEY,
                        company_id VARCHAR(255),
                        company_name VARCHAR(255) NOT NULL,
                        legal_disclaimers_reliance_limitations TEXT,
                        status VARCHAR(50) DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                conn.commit()
                print("✅ Created due_diligence_reports table")
            else:
                print("✅ due_diligence_reports table exists")
            
            # Check if legal_disclaimers_reliance_limitations column exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'due_diligence_reports' 
                AND column_name = 'legal_disclaimers_reliance_limitations';
            """)
            
            column_exists = cursor.fetchone()
            if not column_exists:
                print("❌ legal_disclaimers_reliance_limitations column missing")
                print("Adding the column...")
                
                cursor.execute("""
                    ALTER TABLE due_diligence_reports 
                    ADD COLUMN legal_disclaimers_reliance_limitations TEXT;
                """)
                conn.commit()
                print("✅ Added legal_disclaimers_reliance_limitations column")
            else:
                print("✅ legal_disclaimers_reliance_limitations column exists")
            
            # Show current table schema
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'due_diligence_reports' 
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            print("\n=== CURRENT TABLE SCHEMA ===")
            print(f"{'Column Name':<35} | {'Data Type':<20} | {'Nullable'}")
            print("-" * 70)
            for col in columns:
                print(f"{col[0]:<35} | {col[1]:<20} | {col[2]}")
            
            cursor.close()
            conn.close()
            print(f"\n✅ Successfully connected to {config['database']} and set up Section 2!")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to {config['database']}: {e}")
            continue
    
    print("❌ Could not connect to any database configuration")
    return False

if __name__ == "__main__":
    print("🔧 Setting up Section 2 database column...")
    success = setup_section2_database()
    
    if success:
        print("\n🎉 Section 2 database setup complete!")
        print("The workflow can now save legal disclaimers to the database.")
    else:
        print("\n💥 Setup failed. Please check your database configuration.")
        sys.exit(1)
