#!/usr/bin/env python3

import requests
import json
import time

def test_comprehensive_workflow():
    print("Testing Comprehensive Workflow Canvas...")
    
    # Test workflow with multiple node types including brain and agent
    test_workflow = {
        "id": "comprehensive-test",
        "name": "Comprehensive Test Workflow",
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
                    "label": "Set User Input",
                    "nodeType": "setVariable",
                    "icon": "Database",
                    "color": "#8B5CF6",
                    "config": {
                        "name": "user_input",
                        "value": "Analyze the benefits of AI in healthcare"
                    }
                }
            },
            {
                "id": "brain-1",
                "type": "customNode",
                "position": {"x": 500, "y": 100},
                "data": {
                    "label": "AI Brain Analysis",
                    "nodeType": "brain",
                    "icon": "Zap",
                    "color": "#9D4EDD",
                    "config": {
                        "name": "Analysis Brain",
                        "model": "gpt-3.5-turbo",
                        "temperature": 0.7,
                        "systemPrompt": "You are an expert analyst. Analyze the given topic thoroughly.",
                        "userInput": "{{user_input}}",
                        "memoryNamespace": "analysis"
                    }
                }
            },
            {
                "id": "condition-1",
                "type": "customNode",
                "position": {"x": 700, "y": 100},
                "data": {
                    "label": "Check Response Length",
                    "nodeType": "ifCondition",
                    "icon": "GitBranch",
                    "color": "#F59E0B",
                    "config": {
                        "leftOperand": "{{ai_response}}",
                        "operator": "contains",
                        "rightOperand": "benefits"
                    }
                }
            },
            {
                "id": "agent-1",
                "type": "customNode",
                "position": {"x": 900, "y": 50},
                "data": {
                    "label": "Research Agent",
                    "nodeType": "agent",
                    "icon": "Settings",
                    "color": "#F72585",
                    "config": {
                        "name": "Research Agent",
                        "role": "researcher",
                        "model": "gpt-4",
                        "temperature": 0.3,
                        "task": "Expand on the analysis: {{ai_response}}",
                        "tools": ["web_search", "data_analysis"],
                        "memoryNamespace": "research"
                    }
                }
            },
            {
                "id": "log-success",
                "type": "customNode",
                "position": {"x": 1100, "y": 50},
                "data": {
                    "label": "Log Success",
                    "nodeType": "log",
                    "icon": "FileText",
                    "color": "#84CC16",
                    "config": {
                        "message": "Analysis completed successfully. Result: {{agent_result}}"
                    }
                }
            },
            {
                "id": "log-alt",
                "type": "customNode",
                "position": {"x": 900, "y": 150},
                "data": {
                    "label": "Log Alternative",
                    "nodeType": "log",
                    "icon": "FileText",
                    "color": "#84CC16",
                    "config": {
                        "message": "Basic analysis: {{ai_response}}"
                    }
                }
            },
            {
                "id": "end-1",
                "type": "customNode",
                "position": {"x": 1300, "y": 100},
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
                "target": "brain-1",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e3",
                "source": "brain-1",
                "target": "condition-1",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e4",
                "source": "condition-1",
                "target": "agent-1",
                "sourceHandle": "true",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e5",
                "source": "condition-1",
                "target": "log-alt",
                "sourceHandle": "false",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e6",
                "source": "agent-1",
                "target": "log-success",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e7",
                "source": "log-success",
                "target": "end-1",
                "type": "smoothstep",
                "animated": True
            },
            {
                "id": "e8",
                "source": "log-alt",
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
            "user_id": "test_user",
            "session_id": "test_session_123"
        }
    }
    
    try:
        print("1. Testing comprehensive workflow execution...")
        response = requests.post(
            "http://localhost:10000/api/workflows/execute",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Comprehensive workflow execution successful!")
            print(f"Status: {result.get('status')}")
            print(f"Execution Log: {len(result.get('execution_log', []))} entries")
            print(f"Nodes Executed: {result.get('nodes_executed', 0)}")
            print(f"Duration: {result.get('duration_seconds', 0):.2f} seconds")
            
            print("\n📊 Execution Log:")
            for i, log_entry in enumerate(result.get('execution_log', []), 1):
                status_icon = "✅" if log_entry.get('status') == 'success' else "❌" if log_entry.get('status') == 'error' else "⏳"
                print(f"  {i}. {status_icon} {log_entry.get('node_name')} ({log_entry.get('node_type')})")
                print(f"     Message: {log_entry.get('message')}")
                if log_entry.get('output'):
                    print(f"     Output: {str(log_entry.get('output'))[:100]}...")
                print()
                
            print("\n🔄 Node Statuses:")
            node_statuses = result.get('node_statuses', {})
            for node_id, status in node_statuses.items():
                status_icon = "✅" if status.get('status') == 'success' else "❌" if status.get('status') == 'error' else "⏳"
                print(f"  {status_icon} {node_id}: {status.get('status')}")
                if status.get('error'):
                    print(f"     Error: {status.get('error')}")
                    
        else:
            print(f"❌ Workflow execution failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server on localhost:10000")
        print("Make sure the backend server is running")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_parameter_validation():
    print("\n" + "="*50)
    print("Testing Parameter Validation...")
    
    # Test workflow with invalid parameters
    invalid_workflow = {
        "id": "validation-test",
        "name": "Validation Test Workflow",
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
                "id": "http-1",
                "type": "customNode",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "Invalid HTTP Request",
                    "nodeType": "httpRequest",
                    "icon": "Globe",
                    "color": "#3B82F6",
                    "config": {
                        # Missing required 'url' parameter
                        "method": "GET"
                    }
                }
            }
        ],
        "edges": []
    }
    
    test_data = {
        "workflow": invalid_workflow,
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
            if result.get('status') == 'error':
                print("✅ Parameter validation working - execution failed as expected")
                print(f"Error: {result.get('error_details')}")
            else:
                print("⚠️  Parameter validation may not be working properly")
        else:
            print(f"❌ Unexpected response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_comprehensive_workflow()
    test_parameter_validation()
