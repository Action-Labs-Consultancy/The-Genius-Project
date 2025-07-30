#!/usr/bin/env python3
"""
Test script for feature request system
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

import requests
import json

# Configuration
BASE_URL = "http://localhost:10000"
ENDPOINTS = [
    "/api/feature-requests",
    "/api/notifications",
    "/api/admin/feature-requests/stats"
]

def test_endpoints():
    """Test feature request endpoints"""
    print("🧪 Testing Feature Request System")
    print("=" * 50)
    
    for endpoint in ENDPOINTS:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n📡 Testing: {endpoint}")
        
        try:
            response = requests.get(url, timeout=5)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ Endpoint accessible")
                try:
                    data = response.json()
                    print(f"   📄 Response: {json.dumps(data, indent=2)[:200]}...")
                except:
                    print(f"   📄 Response: {response.text[:200]}...")
            elif response.status_code == 401:
                print("   🔒 Authentication required (expected)")
            elif response.status_code == 404:
                print("   ❌ Endpoint not found")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection failed - Backend not running?")
        except requests.exceptions.Timeout:
            print("   ⏱️  Request timed out")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test complete")

if __name__ == "__main__":
    test_endpoints()
