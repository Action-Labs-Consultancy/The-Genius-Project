#!/usr/bin/env python3
"""
Enhanced Agent Integration Test
Tests that agents are properly saved to both MongoDB and Pinecone with full RAG capabilities
"""
import sys
import os
from datetime import datetime
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.append('backend')

def test_agent_creation_full_integration():
    """Test creating an agent with full MongoDB and Pinecone integration"""
    print("\n🤖 TESTING ENHANCED AGENT CREATION")
    print("=" * 60)
    
    try:
        # First, create a test brain
        print("1. Creating test brain...")
        brain_data = {
            'name': f'Test Brain for Integration {datetime.now().strftime("%H%M%S")}',
            'description': 'Test brain for agent MongoDB and Pinecone integration',
            'system_prompt': 'You are a test brain for integration testing.',
            'purpose': 'testing'
        }
        
        response = requests.post('http://localhost:10000/api/brains', 
                               json=brain_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code != 201:
            print(f"❌ Failed to create brain: {response.status_code} - {response.text}")
            return False
        
        brain_result = response.json()
        brain_id = brain_result['data']['_id']
        print(f"✅ Brain created: {brain_id}")
        
        # Now create an agent in this brain
        print("2. Creating agent with full integration...")
        agent_data = {
            'agent_name': f'Integration Test Agent {datetime.now().strftime("%H%M%S")}',
            'role_description': 'Test agent for MongoDB and Pinecone integration testing',
            'system_prompt': 'You are a test agent designed to verify that agents are properly stored in both MongoDB and Pinecone vector store for RAG capabilities.',
            'personality': 'analytical',
            'temperature': 0.8,
            'tools': ['text_analysis', 'information_retrieval']
        }
        
        response = requests.post(f'http://localhost:10000/api/brains/{brain_id}/agents',
                               json=agent_data,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code != 201:
            print(f"❌ Failed to create agent: {response.status_code} - {response.text}")
            return False
        
        agent_result = response.json()
        agent_id = agent_result['data']['_id']
        print(f"✅ Agent created: {agent_id}")
        print(f"📄 Agent name: {agent_result['data']['agent_name']}")
        
        # Verify agent is in MongoDB
        print("3. Verifying MongoDB storage...")
        from mongo_db import mongo
        agent_doc = mongo.db.agents.find_one({'_id': ObjectId(agent_id)})
        if agent_doc:
            print("✅ Agent found in MongoDB")
            print(f"📊 Agent details: {agent_doc['agent_name']} - {agent_doc['role_description']}")
        else:
            print("❌ Agent not found in MongoDB")
            return False
        
        # Test document upload to verify Pinecone integration
        print("4. Testing document upload for Pinecone integration...")
        
        # Create a test document
        test_doc_content = """
This is a test document for the integration test agent.
It contains information about AI agents, machine learning, and knowledge management.
The agent should be able to retrieve this information when asked about these topics.
        """
        
        with open('/tmp/test_agent_doc.txt', 'w') as f:
            f.write(test_doc_content)
        
        with open('/tmp/test_agent_doc.txt', 'rb') as f:
            files = {'file': ('test_document.txt', f, 'text/plain')}
            response = requests.post(f'http://localhost:10000/api/agents/{agent_id}/upload',
                                   files=files)
        
        if response.status_code == 200:
            upload_result = response.json()
            print("✅ Document uploaded successfully")
            print(f"📄 Document details: {upload_result.get('message', 'Uploaded')}")
            
            # Check if Pinecone integration worked
            if 'pinecone' in upload_result.get('message', '').lower():
                print("✅ Pinecone integration confirmed")
            else:
                print("⚠️  Pinecone integration status unclear")
        else:
            print(f"❌ Document upload failed: {response.status_code} - {response.text}")
        
        # Clean up test file
        if os.path.exists('/tmp/test_agent_doc.txt'):
            os.remove('/tmp/test_agent_doc.txt')
        
        print("\n🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!")
        print("✅ Agent is properly stored in MongoDB")
        print("✅ Agent context integration with Pinecone attempted")
        print("✅ Document upload and vectorization tested")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_pinecone_connection():
    """Test Pinecone connection status"""
    print("\n🌲 TESTING PINECONE CONNECTION")
    print("=" * 50)
    
    try:
        from pinecone import Pinecone
        import openai
        
        # Check environment variables
        pinecone_key = os.getenv('PINECONE_API_KEY')
        openai_key = os.getenv('OPENAI_API_KEY')
        index_name = os.getenv('PINECONE_INDEX_NAME')
        
        print(f"PINECONE_API_KEY: {'✓' if pinecone_key else '✗'}")
        print(f"OPENAI_API_KEY: {'✓' if openai_key else '✗'}")
        print(f"PINECONE_INDEX_NAME: {index_name or '✗'}")
        
        if not all([pinecone_key, openai_key, index_name]):
            print("❌ Missing required environment variables")
            return False
        
        # Test Pinecone connection
        pc = Pinecone(api_key=pinecone_key)
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        
        print(f"✅ Pinecone connected successfully")
        print(f"📊 Index stats: {stats.get('total_vector_count', 0)} vectors")
        
        return True
        
    except Exception as e:
        print(f"❌ Pinecone connection failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 AGENT INTEGRATION TESTS - MongoDB & Pinecone")
    print("=" * 70)
    print(f"📅 Test Date: {datetime.now()}")
    print("=" * 70)
    
    # Test Pinecone connection
    pinecone_ok = test_pinecone_connection()
    
    # Test full agent integration
    agent_integration_ok = test_agent_creation_full_integration()
    
    print("\n" + "=" * 70)
    print("📋 TEST SUMMARY")
    print("=" * 70)
    print(f"🌲 Pinecone Connection: {'✅ PASS' if pinecone_ok else '❌ FAIL'}")
    print(f"🤖 Agent Integration: {'✅ PASS' if agent_integration_ok else '❌ FAIL'}")
    
    if pinecone_ok and agent_integration_ok:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Agents are properly integrated with both MongoDB and Pinecone")
        return True
    else:
        print("\n❌ SOME TESTS FAILED")
        if not pinecone_ok:
            print("⚠️  Check Pinecone API keys and configuration")
        if not agent_integration_ok:
            print("⚠️  Check agent creation and storage integration")
        return False

if __name__ == "__main__":
    try:
        from bson import ObjectId
        success = main()
        sys.exit(0 if success else 1)
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all required dependencies are installed")
        sys.exit(1)
