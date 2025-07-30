#!/usr/bin/env python3
"""
Comprehensive Test Script for LAN Brains Access
Tests all components to ensure brains are visible from another PC on LAN
"""

import requests
import json
import sys
import subprocess
import time
import os
from urllib.parse import urljoin

# Test configurations
LOCAL_IP = "192.168.100.63"
BACKEND_PORT = 10000
FRONTEND_PORT = 3000
API_BASE_URL = f"http://{LOCAL_IP}:{BACKEND_PORT}"

def test_mongodb_connection():
    """Test direct MongoDB connection"""
    print("🔍 Testing MongoDB Connection...")
    
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0")
        db = client.genius_db
        
        # Test connection
        client.admin.command('ping')
        brain_count = db.brains.count_documents({})
        
        print(f"✅ MongoDB connected successfully")
        print(f"📊 Found {brain_count} brains in database")
        
        # Show first few brains
        brains = list(db.brains.find().limit(3))
        for i, brain in enumerate(brains, 1):
            print(f"   {i}. {brain.get('name', 'Unnamed')} - {brain.get('description', 'No description')}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def test_backend_health():
    """Test backend health endpoint"""
    print("\n🏥 Testing Backend Health...")
    
    try:
        health_url = f"{API_BASE_URL}/health"
        response = requests.get(health_url, timeout=5)
        
        if response.status_code == 200:
            print(f"✅ Backend health check passed")
            print(f"📡 Backend accessible at {API_BASE_URL}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {API_BASE_URL}")
        print("💡 Make sure backend is running: cd backend && python3 app.py")
        return False
    except Exception as e:
        print(f"❌ Backend health test failed: {e}")
        return False

def test_brains_api():
    """Test the brains API endpoint"""
    print("\n🧠 Testing Brains API...")
    
    try:
        brains_url = f"{API_BASE_URL}/api/brains"
        response = requests.get(brains_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Brains API working correctly")
            
            # Check response structure
            if 'data' in data and isinstance(data['data'], list):
                brains = data['data']
                print(f"📊 API returned {len(brains)} brains")
                
                # Show sample brains
                for i, brain in enumerate(brains[:3], 1):
                    print(f"   {i}. {brain.get('name', 'Unnamed')} (ID: {brain.get('_id', 'No ID')})")
                    print(f"      Description: {brain.get('description', 'No description')}")
                    print(f"      Documents: {brain.get('document_count', 0)}")
                
                return len(brains) > 0
            else:
                print(f"⚠️  Unexpected API response structure: {list(data.keys())}")
                return False
        else:
            print(f"❌ Brains API failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Brains API test failed: {e}")
        return False

def test_cors_headers():
    """Test CORS headers for LAN access"""
    print("\n🌐 Testing CORS Configuration...")
    
    try:
        # Test preflight request
        preflight_url = f"{API_BASE_URL}/api/brains"
        headers = {
            'Origin': f'http://{LOCAL_IP}:{FRONTEND_PORT}',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(preflight_url, headers=headers, timeout=5)
        
        if response.status_code in [200, 204]:
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            print(f"✅ CORS preflight successful")
            print(f"🌐 CORS Headers:")
            for header, value in cors_headers.items():
                if value:
                    print(f"   {header}: {value}")
            
            # Check if origin is allowed
            allowed_origin = cors_headers.get('Access-Control-Allow-Origin')
            if allowed_origin == '*' or LOCAL_IP in allowed_origin:
                print(f"✅ LAN access should be allowed")
                return True
            else:
                print(f"⚠️  LAN access may be restricted")
                return False
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

def check_frontend_config():
    """Check frontend configuration for LAN access"""
    print("\n⚙️ Checking Frontend Configuration...")
    
    config_file = "/Users/rabab/the-genius-project/frontend/src/config/api.js"
    
    try:
        with open(config_file, 'r') as f:
            config_content = f.read()
        
        print(f"✅ Frontend config file found")
        
        # Check for LAN configuration
        if LOCAL_IP in config_content:
            print(f"✅ LAN IP ({LOCAL_IP}) found in config")
        
        if "REACT_APP_API_URL" in config_content:
            print(f"✅ Environment variable support configured")
        
        if "window.location.hostname.match" in config_content:
            print(f"✅ Auto-detection for LAN access configured")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ Frontend config file not found")
        return False
    except Exception as e:
        print(f"❌ Error checking frontend config: {e}")
        return False

def test_individual_brain():
    """Test retrieving individual brain data"""
    print("\n🧠 Testing Individual Brain Retrieval...")
    
    try:
        # First get list of brains
        brains_response = requests.get(f"{API_BASE_URL}/api/brains", timeout=5)
        if brains_response.status_code != 200:
            print("❌ Could not get brains list for individual test")
            return False
        
        brains_data = brains_response.json()
        if not brains_data.get('data'):
            print("❌ No brains data available for individual test")
            return False
        
        # Test first brain
        first_brain = brains_data['data'][0]
        brain_id = first_brain['_id']
        brain_name = first_brain.get('name', 'Unnamed')
        
        # Test individual brain endpoint
        brain_url = f"{API_BASE_URL}/api/brains/{brain_id}"
        brain_response = requests.get(brain_url, timeout=5)
        
        if brain_response.status_code == 200:
            brain_data = brain_response.json()
            print(f"✅ Individual brain retrieval working")
            print(f"🧠 Retrieved: {brain_name}")
            print(f"📊 Brain has {len(brain_data.get('knowledge_base', []))} documents")
            return True
        else:
            print(f"❌ Individual brain retrieval failed: {brain_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Individual brain test failed: {e}")
        return False

def generate_test_report():
    """Generate comprehensive test report"""
    print("\n📋 Comprehensive LAN Access Test Report")
    print("=" * 60)
    
    tests = [
        ("MongoDB Connection", test_mongodb_connection),
        ("Backend Health", test_backend_health),
        ("Brains API", test_brains_api),
        ("CORS Configuration", test_cors_headers),
        ("Frontend Config", check_frontend_config),
        ("Individual Brain", test_individual_brain)
    ]
    
    results = {}
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📝 Running: {test_name}")
        try:
            result = test_func()
            results[test_name] = result
            if result:
                passed += 1
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {e}")
            results[test_name] = False
    
    # Summary
    print(f"\n📊 Test Summary")
    print("=" * 30)
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print(f"\n🎉 ALL TESTS PASSED!")
        print(f"✅ Brains should be visible from LAN devices")
    else:
        print(f"\n⚠️  Some tests failed. Issues to fix:")
        for test_name, result in results.items():
            if not result:
                print(f"   ❌ {test_name}")
    
    return passed == total

def show_next_steps():
    """Show next steps for testing"""
    print(f"\n🚀 Next Steps for LAN Testing:")
    print("=" * 40)
    
    print(f"\n1. 📱 Ensure Backend is Running:")
    print(f"   cd /Users/rabab/the-genius-project/backend")
    print(f"   python3 app.py")
    print(f"   (Should show: Running on http://192.168.100.63:10000/)")
    
    print(f"\n2. 🌐 Start Frontend with LAN Config:")
    print(f"   cd /Users/rabab/the-genius-project/frontend")
    print(f"   REACT_APP_API_URL=http://192.168.100.63:10000 npm start")
    print(f"   (Should start on http://192.168.100.63:3000)")
    
    print(f"\n3. 🔍 Test from Another PC:")
    print(f"   Open browser: http://192.168.100.63:3000")
    print(f"   Login and go to Brains page")
    print(f"   Should see 7 brains listed")
    
    print(f"\n4. 🐛 Manual API Test from Another PC:")
    print(f"   curl http://192.168.100.63:10000/api/brains")
    print(f"   Should return JSON with brains data")
    
    print(f"\n5. 📋 Verify in MongoDB:")
    print(f"   Use MongoDB Compass")
    print(f"   Connect to: mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/")
    print(f"   Check: genius_db.brains collection")

def main():
    """Main test execution"""
    print("🔧 LAN Brains Access - Comprehensive Test Suite")
    print("=" * 60)
    
    # Run all tests
    all_passed = generate_test_report()
    
    # Show next steps
    show_next_steps()
    
    if all_passed:
        print(f"\n✅ System ready for LAN access testing!")
        return 0
    else:
        print(f"\n⚠️  Some issues found. Please address them before LAN testing.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
