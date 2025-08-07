import os
import json
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

BASE_URL = "http://localhost:10000"  # Flask server URL

def test_brain_endpoints():
    print("\n=== Testing Brain API Endpoints ===")
    
    # 1. Get all brains
    print("\n1. Testing GET /brains")
    try:
        response = requests.get(f"{BASE_URL}/brains")
        print(f"Status: {response.status_code}")
        if response.ok:
            brains = response.json()
            print(f"Found {len(brains)} brains:")
            for brain in brains:
                print(f"\n- Brain: {brain.get('name')}")
                print(f"  ID: {brain.get('_id')}")
                print(f"  Status: {'Active' if brain.get('active') else 'Inactive'}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection error: {str(e)}")

    # 2. Try to create a new brain
    print("\n2. Testing POST /brains")
    try:
        test_brain = {
            "name": "Test Brain " + os.urandom(4).hex(),
            "description": "API test brain",
            "personality": "assistant",
            "system_prompt": "You are a helpful assistant for testing purposes."
        }
        response = requests.post(
            f"{BASE_URL}/brains",
            json=test_brain
        )
        print(f"Status: {response.status_code}")
        if response.ok:
            new_brain = response.json()
            print(f"Created brain: {new_brain.get('name')} (ID: {new_brain.get('_id')})")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection error: {str(e)}")

    # 3. Check server status
    print("\n3. Testing GET /health")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        if response.ok:
            print(f"Server health: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection error: {str(e)}")

if __name__ == "__main__":
    test_brain_endpoints()
