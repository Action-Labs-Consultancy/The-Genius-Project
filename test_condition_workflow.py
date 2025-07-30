#!/usr/bin/env python3

import requests
import json

def test_condition_workflow():
    print("Testing Condition Workflow...")
    
    # Simple workflow with condition
    test_workflow = {
        "id": "condition-test",
        "name": "Condition Test Workflow",
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
                    "label": "Set Test Value",
                    "nodeType": "setVariable",
                    "icon": "Database",
                    "color": "#8B5CF6",
                    "config": {
                        "name": "test_value",
                        "value": "hello world"
                    }
                }
            },
            {
                "id": "condition-1",
                "type": "customNode",
                "position": {"x": 500, "y": 100},
                "data": {
                    "label": "Check Value",
                    "nodeType": "ifCondition",
                    "icon": "GitBranch",
                    "color": "#F59E0B",
                    "config": {
                        "leftOperand": "{{test_value}}",
                        "operator": "contains",
                        "rightOperand": "hello"
                    }
                }
            },
            {
                "id": "log-true",
                "type": "customNode",
                "position": {"x": 700, "y": 50},
                "data": {
                    "label": "Log True",
                    "nodeType": "log",
                    "icon": "FileText",
                    "color": "#84CC16",
                    "config": {
                        "message": "Condition was true: {{test_value}}"
                    }
                }
            },
            {
                "id": "log-false",
                "type": "customNode",
                "position": {"x": 700, "y": 150},
                "data": {
                    "label": "Log False",
                    "nodeType": "log",
                    "icon": "FileText",
                    "color": "#84CC16",
                    "config": {
                        "message": "Condition was false: {{test_value}}"
                    }
                }
            },
            {
                "id": "end-1",
                "type": "customNode",
                "position": {"x": 900, "y": 100},
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
                "type": "smoothstep"
            },
            {
                "id": "e2",
                "source": "var-1",
                "target": "condition-1",
                "type": "smoothstep"
            },
            {
                "id": "e3",
                "source": "condition-1",
                "target": "log-true",
                "sourceHandle": "true",
                "type": "smoothstep"
            },
            {
                "id": "e4",
                "source": "condition-1",
                "target": "log-false",
                "sourceHandle": "false",
                "type": "smoothstep"
            },
            {
                "id": "e5",
                "source": "log-true",
                "target": "end-1",
                "type": "smoothstep"
            },
            {
                "id": "e6",
                "source": "log-false",
                "target": "end-1",
                "type": "smoothstep"
            }
        ]
    }
    
    test_data = {
        "workflow": test_workflow,
        "input_data": {}
    }
    
    try:
        response = requests.post(
            "http://localhost:10000/api/workflows/execute",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Status: {result.get('status')}")
            print(f"Nodes Executed: {result.get('nodes_executed', 0)}")
            if result.get('status') == 'success':
                print("✅ Condition workflow worked!")
                for log_entry in result.get('execution_log', []):
                    print(f"  - {log_entry.get('node_name')}: {log_entry.get('message')}")
            else:
                print(f"❌ Error: {result.get('error_details')}")
        else:
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_condition_workflow()
