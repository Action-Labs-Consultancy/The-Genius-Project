#!/usr/bin/env python3

import os
from dotenv import load_dotenv
from mongo_db import mongo, MongoUser
import bcrypt

def create_test_hr_user():
    """Create a test HR user with proper password hashing."""
    
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    mongo.connect()
    
    # User details
    email = "testhr@example.com"
    password = "testhr123"
    name = "Test HR User"
    
    print(f"Creating HR user: {email}")
    
    # Check if user already exists
    existing_user = MongoUser.find_by_email(email)
    if existing_user:
        print(f"User {email} already exists. Deleting and recreating...")
        collection = mongo.get_collection('users')
        collection.delete_one({'email': email})
    
    # Hash the password properly
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    print(f"Generated password hash: {password_hash}")
    print(f"Hash type: {type(password_hash)}")
    print(f"Hash length: {len(password_hash)}")
    
    # Create user document
    user_doc = {
        'name': name,
        'email': email,
        'password_hash': password_hash,
        'role': 'hr',
        'user_type': 'employee',
        'department': 'HR',
        'is_admin': False,
        'marketing_role': '',
        'needs_password_reset': False
    }
    
    # Insert user into database
    collection = mongo.get_collection('users')
    result = collection.insert_one(user_doc)
    
    print(f"✅ Created user successfully!")
    print(f"User ID: {result.inserted_id}")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Role: hr")
    print(f"Department: HR")
    
    # Verify the user was created and can be found
    created_user = MongoUser.find_by_email(email)
    if created_user:
        print(f"✅ User verification successful!")
        print(f"Found user: {created_user.get('name')}")
        print(f"Has password_hash: {bool(created_user.get('password_hash'))}")
        
        # Test password verification
        if MongoUser.verify_password(created_user, password):
            print(f"✅ Password verification test PASSED!")
        else:
            print(f"❌ Password verification test FAILED!")
    else:
        print(f"❌ User verification failed - user not found!")
    
    return email, password

if __name__ == "__main__":
    email, password = create_test_hr_user()
    print(f"\n🎯 NEW USER CREDENTIALS:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"\nTry logging in with these credentials!")
