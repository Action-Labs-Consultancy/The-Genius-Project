#!/usr/bin/env python3
"""
Test the orchestrator workflow to debug tool calling issues
"""

import requests
import json
import time
import sys

# n8n configuration
N8N_BASE_URL = "http://localhost:5678"
ORCHESTRATOR_WORKFLOW_ID = "workflow_81"  # The workflow name from the JSON

def test_orchestrator():
    """Test the orchestrator workflow with sample data"""
    
    print("🧪 TESTING ORCHESTRATOR WORKFLOW")
    print("=" * 60)
    
    # Test data
    test_data = {
        "company_id": "TEST_001",
        "company_name": "Test Company Ltd",
        "folder_id": "test_folder",
        "content": "This is test PDF content for the company analysis.",
        "processed_at": "2025-09-01 12:00:00"
    }
    
    print(f"📤 Test Data: {test_data}")
    print()
    
    try:
        # Trigger the workflow
        print("🚀 Triggering orchestrator workflow...")
        
        url = f"{N8N_BASE_URL}/webhook/test"
        response = requests.post(url, json=test_data, timeout=30)
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Workflow triggered successfully!")
            
            # Wait a bit then check database for results
            print("\n⏳ Waiting 10 seconds for initial processing...")
            time.sleep(10)
            
            # Check if AI agent was called
            print("\n🔍 Checking workflow execution...")
            
        else:
            print(f"❌ Failed to trigger workflow: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Error testing orchestrator: {e}")

def check_n8n_status():
    """Check if n8n is running"""
    try:
        response = requests.get(f"{N8N_BASE_URL}/healthz", timeout=5)
        if response.status_code == 200:
            print("✅ n8n is running")
            return True
        else:
            print(f"⚠️ n8n responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ n8n is not accessible: {e}")
        return False

def main():
    print("🔧 ORCHESTRATOR TOOL CALLING DIAGNOSTIC")
    print("=" * 50)
    
    # Check n8n status
    if not check_n8n_status():
        print("\n💡 Make sure n8n is running on localhost:5678")
        return
    
    # Test the orchestrator
    test_orchestrator()
    
    print("\n" + "=" * 50)
    print("🎯 WHAT TO CHECK:")
    print("1. Did the MAIN AI Agent execute?")
    print("2. Were section1 and section2 tools called?") 
    print("3. Check n8n execution logs for tool calling details")
    print("4. Verify Mistral model supports function calling")

if __name__ == "__main__":
    main()
