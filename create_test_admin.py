#!/usr/bin/env python3
"""
Quick script to create a test admin user for testing the feature request system
"""

import sys
import os
sys.path.append('backend')

import bcrypt
from datetime import datetime

# Import MongoDB modules
try:
    from mongo_db import mongo, MongoUser
    from dotenv import load_dotenv
    
    def create_test_admin():
        """Create a test admin user"""
        # Load environment variables
        load_dotenv()
        
        # Connect to MongoDB
        mongodb_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI')
        if not mongodb_uri:
            print("ERROR: MONGODB_URI not found in environment variables")
            return False
            
        # Connect
        connected = mongo.connect(mongodb_uri)
        if not connected:
            print("ERROR: Failed to connect to MongoDB")
            return False
            
        print("Connected to MongoDB successfully")
        
        # Create test admin user
        test_email = "admin@genius.com"
        test_password = "admin123"
        
        # Check if user already exists
        existing_user = MongoUser.find_by_email(test_email)
        if existing_user:
            print(f"Deleting existing admin user {test_email}...")
            mongo.db.users.delete_one({'email': test_email})
            
        # Create new admin user using the MongoUser model
        try:
            user_doc = MongoUser.create_user(
                name='Test Admin',
                email=test_email,
                password=test_password,
                role='admin',
                is_admin=True
            )
            
            print(f"✅ Test admin user created successfully!")
            print(f"Email: {test_email}")
            print(f"Password: {test_password}")
            return True
        except Exception as e:
            print(f"❌ Failed to create admin user: {e}")
            return False
            
    if __name__ == "__main__":
        create_test_admin()
        
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're running this from the project root directory")
