#!/usr/bin/env python3
"""
SQLite Database Setup - No passwords, no configuration needed!
Creates the database file and all required tables instantly.
"""

import sqlite3
import os
from datetime import datetime

def create_sqlite_database():
    print("🚀 Creating SQLite Database for n8n Due Diligence")
    print("=" * 60)
    
    # Database file path
    db_path = os.path.join(os.getcwd(), "n8n_due_diligence.db")
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🗑️  Removed existing database: {db_path}")
    
    # Create new database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("📊 Creating tables...")
    
    # Create companies table
    cursor.execute("""
    CREATE TABLE dd_companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        folder_id TEXT NOT NULL,
        folder_name TEXT,
        processing_status TEXT DEFAULT 'initialized',
        total_files INTEGER DEFAULT 0,
        total_chunks INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create sections table
    cursor.execute("""
    CREATE TABLE dd_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id TEXT NOT NULL,
        section_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        status TEXT DEFAULT 'pending',
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
        UNIQUE(company_id, section_number)
    )
    """)
    
    # Create reports table
    cursor.execute("""
    CREATE TABLE dd_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        folder_id TEXT NOT NULL,
        total_sections INTEGER DEFAULT 20,
        approved_sections INTEGER DEFAULT 0,
        success_rate TEXT DEFAULT '0%',
        pdf_url TEXT,
        pdf_file_id TEXT,
        status TEXT DEFAULT 'processing',
        generated_at TIMESTAMP,
        processing_time_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX idx_dd_companies_company_id ON dd_companies(company_id)")
    cursor.execute("CREATE INDEX idx_dd_companies_status ON dd_companies(processing_status)")
    cursor.execute("CREATE INDEX idx_dd_sections_company_id ON dd_sections(company_id)")
    cursor.execute("CREATE INDEX idx_dd_sections_status ON dd_sections(status)")
    cursor.execute("CREATE INDEX idx_dd_sections_company_section ON dd_sections(company_id, section_number)")
    cursor.execute("CREATE INDEX idx_dd_reports_company_id ON dd_reports(company_id)")
    cursor.execute("CREATE INDEX idx_dd_reports_status ON dd_reports(status)")
    
    # Insert test data
    cursor.execute("""
    INSERT INTO dd_companies (company_id, company_name, folder_id, folder_name)
    VALUES ('test_setup_001', 'Test Setup Company', 'folder_001', 'Test Setup Folder')
    """)
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print("✅ SQLite database created successfully!")
    print(f"📁 Database file: {db_path}")
    print()
    print("=" * 60)
    print("🔧 N8N SQLITE CREDENTIALS")
    print("=" * 60)
    print()
    print("⚡ Use these settings in n8n SQLite credentials:")
    print()
    print(f"   Database File Path: {db_path}")
    print("   (No username, password, host, or port needed!)")
    print()
    print("🎯 After creating SQLite credentials in n8n:")
    print("   1. Note the credential ID (e.g., 'abc123')")
    print("   2. Update both workflow files:")
    print("      - DD_Master_Workflow.json")
    print("      - DD_Section_01_Introduction.json")
    print("   3. Replace 'REPLACE_WITH_POSTGRES_CRED_ID' with your SQLite credential ID")
    print()
    print("✅ No more 'relation does not exist' errors!")
    print("✅ No more password authentication issues!")
    print("✅ Everything works immediately!")
    
    return db_path

if __name__ == "__main__":
    create_sqlite_database()
