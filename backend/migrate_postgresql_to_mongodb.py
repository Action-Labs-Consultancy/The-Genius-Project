#!/usr/bin/env python3
"""
Migration script to transfer data from PostgreSQL to MongoDB
For The Genius Project
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
import bcrypt

# PostgreSQL imports (optional - only needed if migrating from existing PostgreSQL)
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    print("psycopg2 not installed. PostgreSQL migration will be skipped.")
    POSTGRES_AVAILABLE = False

# MongoDB connection
def connect_mongodb(uri=None):
    """Connect to MongoDB"""
    if not uri:
        uri = os.getenv('MONGODB_URI', 'mongodb+srv://rhasan:16nqDFnauBTEDORs@cluster0.tj04exd.mongodb.net/genius_db')
    
    try:
        client = MongoClient(uri)
        # Extract database name from URI or use default
        if '/' in uri and '/' in uri.split('/')[-1] and uri.split('/')[-1].split('?')[0]:
            db_name = uri.split('/')[-1].split('?')[0]
        else:
            db_name = 'genius_db'
        db = client[db_name]
        
        # Test connection
        client.admin.command('ping')
        print(f"[MongoDB] Connected successfully to {db_name}")
        return client, db
    except Exception as e:
        print(f"[MongoDB] Connection failed: {e}")
        return None, None

# PostgreSQL connection (if available)
def connect_postgresql():
    """Connect to PostgreSQL"""
    if not POSTGRES_AVAILABLE:
        return None
    
    # Try various PostgreSQL connection options
    db_configs = [
        os.getenv('DATABASE_URL'),
        'postgresql://localhost/genius',
        'postgresql://postgres@localhost/genius_db',
        'sqlite:///instance/genius.db'  # SQLite fallback
    ]
    
    for config in db_configs:
        if not config:
            continue
            
        try:
            if config.startswith('sqlite'):
                print(f"[INFO] SQLite database detected: {config}")
                print("[INFO] SQLite to MongoDB migration not implemented in this script.")
                print("[INFO] Please export your SQLite data to CSV and use the CSV import function.")
                return None
                
            # Handle PostgreSQL URLs
            if config.startswith('postgres://'):
                config = config.replace('postgres://', 'postgresql://', 1)
            
            conn = psycopg2.connect(config)
            print(f"[PostgreSQL] Connected successfully")
            return conn
        except Exception as e:
            print(f"[PostgreSQL] Failed to connect with {config}: {e}")
            continue
    
    print("[PostgreSQL] Could not establish connection with any configuration")
    return None

def migrate_users(pg_conn, mongo_db):
    """Migrate users from PostgreSQL to MongoDB"""
    if not pg_conn:
        print("[SKIP] No PostgreSQL connection available for user migration")
        return
    
    try:
        # Get users from PostgreSQL
        cursor = pg_conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, name, email, password_hash, role, user_type, department, 
                   is_admin, client_id, created_at, updated_at 
            FROM users
        """)
        pg_users = cursor.fetchall()
        
        if not pg_users:
            print("[INFO] No users found in PostgreSQL database")
            return
        
        # Insert into MongoDB
        users_collection = mongo_db['users']
        migrated_count = 0
        
        for pg_user in pg_users:
            # Check if user already exists in MongoDB
            existing_user = users_collection.find_one({'email': pg_user['email']})
            if existing_user:
                print(f"[SKIP] User {pg_user['email']} already exists in MongoDB")
                continue
            
            # Convert PostgreSQL user to MongoDB document
            mongo_user = {
                'name': pg_user['name'] or '',
                'email': pg_user['email'],
                'password_hash': pg_user['password_hash'].encode('utf-8') if isinstance(pg_user['password_hash'], str) else pg_user['password_hash'],
                'role': pg_user.get('role', 'user'),
                'user_type': pg_user.get('user_type', pg_user.get('role', 'user')),
                'department': pg_user.get('department', 'General'),
                'is_admin': pg_user.get('is_admin', False),
                'client_id': pg_user.get('client_id'),
                'created_at': pg_user.get('created_at', datetime.utcnow()),
                'updated_at': pg_user.get('updated_at', datetime.utcnow()),
                # Store original PostgreSQL ID for reference
                'original_pg_id': pg_user['id']
            }
            
            # Insert user
            result = users_collection.insert_one(mongo_user)
            migrated_count += 1
            print(f"[MIGRATED] User {pg_user['email']} -> MongoDB ID: {result.inserted_id}")
        
        print(f"[SUCCESS] Migrated {migrated_count} users from PostgreSQL to MongoDB")
        
    except Exception as e:
        print(f"[ERROR] User migration failed: {e}")

