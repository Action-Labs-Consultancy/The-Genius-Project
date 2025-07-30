#!/usr/bin/env python3
"""
LAN Network Test Script
Run this script from another device on the LAN to test connectivity
"""
import requests
import json
import sys

def test_lan_connectivity():
    """Test LAN connectivity to the backend server"""
    host_ip = "192.168.100.63"
    port = "10000"
    base_url = f"http://{host_ip}:{port}"
    
    print(f"🔍 Testing LAN connectivity to {base_url}")
    print("=" * 50)
    
    # Test 1: Basic network test
    try:
        print("1. Testing basic network connectivity...")
        response = requests.get(f"{base_url}/network-test", timeout=10)
        if response.status_code == 200:
            print("✅ Basic connectivity: SUCCESS")
            data = response.json()
            print(f"   Server IP: {data['server_info']['server_ip']}")
            print(f"   Your IP: {data['server_info']['client_ip']}")
        else:
            print(f"❌ Basic connectivity: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Basic connectivity: FAILED - {e}")
        return False
    
    # Test 2: Agents endpoint
    try:
        print("\n2. Testing agents endpoint...")
        brain_id = "68824a796a891c1979852a61"
        response = requests.get(f"{base_url}/api/brains/{brain_id}/agents", timeout=10)
        if response.status_code == 200:
            data = response.json()
            agent_count = len(data.get('data', []))
            print(f"✅ Agents endpoint: SUCCESS ({agent_count} agents found)")
        else:
            print(f"❌ Agents endpoint: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Agents endpoint: FAILED - {e}")
    
    # Test 3: All brains endpoint
    try:
        print("\n3. Testing brains endpoint...")
        response = requests.get(f"{base_url}/api/brains", timeout=10)
        if response.status_code == 200:
            data = response.json()
            brain_count = len(data.get('data', []))
            print(f"✅ Brains endpoint: SUCCESS ({brain_count} brains found)")
        else:
            print(f"❌ Brains endpoint: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Brains endpoint: FAILED - {e}")
    
    print("\n" + "=" * 50)
    print("✅ LAN connectivity test completed!")
    print("\nIf any tests failed, check:")
    print("- Network connectivity between devices")
    print("- Router firewall settings")
    print("- Device firewall settings")
    return True

if __name__ == "__main__":
    test_lan_connectivity()
