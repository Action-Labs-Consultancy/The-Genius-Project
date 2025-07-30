#!/usr/bin/env python3
"""
Test "Testing Million" workflow execution
"""

import requests
import json

def test_testing_million_execution():
    """Test execution of the complete Testing Million template"""
    print("🔍 Testing 'Testing Million' workflow execution...")
    
    try:
        # Get the template first
        response = requests.get('http://localhost:5001/api/workflow-templates')
        if response.status_code != 200:
            print(f"❌ Failed to fetch templates: {response.status_code}")
            return False
            
        templates = response.json()
        testing_million = None
        for template in templates:
            if template.get('name') == 'Testing Million':
                testing_million = template
                break
        
        if not testing_million:
            print("❌ Testing Million template not found")
            return False
        
        print(f"✅ Found Testing Million template with {len(testing_million['nodes'])} nodes")
        
        # Execute the workflow
        execution_data = {
            'workflow': {
                'nodes': testing_million['nodes'],
                'edges': testing_million['edges']
            },
            'input_data': {
                'order_id': 'million-test-123',
                'customer_id': 'test-customer-456'
            }
        }
        
        print("🚀 Executing workflow...")
        response = requests.post(
            'http://localhost:5001/api/workflows/execute',
            json=execution_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Workflow execution completed successfully!")
            print(f"  - Status: {result.get('status', 'unknown')}")
            print(f"  - Duration: {result.get('duration_ms', 0)}ms")
            print(f"  - Executed nodes: {result.get('executed_nodes', 0)}")
            print(f"  - Log entries: {len(result.get('execution_log', []))}")
            
            # Check for any validation errors in the log
            execution_log = result.get('execution_log', [])
            validation_errors = []
            successful_nodes = []
            
            for entry in execution_log:
                if entry.get('status') == 'error':
                    validation_errors.append(f"{entry.get('node_id', 'Unknown')}: {entry.get('error', 'Unknown error')}")
                elif entry.get('status') == 'success':
                    successful_nodes.append(entry.get('node_id', 'Unknown'))
            
            if validation_errors:
                print(f"\n⚠️  Validation errors found:")
                for error in validation_errors:
                    print(f"  - {error}")
                return False
            else:
                print(f"✅ All {len(successful_nodes)} nodes executed successfully")
                print("✅ No validation errors - email template variables are working!")
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
        print(f"❌ Test failed with exception: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🧪 TESTING MILLION WORKFLOW EXECUTION TEST")
    print("=" * 60)
    
    success = test_testing_million_execution()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 TESTING MILLION WORKFLOW EXECUTION: PASSED")
        print("✅ Email validation fixes confirmed working!")
    else:
        print("❌ TESTING MILLION WORKFLOW EXECUTION: FAILED")
        print("⚠️  Issues found that need attention")
    print("=" * 60)
