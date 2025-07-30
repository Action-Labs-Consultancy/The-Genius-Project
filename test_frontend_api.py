#!/usr/bin/env python3
"""
Frontend API configuration test
"""

import requests
import json

def test_frontend_api_endpoints():
    """Test the API endpoints that the frontend uses"""
    print("🧪 Testing Frontend API Integration")
    print("=" * 50)
    
    base_url = "http://192.168.100.63:10000"
    
    # Test 1: Request Access (what the frontend should call)
    print("\n📝 Test 1: Request Access Endpoint")
    request_data = {
        "name": "Frontend API Test",
        "email": "frontend.api.test@example.com",
        "reason": "Testing the frontend API integration after fixes",
        "requested_role": "employee"
    }
    
    try:
        response = requests.post(
            f"{base_url}/request-access",
            headers={"Content-Type": "application/json"},
            json=request_data,
            timeout=10
        )
        
        print(f"📬 Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Success: {result.get('message')}")
            print(f"📋 Request ID: {result.get('data', {}).get('_id')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 2: Get Access Requests (for settings page)
    print("\n📋 Test 2: Get Access Requests Endpoint")
    try:
        response = requests.get(f"{base_url}/api/access-requests", timeout=10)
        
        print(f"📬 Status: {response.status_code}")
        
        if response.status_code == 200:
            requests_data = response.json()
            print(f"✅ Found {len(requests_data)} total requests")
            
            # Show latest requests
            for req in requests_data[-3:]:  # Show last 3 requests
                print(f"   📋 {req.get('name')} ({req.get('email')}) - {req.get('status')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 3: Check CORS (simulating frontend request)
    print("\n🌐 Test 3: CORS Headers Check")
    try:
        response = requests.options(
            f"{base_url}/request-access",
            headers={
                "Origin": "http://192.168.100.63:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=10
        )
        
        print(f"📬 CORS Preflight Status: {response.status_code}")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print("🔒 CORS Headers:")
        for header, value in cors_headers.items():
            print(f"   {header}: {value}")
            
    except Exception as e:
        print(f"❌ CORS Exception: {e}")
    
    print("\n✨ Frontend API integration test complete!")

if __name__ == "__main__":
    test_frontend_api_endpoints()
