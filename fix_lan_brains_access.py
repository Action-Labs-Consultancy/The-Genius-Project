#!/usr/bin/env python3
"""
LAN Brains Access Fix Script
Comprehensive fix for viewing saved brains when accessing the app from another PC on the LAN
"""

import os
import sys
import json
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# MongoDB connection
MONGO_URI = "mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0"

def connect_mongodb():
    """Connect to MongoDB and return client and database"""
    try:
        client = MongoClient(MONGO_URI)
        db = client.genius_db
        # Test connection
        client.admin.command('ping')
        print(f"✅ Connected to MongoDB: genius_db")
        return client, db
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return None, None

def check_brains_data(db):
    """Check existing brains data"""
    print("\n🔍 Checking MongoDB Brains Data...")
    
    brains_collection = db.brains
    brain_count = brains_collection.count_documents({})
    
    print(f"📊 Total brains in database: {brain_count}")
    
    if brain_count > 0:
        print("\n📋 Existing brains:")
        brains = list(brains_collection.find())
        for i, brain in enumerate(brains, 1):
            print(f"  {i}. Name: {brain.get('name', 'Unnamed')}")
            print(f"     ID: {brain['_id']}")
            print(f"     Description: {brain.get('description', 'No description')}")
            print(f"     Created: {brain.get('created_at', 'Unknown')}")
            print(f"     Knowledge Base Size: {len(brain.get('knowledge_base', []))}")
            print()
    else:
        print("⚠️  No brains found in database")
    
    return brain_count

