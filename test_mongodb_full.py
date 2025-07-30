#!/usr/bin/env python3
"""
MongoDB Setup and Test Script
Ensures proper MongoDB connection and creates test users
"""

import os
import sys
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from datetime import datetime

# MongoDB connection string
MONGO_URI = "mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0"

def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    try:
        print("Testing MongoDB connection...")
        
        # Create client
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ping')
        print("✓ MongoDB connection successful!")
        
        # Get database
        db = client.get_database('genius_db')
        print(f"✓ Connected to database: {db.name}")
        
        # List collections
        collections = db.list_collection_names()
        print(f"✓ Collections found: {collections}")
        
        # Test users collection
        users_collection = db.users
        user_count = users_collection.count_documents({})
        print(f"✓ Users collection has {user_count} documents")
        
        return True, client, db
        
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return False, None, None

def create_test_users(db):
    """Create test users for login testing"""
    try:
        bcrypt = Bcrypt()
        users_collection = db.users
        
        # Remove existing test users
        users_collection.delete_many({'email': {'$in': ['admin@test.com', 'user@test.com']}})
        
        # Create admin user
        admin_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
        admin_user = {
            '_id': 'admin_001',
            'email': 'admin@test.com',
            'password': admin_password,
            'name': 'Admin User',
            'role': 'admin',
            'is_admin': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Create regular user
        user_password = bcrypt.generate_password_hash('user123').decode('utf-8')
        regular_user = {
            '_id': 'user_001',
            'email': 'user@test.com',
            'password': user_password,
            'name': 'Test User',
            'role': 'user',
            'is_admin': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert users
        users_collection.insert_one(admin_user)
        users_collection.insert_one(regular_user)
        
        print("✓ Test users created successfully!")
        print("  Admin: admin@test.com / admin123")
        print("  User:  user@test.com / user123")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to create test users: {e}")
        return False

def test_crud_operations(db):
    """Test basic CRUD operations"""
    try:
        print("\nTesting CRUD operations...")
        
        # Test collection
        test_collection = db.test_crud
        
        # Create
        test_doc = {
            'name': 'Test Document',
            'value': 42,
            'created_at': datetime.utcnow()
        }
        result = test_collection.insert_one(test_doc)
        print(f"✓ Created document with ID: {result.inserted_id}")
        
        # Read
        found_doc = test_collection.find_one({'_id': result.inserted_id})
        print(f"✓ Read document: {found_doc['name']}")
        
        # Update
        test_collection.update_one(
            {'_id': result.inserted_id},
            {'$set': {'value': 100, 'updated_at': datetime.utcnow()}}
        )
        updated_doc = test_collection.find_one({'_id': result.inserted_id})
        print(f"✓ Updated document value: {updated_doc['value']}")
        
        # Delete
        delete_result = test_collection.delete_one({'_id': result.inserted_id})
        print(f"✓ Deleted {delete_result.deleted_count} document(s)")
        
        # Clean up test collection
        test_collection.drop()
        print("✓ Cleaned up test collection")
        
        return True
        
    except Exception as e:
        print(f"✗ CRUD operations failed: {e}")
        return False

def main():
    """Main function to run all tests"""
    print("=" * 60)
    print("MongoDB Connection and Setup Test")
    print("=" * 60)
    
    # Test connection
    success, client, db = test_mongodb_connection()
    if not success:
        print("\n✗ MongoDB connection failed. Please check your connection string.")
        sys.exit(1)
    
    # Test CRUD operations
    if not test_crud_operations(db):
        print("\n✗ CRUD operations failed.")
        sys.exit(1)
    
    # Create test users
    if not create_test_users(db):
        print("\n✗ Failed to create test users.")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✓ All MongoDB tests passed successfully!")
    print("✓ MongoDB is fully connected and operational")
    print("✓ Test users are ready for login testing")
    print("=" * 60)
    
    # Close connection
    client.close()

if __name__ == "__main__":
    main()