def migrate_clients(pg_conn, mongo_db):
    """Migrate clients from PostgreSQL to MongoDB"""
    if not pg_conn:
        print("[SKIP] No PostgreSQL connection available for client migration")
        return
    
    try:
        # Get clients from PostgreSQL
        cursor = pg_conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, name, industry, contact, email, phone, website, 
                   description, status, created_at, updated_at 
            FROM clients
        """)
        pg_clients = cursor.fetchall()
        
        if not pg_clients:
            print("[INFO] No clients found in PostgreSQL database")
            return
        
        # Insert into MongoDB
        clients_collection = mongo_db['clients']
        migrated_count = 0
        
        for pg_client in pg_clients:
            # Check if client already exists in MongoDB
            existing_client = clients_collection.find_one({'name': pg_client['name']})
            if existing_client:
                print(f"[SKIP] Client {pg_client['name']} already exists in MongoDB")
                continue
            
            # Convert PostgreSQL client to MongoDB document
            mongo_client = {
                'name': pg_client['name'] or '',
                'industry': pg_client.get('industry', ''),
                'contact': pg_client.get('contact'),
                'email': pg_client.get('email', ''),
                'phone': pg_client.get('phone', ''),
                'website': pg_client.get('website', ''),
                'description': pg_client.get('description', ''),
                'status': pg_client.get('status', 'active'),
                'created_at': pg_client.get('created_at', datetime.utcnow()),
                'updated_at': pg_client.get('updated_at', datetime.utcnow()),
                # Store original PostgreSQL ID for reference
                'original_pg_id': pg_client['id']
            }
            
            # Insert client
            result = clients_collection.insert_one(mongo_client)
            migrated_count += 1
            print(f"[MIGRATED] Client {pg_client['name']} -> MongoDB ID: {result.inserted_id}")
        
        print(f"[SUCCESS] Migrated {migrated_count} clients from PostgreSQL to MongoDB")
        
    except Exception as e:
        print(f"[ERROR] Client migration failed: {e}")

def create_sample_data(mongo_db):
    """Create sample data in MongoDB if none exists"""
    try:
        # Create sample users
        users_collection = mongo_db['users']
        if users_collection.count_documents({}) == 0:
            print("[INFO] Creating sample users...")
            
            # Admin user
            admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
            admin_user = {
                'name': 'Admin',
                'email': 'admin@example.com',
                'password_hash': admin_password,
                'role': 'admin',
                'user_type': 'admin',
                'department': 'Administration',
                'is_admin': True,
                'client_id': None,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            users_collection.insert_one(admin_user)
            
            # Test user
            test_password = bcrypt.hashpw('testpass'.encode('utf-8'), bcrypt.gensalt())
            test_user = {
                'name': 'Test User',
                'email': 'testuser@example.com',
                'password_hash': test_password,
                'role': 'user',
                'user_type': 'user',
                'department': 'General',
                'is_admin': False,
                'client_id': None,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            users_collection.insert_one(test_user)
            print("[SUCCESS] Created sample users: admin@example.com / admin123, testuser@example.com / testpass")
        
        # Create sample clients
        clients_collection = mongo_db['clients']
        if clients_collection.count_documents({}) == 0:
            print("[INFO] Creating sample clients...")
            
            sample_clients = [
                {
                    'name': 'Action Labs',
                    'email': 'contact@action-labs.ai',
                    'phone': '+1-555-0123',
                    'website': 'https://action-labs.ai',
                    'industry': 'Technology',
                    'contact': None,
                    'description': 'AI-powered development agency',
                    'status': 'active',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                },
                {
                    'name': 'Sample Client',
                    'email': 'client@example.com',
                    'phone': '+1-555-0456',
                    'website': 'https://example.com',
                    'industry': 'Business',
                    'contact': None,
                    'description': 'Sample client for testing',
                    'status': 'active',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            ]
            
            clients_collection.insert_many(sample_clients)
            print("[SUCCESS] Created sample client data")
            
    except Exception as e:
        print(f"[ERROR] Sample data creation failed: {e}")

def main():
    """Main migration function"""
    print("=" * 60)
    print("PostgreSQL to MongoDB Migration Script")
    print("The Genius Project")
    print("=" * 60)
    
    # Connect to MongoDB
    mongo_client, mongo_db = connect_mongodb()
    if not mongo_db:
        print("[FATAL] Could not connect to MongoDB. Exiting.")
        sys.exit(1)
    
    # Connect to PostgreSQL (optional)
    pg_conn = None
    if POSTGRES_AVAILABLE:
        pg_conn = connect_postgresql()
    
    # Perform migrations
    if pg_conn:
        print("\\n[MIGRATION] Starting PostgreSQL to MongoDB migration...")
        migrate_users(pg_conn, mongo_db)
        migrate_clients(pg_conn, mongo_db)
        pg_conn.close()
        print("[INFO] PostgreSQL connection closed")
    else:
        print("\\n[INFO] PostgreSQL migration skipped - no connection available")
    
    # Create sample data if database is empty
    print("\\n[SETUP] Ensuring sample data exists...")
    create_sample_data(mongo_db)
    
    # Close MongoDB connection
    mongo_client.close()
    print("\\n[INFO] MongoDB connection closed")
    print("[SUCCESS] Migration completed!")

if __name__ == "__main__":
    main()