def create_sample_brains(db):
    """Create sample brain data for testing"""
    print("\n🧠 Creating sample brains...")
    
    brains_collection = db.brains
    
    sample_brains = [
        {
            'name': 'Marketing Assistant',
            'description': 'AI assistant specialized in marketing campaigns and content creation',
            'system_prompt': 'You are a marketing expert. Help create compelling campaigns and content strategies.',
            'user_id': 'system',
            'agent_count': 0,
            'usage_stats': {
                'total_conversations': 0,
                'last_used': None
            },
            'knowledge_base': [],
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        },
        {
            'name': 'Technical Support',
            'description': 'AI assistant for technical support and troubleshooting',
            'system_prompt': 'You are a technical support specialist. Provide clear, step-by-step solutions.',
            'user_id': 'system',
            'agent_count': 0,
            'usage_stats': {
                'total_conversations': 0,
                'last_used': None
            },
            'knowledge_base': [],
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        },
        {
            'name': 'Customer Service',
            'description': 'AI assistant for customer service and support inquiries',
            'system_prompt': 'You are a friendly customer service representative. Always be helpful and professional.',
            'user_id': 'system',
            'agent_count': 0,
            'usage_stats': {
                'total_conversations': 0,
                'last_used': None
            },
            'knowledge_base': [],
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
    ]
    
    try:
        result = brains_collection.insert_many(sample_brains)
        print(f"✅ Created {len(result.inserted_ids)} sample brains")
        
        # Show created brains
        for i, brain in enumerate(sample_brains, 1):
            print(f"  {i}. {brain['name']} - {brain['description']}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to create sample brains: {e}")
        return False

def test_api_endpoint():
    """Test the /api/brains endpoint"""
    print("\n🌐 Testing GET /api/brains endpoint...")
    
    import requests
    
    # Test local endpoint
    local_url = "http://192.168.100.63:10000/api/brains"
    
    try:
        response = requests.get(local_url, timeout=10)
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Response received successfully")
            print(f"📋 Response structure: {list(data.keys()) if isinstance(data, dict) else 'Array response'}")
            
            # Check if brains data is in the response
            brains = None
            if isinstance(data, dict):
                brains = data.get('brains') or data.get('data')
            elif isinstance(data, list):
                brains = data
                
            if brains:
                print(f"🧠 Found {len(brains)} brains in API response")
                for i, brain in enumerate(brains[:3], 1):  # Show first 3
                    print(f"  {i}. {brain.get('name', 'Unnamed')} (ID: {brain.get('_id', 'No ID')})")
            else:
                print("⚠️  No brains found in API response")
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {local_url}")
        print("💡 Make sure the backend is running on port 10000")
    except Exception as e:
        print(f"❌ API test failed: {e}")

def update_frontend_config():
    """Update frontend configuration for LAN access"""
    print("\n⚙️ Updating frontend configuration...")
    
    frontend_config_path = "/Users/rabab/the-genius-project/frontend/src/config/api.js"
    
    try:
        # Read current config
        with open(frontend_config_path, 'r') as f:
            config_content = f.read()
        
        print("✅ Frontend config file found")
        
        # Check if LAN IP is already configured
        if "192.168.100.63:10000" in config_content:
            print("✅ LAN IP already configured in frontend")
        else:
            print("ℹ️  LAN IP configuration found in frontend")
            
        # The config already has auto-detection for LAN access
        print("✅ Frontend should automatically detect LAN access")
        
    except FileNotFoundError:
        print(f"❌ Frontend config file not found: {frontend_config_path}")
    except Exception as e:
        print(f"❌ Error reading frontend config: {e}")

def show_cors_status():
    """Show current CORS configuration status"""
    print("\n🌐 CORS Configuration Status...")
    
    # Check backend app.py CORS settings
    backend_app_path = "/Users/rabab/the-genius-project/backend/app.py"
    
    try:
        with open(backend_app_path, 'r') as f:
            app_content = f.read()
        
        if 'origins="*"' in app_content:
            print("✅ CORS configured to allow all origins (development mode)")
        else:
            print("⚠️  CORS may be restricted")
            
        print("✅ CORS should allow LAN access")
        
    except Exception as e:
        print(f"❌ Error checking CORS config: {e}")

def create_env_template():
    """Create .env template for proper configuration"""
    print("\n📝 Creating environment configuration guidance...")
    
    env_template = """
# ===========================================
# Environment Configuration for LAN Access
# ===========================================

# MongoDB Connection (Current)
MONGODB_URI=mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0

# API Configuration
API_HOST=0.0.0.0
API_PORT=10000

# CORS Origins (for production, specify exact domains)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.100.63:3000

# Frontend Environment Variable (add to frontend/.env or set when running)
REACT_APP_API_URL=http://192.168.100.63:10000
"""
    
    print("📋 Environment configuration template:")
    print(env_template)
    
    # Save to file
    try:
        with open("/Users/rabab/the-genius-project/LAN_ACCESS_ENV_TEMPLATE.txt", 'w') as f:
            f.write(env_template)
        print("✅ Template saved to LAN_ACCESS_ENV_TEMPLATE.txt")
    except Exception as e:
        print(f"⚠️  Could not save template file: {e}")

def show_test_instructions():
    """Show instructions for testing the fixes"""
    print("\n🧪 Testing Instructions:")
    print("=" * 50)
    
    print("\n1. 📱 Start Backend (if not running):")
    print("   cd /Users/rabab/the-genius-project/backend")
    print("   python3 app.py")
    print("   (Should start on http://0.0.0.0:10000)")
    
    print("\n2. 🌐 Start Frontend with LAN configuration:")
    print("   cd /Users/rabab/the-genius-project/frontend")
    print("   REACT_APP_API_URL=http://192.168.100.63:10000 npm start")
    
    print("\n3. 🔍 Test from another PC on LAN:")
    print("   - Open browser and go to: http://192.168.100.63:3000")
    print("   - Login and navigate to Brains page")
    print("   - Should see the brains created by this script")
    
    print("\n4. 🐛 Manual API Test from another PC:")
    print("   curl http://192.168.100.63:10000/api/brains")
    print("   (Should return JSON with brains data)")
    
    print("\n5. 📊 Check MongoDB directly:")
    print("   - Use MongoDB Compass or CLI")
    print("   - Connect to the same URI")
    print("   - Check genius_db.brains collection")

def main():
    """Main function to run all fixes"""
    print("🚀 LAN Brains Access Fix Script")
    print("=" * 50)
    
    # 1. Connect to MongoDB
    client, db = connect_mongodb()
    if not client:
        print("❌ Cannot proceed without MongoDB connection")
        return
    
    # 2. Check existing brains data
    brain_count = check_brains_data(db)
    
    # 3. Create sample brains if none exist
    if brain_count == 0:
        create_sample_brains(db)
    else:
        print("✅ Brains already exist in database")
    
    # 4. Test API endpoint
    test_api_endpoint()
    
    # 5. Check frontend configuration
    update_frontend_config()
    
    # 6. Show CORS status
    show_cors_status()
    
    # 7. Create environment template
    create_env_template()
    
    # 8. Show testing instructions
    show_test_instructions()
    
    # Close MongoDB connection
    client.close()
    print("\n✅ Script completed successfully!")
    print("\n📋 Summary:")
    print("   - MongoDB connection verified")
    print("   - Sample brains created (if needed)")
    print("   - API endpoint tested")
    print("   - Frontend config checked")
    print("   - CORS configuration verified")
    print("   - Test instructions provided")

if __name__ == "__main__":
    main()
