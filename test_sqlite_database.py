#!/usr/bin/env python3
"""
Test SQLite database to verify everything works
"""

import sqlite3
import os

def test_database():
    print("🔍 Testing SQLite Database")
    print("=" * 40)
    
    db_path = os.path.join(os.getcwd(), "n8n_due_diligence.db")
    
    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Test 1: Check tables exist
        print("📊 Checking tables...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        expected_tables = ['dd_companies', 'dd_sections', 'dd_reports']
        
        for table in expected_tables:
            if table in tables:
                print(f"  ✅ Table {table} exists")
            else:
                print(f"  ❌ Table {table} missing")
                return False
        
        # Test 2: Check test data
        print("📋 Checking test data...")
        cursor.execute("SELECT company_name FROM dd_companies WHERE company_id = 'test_setup_001'")
        result = cursor.fetchone()
        
        if result:
            print(f"  ✅ Test data found: {result[0]}")
        else:
            print("  ❌ Test data missing")
            return False
        
        # Test 3: Test insert operation
        print("💾 Testing insert operation...")
        cursor.execute("""
        INSERT INTO dd_companies (company_id, company_name, folder_id, folder_name)
        VALUES ('test_insert_002', 'Test Insert Company', 'folder_002', 'Test Insert Folder')
        """)
        conn.commit()
        
        cursor.execute("SELECT company_name FROM dd_companies WHERE company_id = 'test_insert_002'")
        result = cursor.fetchone()
        
        if result:
            print(f"  ✅ Insert test successful: {result[0]}")
        else:
            print("  ❌ Insert test failed")
            return False
        
        # Clean up test data
        cursor.execute("DELETE FROM dd_companies WHERE company_id = 'test_insert_002'")
        conn.commit()
        
        conn.close()
        
        print()
        print("🎉 ALL TESTS PASSED!")
        print("✅ SQLite database is working perfectly!")
        print()
        print("🚀 Ready for n8n integration!")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    test_database()
