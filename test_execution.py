#!/usr/bin/env python3
"""
Test script to execute the Testing Million workflow end-to-end
"""
import json
import requests
import time

def test_workflow_execution():
    print("🚀 Testing 'Testing Million' workflow execution...")
    
    # Get the template first
    try:
        response = requests.get('http://localhost:10000/api/workflow-templates', timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get templates: {response.status_code}")
            return False
        
        templates = response.json()
        testing_million = None
        
        for template in templates:
            if template.get('id') == 'testing-million':
                testing_million = template
                break
        
        if not testing_million:
            print("❌ Testing Million template not found")
            return False
        
        print(f"✅ Found template with {len(testing_million['nodes'])} nodes and {len(testing_million['edges'])} edges")
        
    except Exception as e:
        print(f"❌ Error getting template: {e}")
        return False
    
    # Execute the workflow
    try:
        print("\n🔄 Executing workflow...")
        
        execution_payload = {
            'workflow': testing_million,
            'input_data': {
                'order_id': 'million-123',
                'customer_id': 'cust-456',
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ')
            }
        }
        
        response = requests.post(
            'http://localhost:10000/api/workflows/execute',
            json=execution_payload,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ Execution failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Response text: {response.text}")
            return False
        
        result = response.json()
        
        print(f"✅ Execution completed!")
        print(f"   Status: {result.get('status', 'unknown')}")
        print(f"   Duration: {result.get('duration_ms', 0)}ms")
        print(f"   Executed nodes: {result.get('executed_nodes', 0)}")
        
        execution_log = result.get('execution_log', [])
        print(f"\n📝 Execution Log ({len(execution_log)} entries):")
        
        for i, entry in enumerate(execution_log):
            status_icon = "✅" if entry.get('status') == 'success' else "❌"
            node_type = entry.get('node_type', 'unknown')
            node_id = entry.get('node_id', f'node-{i}')
            
            print(f"   {i+1:2d}. {status_icon} {node_id} ({node_type})")
            
            if entry.get('status') == 'error':
                print(f"       Error: {entry.get('error', 'Unknown error')}")
            elif entry.get('output'):
                output = entry.get('output')
                if isinstance(output, dict):
                    # Show key info from output
                    if 'message' in output:
                        print(f"       Output: {output['message']}")
                    elif len(output) <= 3:
                        print(f"       Output: {output}")
                else:
                    print(f"       Output: {str(output)[:100]}...")
        
        # Check final context
        final_context = result.get('final_context', {})
        print(f"\n🔍 Final Context Variables:")
        for key, value in final_context.items():
            if not key.startswith('_'):  # Skip internal variables
                print(f"   {key}: {str(value)[:100]}...")
        
        # Determine success
        if result.get('status') == 'success':
            print(f"\n✅ Workflow executed successfully!")
            return True
        else:
            print(f"\n❌ Workflow failed: {result.get('error_details', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Execution error: {e}")
        return False

if __name__ == "__main__":
    success = test_workflow_execution()
    exit(0 if success else 1)
