#!/usr/bin/env python3
"""
Comprehensive Workflow Canvas Test Suite
Tests all critical functionality before production launch
"""

import requests
import json
import time

# Test Configuration
BACKEND_URL = 'http://localhost:5001'
FRONTEND_URL = 'http://localhost:3001'  # assuming it moved to 3001

def test_backend_health():
    """Test backend is running and healthy"""
    try:
        print("🔍 Testing backend health...")
        response = requests.get(f'{BACKEND_URL}/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return False

def test_templates_endpoint():
    """Test workflow templates can be loaded"""
    try:
        print("🔍 Testing templates endpoint...")
        response = requests.get(f'{BACKEND_URL}/api/workflow-templates', timeout=5)
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ Templates loaded: {len(templates)} templates")
            
            # Find Testing Million template
            testing_million = None
            for template in templates:
                if template.get('name') == 'Testing Million':
                    testing_million = template
                    break
            
            if testing_million:
                print("✅ 'Testing Million' template found")
                nodes = testing_million.get('nodes', [])
                edges = testing_million.get('edges', [])
                print(f"  - Nodes: {len(nodes)}")
                print(f"  - Edges: {len(edges)}")
                
                # Check email nodes have valid configurations
                email_nodes = [node for node in nodes if node.get('data', {}).get('nodeType') == 'email']
                print(f"  - Email nodes: {len(email_nodes)}")
                
                validation_passed = True
                for i, node in enumerate(email_nodes):
                    config = node.get('data', {}).get('config', {})
                    to_email = config.get('to', '')
                    if not to_email:
                        print(f"    ❌ Email node {i+1}: missing 'to' field")
                        validation_passed = False
                    elif '{{' in to_email or '@' in to_email:
                        print(f"    ✅ Email node {i+1}: valid to='{to_email}'")
                    else:
                        print(f"    ❌ Email node {i+1}: invalid to='{to_email}'")
                        validation_passed = False
                
                return validation_passed
            else:
                print("❌ 'Testing Million' template not found")
                return False
        else:
            print(f"❌ Templates endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Templates test failed: {e}")
        return False

def test_workflow_execution():
    """Test workflow execution endpoint"""
    try:
        print("🔍 Testing workflow execution...")
        
        # Create a simple test workflow
        test_workflow = {
            "nodes": [
                {
                    "id": "start-1",
                    "type": "customNode",
                    "data": {
                        "nodeType": "start",
                        "label": "Start Test",
                        "config": {
                            "triggerType": "manual",
                            "triggerData": '{"test": "data"}'
                        }
                    }
                },
                {
                    "id": "var-1",
                    "type": "customNode", 
                    "data": {
                        "nodeType": "setVariable",
                        "label": "Set Test Variable",
                        "config": {
                            "variableName": "test_var",
                            "value": "hello world"
                        }
                    }
                },
                {
                    "id": "end-1",
                    "type": "customNode",
                    "data": {
                        "nodeType": "end",
                        "label": "End Test",
                        "config": {
                            "status": "success",
                            "returnData": '{"result": "{{test_var}}"}'
                        }
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "var-1"},
                {"id": "e2", "source": "var-1", "target": "end-1"}
            ]
        }
        
        # Test execution endpoint
        response = requests.post(
            f'{BACKEND_URL}/api/workflows/execute',
            json={'workflow': test_workflow, 'input_data': {}},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Workflow execution successful")
            print(f"  - Status: {result.get('status', 'unknown')}")
            print(f"  - Executed nodes: {len(result.get('execution_log', []))}")
            return True
        else:
            print(f"❌ Workflow execution failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  - Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"  - Raw response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Workflow execution test failed: {e}")
        return False

def test_email_validation():
    """Test that email validation allows template variables"""
    try:
        print("🔍 Testing email validation with template variables...")
        
        # Test workflow with template variable email
        email_workflow = {
            "nodes": [
                {
                    "id": "start-1",
                    "type": "customNode",
                    "data": {
                        "nodeType": "start",
                        "label": "Start",
                        "config": {
                            "triggerType": "manual",
                            "triggerData": '{"customer_email": "test@example.com"}'
                        }
                    }
                },
                {
                    "id": "email-1",
                    "type": "customNode",
                    "data": {
                        "nodeType": "email",
                        "label": "Send Email",
                        "config": {
                            "to": "{{customer_email}}",
                            "subject": "Test Email",
                            "body": "This is a test email"
                        }
                    }
                },
                {
                    "id": "end-1",
                    "type": "customNode",
                    "data": {
                        "nodeType": "end",
                        "label": "End",
                        "config": {
                            "status": "success"
                        }
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "email-1"},
                {"id": "e2", "source": "email-1", "target": "end-1"}
            ]
        }
        
        response = requests.post(
            f'{BACKEND_URL}/api/workflows/execute',
            json={'workflow': email_workflow, 'input_data': {}},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Email validation allows template variables")
            return True
        else:
            print(f"❌ Email validation still rejecting template variables: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  - Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"  - Raw response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Email validation test failed: {e}")
        return False

def main():
    """Run all tests and provide summary"""
    print("=" * 60)
    print("🚀 WORKFLOW CANVAS PRE-LAUNCH TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Templates Endpoint", test_templates_endpoint),
        ("Workflow Execution", test_workflow_execution),
        ("Email Validation", test_email_validation),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        print("-" * 40)
        result = test_func()
        results.append((test_name, result))
        time.sleep(1)  # Brief pause between tests
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if not passed:
            all_passed = False
    
    print("-" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED - READY FOR LAUNCH!")
    else:
        print("⚠️  SOME TESTS FAILED - NEEDS ATTENTION")
    print("=" * 60)
    
    return all_passed

if __name__ == '__main__':
    main()
