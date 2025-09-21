#!/usr/bin/env python3

import os
from dotenv import load_dotenv
from mongo_db import mongo, MongoUser

def main():
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    mongo.connect()
    
    # Get all users
    users = MongoUser.find_all()
    
    print(f"=== FOUND {len(users)} USERS ===\n")
    
    for i, user in enumerate(users, 1):
        print(f"USER {i}:")
        print(f"  Email: {user.get('email', 'NO_EMAIL')}")
        print(f"  Name: {user.get('name', 'NO_NAME')}")
        print(f"  Role: {user.get('role', 'NO_ROLE')}")
        print(f"  User Type: {user.get('user_type', 'NO_TYPE')}")
        print(f"  Has Password Hash: {bool(user.get('password_hash'))}")
        
        if user.get('password_hash'):
            hash_str = str(user.get('password_hash'))
            print(f"  Hash Length: {len(hash_str)}")
            print(f"  Hash Starts With: {hash_str[:10]}...")
            
            # Try to identify hash type
            if hash_str.startswith('$2b$'):
                print(f"  Hash Type: bcrypt")
            elif len(hash_str) == 32:
                print(f"  Hash Type: possibly MD5")
            elif len(hash_str) == 64:
                print(f"  Hash Type: possibly SHA256")
            else:
                print(f"  Hash Type: unknown")
        
        print(f"  ID: {user.get('_id')}")
        print()

if __name__ == "__main__":
    main()
