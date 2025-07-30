#!/usr/bin/env python3
"""
Test script to verify templates are loaded correctly in the frontend
"""
import requests
import time

def test_frontend_templates():
    print("🧪 Testing Frontend Template Loading...")
    
    # Test API endpoint first
    try:
        response = requests.get('http://localhost:10000/api/workflow-templates', timeout=5)
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ Backend API: {len(templates)} templates available")
            
            for template in templates:
                print(f"   - {template.get('name', 'Unknown')} ({template.get('id', 'no-id')})")
                print(f"     Nodes: {len(template.get('nodes', []))}, Edges: {len(template.get('edges', []))}")
        else:
            print(f"❌ Backend API error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend API error: {e}")
        return False
    
    # Test frontend
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print(f"✅ Frontend is accessible")
            
            # Check if the WorkflowCanvasAdvanced component is being served
            content = response.text
            if 'react' in content.lower():
                print("✅ React app is running")
            else:
                print("⚠️  React app might not be ready")
                
        else:
            print(f"❌ Frontend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend error: {e}")
        return False
    
    print("\n🎯 Manual Test Instructions:")
    print("1. Open http://localhost:3000/#/workflow-canvas in your browser")
    print("2. Click the 'Templates' button")
    print("3. You should see ONLY the 'Testing Million' template")
    print("4. Load the template and verify it has 28 nodes")
    print("5. Check browser console for API loading messages")
    
    return True

if __name__ == "__main__":
    success = test_frontend_templates()
    exit(0 if success else 1)
