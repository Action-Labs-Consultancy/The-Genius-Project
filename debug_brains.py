#!/usr/bin/env python3
"""
Debug script to check brain visibility across LAN
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.append('backend')

def check_mongodb_connection():
    """Check MongoDB connection and brain count"""
    try:
        from mongo_db import mongo
        
        # Test connection
        if mongo.db is None:
            print("❌ MongoDB not connected")
            return False
            
        # Get brains collection
        brains_collection = mongo.get_collection('brains')
        brain_count = brains_collection.count_documents({})
        
        print(f"✅ MongoDB connected successfully")
        print(f"📊 Total brains in database: {brain_count}")
        
        # List first few brains
        brains = list(brains_collection.find().limit(5))
        if brains:
            print("\n🧠 Sample brains:")
            for brain in brains:
                print(f"  - {brain.get('name', 'Unknown')} (ID: {brain['_id']})")
        else:
            print("\n⚠️  No brains found in database")
            
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def check_environment_config():
    """Check environment configuration"""
    print("\n🔧 Environment Configuration:")
    
    # Check MongoDB URI
    mongo_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI')
    if mongo_uri:
        # Mask sensitive parts but show structure
        masked_uri = mongo_uri.replace(mongo_uri.split('@')[0].split('//')[1], '***:***')
        print(f"  MongoDB URI: {masked_uri}")
    else:
        print("  ❌ MongoDB URI not configured")
    
    # Check CORS settings
    cors_origins = os.getenv('CORS_ORIGINS', 'Not set')
    print(f"  CORS Origins: {cors_origins}")
    
    # Check port
    port = os.getenv('PORT', '5000')
    print(f"  Backend Port: {port}")

def main():
    print("🔍 GENIUS PROJECT - BRAIN VISIBILITY DEBUG")
    print("=" * 50)
    
    # Check environment
    check_environment_config()
    
    # Check MongoDB
    print("\n" + "=" * 50)
    check_mongodb_connection()
    
    print("\n" + "=" * 50)
    print("🎯 DIAGNOSIS:")
    print("If brains are not visible across LAN devices:")
    print("1. Ensure all devices use the SAME MongoDB URI")
    print("2. Ensure all devices can access the backend server")
    print("3. Check CORS settings for LAN access")
    print("4. Verify all backends are running on the same port")

if __name__ == "__main__":
    main()
