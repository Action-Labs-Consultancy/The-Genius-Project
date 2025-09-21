#!/usr/bin/env python3
"""
Database setup script for Section 1 workflow
Ensures all required tables exist for the dd_sections workflow
"""
import psycopg2
import sys
import os

def setup_section1_database():
    """Set up all required database tables for Section 1 workflow"""
    try:
        # Connect to PostgreSQL - try common configurations
        connection_configs = [
            {
                "host": "localhost",
                "database": "due_diligence", 
                "user": "postgres",
                "password": "postgres"
            },
            {
                "host": "localhost",
                "database": "postgres",
                "user": "postgres", 
                "password": "postgres"
            }
        ]
        
        conn = None
        for config in connection_configs:
            try:
                conn = psycopg2.connect(**config)
                print(f"✅ Connected to database: {config['database']}")
                break
            except:
                continue
        
        if not conn:
            print("❌ Could not connect to PostgreSQL database")
            return False
            
        cursor = conn.cursor()
        
        # 1. Create langchain_chat_histories table (for Postgres Chat Memory)
        print("Creating langchain_chat_histories table...")
        create_chat_histories = """
        CREATE TABLE IF NOT EXISTS langchain_chat_histories (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL,
            message_id VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            additional_kwargs JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_chat_histories)
        
        # Create indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_histories_session_id ON langchain_chat_histories(session_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_histories_created_at ON langchain_chat_histories(created_at);")
        
        # 2. Ensure company_data table exists (for main workflow integration)
        print("Ensuring company_data table exists...")
        create_company_data = """
        CREATE TABLE IF NOT EXISTS company_data (
            id SERIAL PRIMARY KEY,
            company_id VARCHAR(255) UNIQUE NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            folder_id VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_company_data)
        
        # 3. Ensure due_diligence_reports table exists
        print("Ensuring due_diligence_reports table exists...")
        create_reports_table = """
        CREATE TABLE IF NOT EXISTS due_diligence_reports (
            id SERIAL PRIMARY KEY,
            company_id VARCHAR(255) UNIQUE NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            introduction_engagement_context TEXT,
            methodology_reliability_levels TEXT,
            company_overview TEXT,
            business_model_unit_economics TEXT,
            products_technology TEXT,
            target_market_competitive_set TEXT,
            financials_multi_year TEXT,
            cash_burn_runway TEXT,
            revenue_quality_client_cohorts TEXT,
            partnerships_ecosystem TEXT,
            intellectual_property TEXT,
            legal_regulatory TEXT,
            governance_board_effectiveness TEXT,
            capital_structure_dilution TEXT,
            risk_matrix_mitigations TEXT,
            gaps_uncertainties_disclaimers TEXT,
            scenario_analysis TEXT,
            strategic_options TEXT,
            recommendations_next_steps TEXT,
            source_map_integrity_log TEXT,
            comprehensive_report_url TEXT,
            status VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_reports_table)
        
        # Add foreign key constraint if it doesn't exist
        cursor.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'due_diligence_reports_company_id_fkey'
            ) THEN
                ALTER TABLE due_diligence_reports 
                ADD CONSTRAINT due_diligence_reports_company_id_fkey 
                FOREIGN KEY (company_id) REFERENCES company_data(company_id);
            END IF;
        END $$;
        """)
        
        # Insert test data to verify tables work
        print("Inserting test data...")
        
        # Test chat history entry
        cursor.execute("""
        INSERT INTO langchain_chat_histories (session_id, message_id, role, content)
        VALUES ('test_session', 'test_msg_001', 'system', 'Section 1 workflow initialized')
        ON CONFLICT DO NOTHING;
        """)
        
        # Commit all changes
        conn.commit()
        
        # Verify tables exist
        cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN (
            'langchain_chat_histories', 'company_data', 'due_diligence_reports'
        );
        """)
        
        tables = cursor.fetchall()
        print(f"✅ Verified tables exist: {[t[0] for t in tables]}")
        
        # Test that all tables are accessible
        for table in ['langchain_chat_histories', 'company_data', 'due_diligence_reports']:
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = cursor.fetchone()[0]
            print(f"✅ {table}: {count} records")
        
        cursor.close()
        conn.close()
        
        print("🎉 Database setup completed successfully!")
        print("🎉 All tables ready for Section 1 workflow!")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ General error: {e}")
        return False

if __name__ == "__main__":
    print("Setting up database for Section 1 workflow...")
    success = setup_section1_database()
    sys.exit(0 if success else 1)
