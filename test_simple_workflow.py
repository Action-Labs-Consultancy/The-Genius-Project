#!/usr/bin/env python3

import requests
import json

def test_simple_workflow():
    print("Testing Simple Workflow...")
    
    # Very simple workflow
    test_workflow = {
        "id": "simple-test",
        "name": "Simple Test Workflow",
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
                "id": "log-1",
                "type": "customNode",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "Log Message",
                    "nodeType": "log",
                    "icon": "FileText",
                    "color": "#84CC16",
                    "config": {
                        "message": "Hello World"
                    }
                }
            },
            {
                "id": "end-1",
                "type": "customNode",
                "position": {"x": 500, "y": 100},
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
                "target": "log-1",
                "type": "smoothstep"
            },
            {
                "id": "e2",
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
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_simple_workflow()
