#!/usr/bin/env python3

import requests
import json

def test_brain_workflow():
    print("Testing Brain Workflow...")
    
    # Simple workflow with brain node
    test_workflow = {
        "id": "brain-test",
        "name": "Brain Test Workflow",
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
                "id": "brain-1",
                "type": "customNode",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "AI Brain",
                    "nodeType": "brain",
                    "icon": "Zap",
                    "color": "#9D4EDD",
                    "config": {
                        "name": "Test Brain",
                        "model": "gpt-3.5-turbo",
                        "temperature": 0.7,
                        "systemPrompt": "You are a helpful assistant.",
                        "userInput": "Hello, what is AI?",
                        "memoryNamespace": "test"
                    }
                }
            },
            {
                "id": "log-1",
                "type": "customNode",
                "position": {"x": 500, "y": 100},
                "data": {
                    "label": "Log Result",
                    "nodeType": "log",
                    "icon": "FileText",
                    "color": "#84CC16",
                    "config": {
                        "message": "Brain response: {{ai_response}}"
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
                "target": "brain-1",
                "type": "smoothstep"
            },
            {
                "id": "e2",
                "source": "brain-1",
                "target": "log-1",
                "type": "smoothstep"
            },
            {
                "id": "e3",
                "source": "log-1",
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
                print("✅ Brain workflow worked!")
                for log_entry in result.get('execution_log', []):
                    print(f"  - {log_entry.get('node_name')}: {log_entry.get('message')}")
                    if log_entry.get('output'):
                        print(f"    Output: {str(log_entry.get('output'))[:200]}...")
            else:
                print(f"❌ Error: {result.get('error_details')}")
        else:
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_brain_workflow()
