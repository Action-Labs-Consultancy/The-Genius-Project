#!/usr/bin/env python3
"""
Script to create the section1_memory table for the Section 1 workflow
This isolates the Section 1 memory from the main company_data table
"""
import psycopg2
import sys

def create_section1_memory_table():
    """Create the dedicated section1_memory table"""
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host="localhost",
            database="due_diligence",
            user="postgres",
            password="your_password"  # You'll need to update this
        )
        
        cursor = conn.cursor()
        
        # Create the section1_memory table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS section1_memory (
            id VARCHAR(255) PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL,
            message_id VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        cursor.execute(create_table_sql)
        
        # Create indexes
        index_sql = [
            "CREATE INDEX IF NOT EXISTS idx_section1_memory_session_id ON section1_memory(session_id);",
            "CREATE INDEX IF NOT EXISTS idx_section1_memory_created_at ON section1_memory(created_at);"
        ]
        
        for sql in index_sql:
            cursor.execute(sql)
        
        # Insert test record
        test_insert_sql = """
        INSERT INTO section1_memory (id, session_id, message_id, role, content, metadata) 
        VALUES ('test_001', 'section1_generation', 'msg_001', 'system', 'Section 1 memory table initialized', '{}')
        ON CONFLICT (id) DO NOTHING;
        """
        
        cursor.execute(test_insert_sql)
        
        # Commit changes
        conn.commit()
        
        print("✅ Section 1 memory table created successfully!")
        print("✅ Indexes created")
        print("✅ Test record inserted")
        
        # Verify table exists
        cursor.execute("SELECT COUNT(*) FROM section1_memory;")
        count = cursor.fetchone()[0]
        print(f"✅ Table verified - {count} records found")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ General error: {e}")
        return False

if __name__ == "__main__":
    print("Creating Section 1 memory table...")
    success = create_section1_memory_table()
    sys.exit(0 if success else 1)
