#!/usr/bin/env python3
"""
Check what users exist in the database
"""

import sys
import os
sys.path.append('backend')

# Import MongoDB modules
try:
    from mongo_db import mongo
    from datetime import datetime
    
    def check_users():
        """Check existing users in database"""
        # Connect to MongoDB
        mongodb_uri = os.getenv('MONGODB_URI') or "mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0"
            
        # Connect
        connected = mongo.connect(mongodb_uri)
        if not connected:
            print("ERROR: Failed to connect to MongoDB")
            return False
            
        print("Connected to MongoDB successfully")
        
        # Get all users
        users = list(mongo.db.users.find())
        
        print(f"\nFound {len(users)} users in database:")
        for user in users:
            print(f"- Email: {user.get('email')}")
            print(f"  Name: {user.get('name')}")
            print(f"  Role: {user.get('role')}")
            print(f"  Is Admin: {user.get('is_admin')}")
            password = user.get('password')
            if password:
                print(f"  Password Hash: {password[:50]}...")
            else:
                print(f"  Password Hash: None")
            print()
            
    if __name__ == "__main__":
        check_users()
        
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're running this from the project root directory")
