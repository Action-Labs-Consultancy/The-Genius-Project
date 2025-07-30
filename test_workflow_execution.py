#!/usr/bin/env python3

import requests
import json
import time

# Test workflow execution endpoint
def test_workflow_execution():
    print("Testing Workflow Execution...")
    
    # Test workflow with basic nodes
    test_workflow = {
        "id": "test-workflow",
        "name": "Test Workflow",
        "nodes": [
            {
                "id": "start-1",
                "type": "customNode",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Start",
                    "nodeType": "start",
                    "icon": "Play",
                    "color": "#10B981",
                    "config": {}
                }
            },
            {
                "id": "var-1",
                "type": "customNode",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "Set Variable",
                    "nodeType": "setVariable",
                    "icon": "Database",
                    "color": "#8B5CF6",
                    "config": {
                        "name": "test_var",
                        "value": "Hello World"
                    }
                }
            },
            {
                "id": "log-1",
                "type": "customNode",
                "position": {"x": 500, "y": 100},
                "data": {
                    "label": "Log Message",
                    "nodeType": "log",
                    "icon": "FileText",
                    "color": "#84CC16",
                    "config": {
                        "message": "Test variable value: {{test_var}}"
                    }
                }
            },
            {
                "id": "end-1",
                "type": "customNode",
                "position": {"x": 700, "y": 100},
                "data": {
                    "label": "End",
                    "nodeType": "end",
                    "icon": "StopCircle",
                    "color": "#6B7280",
                    "config": {}
                }
            }
        ],
        "edges": [
            {
                "id": "e1",
                "source": "start-1",
                "target": "var-1",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e2",
                "source": "var-1",
                "target": "log-1",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e3",
                "source": "log-1",
                "target": "end-1",
                "type": "smoothstep",
                "animated": True
            }
        ]
    }
    
    # Test data
    test_data = {
        "workflow": test_workflow,
        "input_data": {
            "user_input": "Test input data"
        }
    }
    
    try:
        # Test temporary workflow execution
        print("1. Testing temporary workflow execution...")
        response = requests.post(
            "http://localhost:10000/api/workflows/execute",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Workflow execution successful!")
            print(f"Status: {result.get('status')}")
            print(f"Execution Log: {len(result.get('execution_log', []))} entries")
            print(f"Nodes Executed: {result.get('nodes_executed', 0)}")
            
            # Print execution log
            for log_entry in result.get('execution_log', []):
                print(f"  - {log_entry.get('node_name')}: {log_entry.get('status')} - {log_entry.get('message')}")
        else:
            print(f"❌ Workflow execution failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server on localhost:10000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_workflow_execution()
