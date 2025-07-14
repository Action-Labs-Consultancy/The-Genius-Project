#!/usr/bin/env python3
"""
Test MongoDB connection with Render URI format
"""
import os
import sys
sys.path.append('backend')

# Test the original MongoDB URI from local .env
test_uri = "mongodb+srv://rhasan:16nqDFnauBTEDORs@cluster0.tj04exd.mongodb.net/genius_db"

try:
    from pymongo import MongoClient
    
    print(f"Testing MongoDB connection...")
    print(f"URI: {test_uri}")
    
    client = MongoClient(test_uri)
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    
    # Test database access
    db = client.genius_db
    
    # Test a simple operation
    result = db.test_collection.find_one({})
    print("✅ Database access successful!")
    
    client.close()
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print(f"Error type: {type(e)}")
