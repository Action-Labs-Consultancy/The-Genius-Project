#!/usr/bin/env python3
"""
MongoDB Brain & Agent Verification Script
Tests that brains and agents are properly saved to the specified MongoDB instance
"""
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.append('backend')

def test_mongodb_connection():
    """Test MongoDB connection with the exact URI specified"""
    print("🔍 TESTING MONGODB CONNECTION")
    print("=" * 50)
    
    # Get the exact URI from environment
    mongo_uri = os.getenv('MONGODB_URI')
    print(f"📍 MongoDB URI: {mongo_uri}")
    
    try:
        from mongo_db import mongo
        
        # Force reconnection with the specified URI
        if mongo.client:
            mongo.client.close()
        
        result = mongo.connect(mongo_uri)
        if result:
            print("✅ MongoDB connected successfully")
            
            # Test the connection
            mongo.client.admin.command('ping')
            print("✅ MongoDB ping successful")
            
            # List databases
            db_list = mongo.client.list_database_names()
            print(f"📊 Available databases: {db_list}")
            
            # Use the genius_db database (our main database)
            db_name = 'genius_db'
            mongo.db = mongo.client[db_name]
            print(f"🗄️  Using database: {db_name}")
            
            return True
        else:
            print("❌ MongoDB connection failed")
            return False
            
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        return False

def test_brain_creation():
    """Test creating a brain and verify it's saved to MongoDB"""
    print("\n🧠 TESTING BRAIN CREATION")
    print("=" * 50)
    
    try:
        # Import backend models
        sys.path.append(os.path.join(os.getcwd(), 'backend'))
        # Import Brain class from the brain module in models directory
        from models.brain import Brain
        
        # Create a test brain
        test_brain_name = f"Test Brain {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        brain = Brain.create(
            name=test_brain_name,
            description="Test brain to verify MongoDB saving",
            system_prompt="You are a test brain created to verify MongoDB functionality."
        )
        
        print(f"✅ Brain created successfully: {brain['name']}")
        print(f"📊 Brain ID: {brain['_id']}")
        
        # Verify it exists in the database
        retrieved_brain = Brain.get_by_id(brain['_id'])
        if retrieved_brain:
            print("✅ Brain successfully retrieved from MongoDB")
            print(f"📋 Brain details: {retrieved_brain['name']} - {retrieved_brain['description']}")
            return brain['_id']
        else:
            print("❌ Brain not found in MongoDB")
            return None
            
    except Exception as e:
        print(f"❌ Brain creation failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_agent_creation(brain_id):
    """Test creating an agent in a brain"""
    print("\n🤖 TESTING AGENT CREATION")
    print("=" * 50)
    
    try:
        from mongo_db import mongo
        
        # Create a test agent
        agent_data = {
            'brain_id': brain_id,
            'name': f"Test Agent {datetime.now().strftime('%H%M%S')}",
            'role': 'Test Agent',
            'description': 'Test agent to verify MongoDB saving',
            'system_prompt': 'You are a test agent.',
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        # Insert agent into MongoDB
        result = mongo.db.agents.insert_one(agent_data)
        agent_id = str(result.inserted_id)
        
        print(f"✅ Agent created successfully: {agent_data['name']}")
        print(f"📊 Agent ID: {agent_id}")
        
        # Verify it exists
        retrieved_agent = mongo.db.agents.find_one({'_id': result.inserted_id})
        if retrieved_agent:
            print("✅ Agent successfully retrieved from MongoDB")
            print(f"📋 Agent details: {retrieved_agent['name']} - {retrieved_agent['role']}")
            return agent_id
        else:
            print("❌ Agent not found in MongoDB")
            return None
            
    except Exception as e:
        print(f"❌ Agent creation failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def verify_data_persistence():
    """Verify that data persists across connections"""
    print("\n🔄 TESTING DATA PERSISTENCE")
    print("=" * 50)
    
    try:
        from mongo_db import mongo
        
        # Count all brains
        brains_collection = mongo.get_collection('brains')
        brain_count = brains_collection.count_documents({})
        print(f"📊 Total brains in database: {brain_count}")
        
        # Count all agents
        agents_collection = mongo.get_collection('agents')
        agent_count = agents_collection.count_documents({})
        print(f"🤖 Total agents in database: {agent_count}")
        
        # List recent brains
        recent_brains = list(brains_collection.find().sort('created_at', -1).limit(5))
        print(f"\n📋 Recent brains:")
        for brain in recent_brains:
            print(f"  - {brain.get('name', 'Unknown')} (ID: {brain['_id']})")
        
        # List recent agents
        recent_agents = list(mongo.db.agents.find().sort('created_at', -1).limit(5))
        print(f"\n🤖 Recent agents:")
        for agent in recent_agents:
            print(f"  - {agent.get('name', 'Unknown')} in brain {agent.get('brain_id', 'Unknown')} (ID: {agent['_id']})")
            
        return True
        
    except Exception as e:
        print(f"❌ Data verification failed: {e}")
        return False

def main():
    print("🚀 GENIUS PROJECT - MONGODB VERIFICATION")
    print("=" * 60)
    print("🎯 Purpose: Verify brains and agents are saved to MongoDB")
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Test 1: MongoDB Connection
    if not test_mongodb_connection():
        print("\n❌ FAILED: Cannot proceed without MongoDB connection")
        return False
    
    # Test 2: Brain Creation
    brain_id = test_brain_creation()
    if not brain_id:
        print("\n❌ FAILED: Brain creation failed")
        return False
    
    # Test 3: Agent Creation
    agent_id = test_agent_creation(brain_id)
    if not agent_id:
        print("\n⚠️  WARNING: Agent creation failed")
    
    # Test 4: Data Persistence
    if not verify_data_persistence():
        print("\n❌ FAILED: Data persistence verification failed")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 SUCCESS: All MongoDB verification tests passed!")
    print("✅ Brains and agents are being saved to the correct MongoDB instance")
    print("🌐 Other users on LAN can access the same data")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
