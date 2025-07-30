#!/usr/bin/env python3
"""
Test script for access request functionality
"""

import requests
import json
import time

# API base URL
API_BASE_URL = "http://192.168.100.63:10000"

def test_submit_access_request():
    """Test submitting an access request"""
    print("🧪 Testing access request submission...")
    
    request_data = {
        "name": "John Doe",
        "email": "john.doe@test.com",
        "reason": "Need access to test the marketing AI tools for our company project",
        "requested_role": "employee"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/request-access",
            headers={"Content-Type": "application/json"},
            json=request_data,
            timeout=10
        )
        
        print(f"📤 Submitted request for {request_data['name']}")
        print(f"📬 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Success: {result.get('message', 'Request submitted')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_get_access_requests():
    """Test fetching access requests"""
    print("\n🧪 Testing access request retrieval...")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/access-requests",
            timeout=10
        )
        
        print(f"📬 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            requests_data = response.json()
            print(f"✅ Found {len(requests_data)} access requests")
            
            for req in requests_data:
                print(f"   📋 {req.get('name')} ({req.get('email')}) - Status: {req.get('status', 'pending')}")
                print(f"      Reason: {req.get('reason', 'No reason provided')}")
                print(f"      Created: {req.get('created_at', 'Unknown')}")
                
            return requests_data
        else:
            print(f"❌ Error: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return []

def test_approve_request(request_id):
    """Test approving an access request"""
    print(f"\n🧪 Testing request approval for ID: {request_id}")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/access-requests/{request_id}/approve",
            timeout=10
        )
        
        print(f"📬 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result.get('message', 'Request approved')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    print("🚀 Testing Access Request System")
    print("=" * 50)
    
    # Test 1: Submit an access request
    submit_success = test_submit_access_request()
    
    # Wait a moment for the request to be processed
    time.sleep(1)
    
    # Test 2: Retrieve access requests
    requests_data = test_get_access_requests()
    
    # Test 3: If we have requests, try to approve one
    if requests_data and len(requests_data) > 0:
        first_request = requests_data[0]
        request_id = first_request.get('id')
        if request_id:
            test_approve_request(request_id)
            
            # Check if the status was updated
            print("\n🧪 Checking updated status...")
            updated_requests = test_get_access_requests()
    
    print("\n✨ Access request system test complete!")

if __name__ == "__main__":
    main()
