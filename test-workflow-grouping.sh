#!/bin/bash

echo "🚀 Testing Workflow System with Grouping..."

# Test 1: Basic workflow execution
echo "📋 Test 1: Basic workflow execution..."
curl -X POST http://localhost:10000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "id": "test-basic",
      "name": "Basic Test Workflow",
      "nodes": [
        {"id": "start", "type": "start", "data": {"label": "Start"}},
        {"id": "task1", "type": "task", "data": {"label": "Process Data"}},
        {"id": "end", "type": "end", "data": {"label": "End"}}
      ],
      "edges": [
        {"id": "e1", "source": "start", "target": "task1"},
        {"id": "e2", "source": "task1", "target": "end"}
      ]
    }
  }' | jq '.'

echo -e "\n📦 Test 2: Workflow with groups..."
curl -X POST http://localhost:10000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "id": "test-grouped",
      "name": "Grouped Workflow",
      "nodes": [
        {"id": "start", "type": "start", "data": {"label": "Start"}},
        {"id": "auth", "type": "auth", "data": {"label": "Authenticate"}},
        {"id": "validate", "type": "validation", "data": {"label": "Validate Data"}},
        {"id": "process", "type": "task", "data": {"label": "Process"}},
        {"id": "notify", "type": "notification", "data": {"label": "Send Notification"}},
        {"id": "end", "type": "end", "data": {"label": "End"}}
      ],
      "edges": [
        {"id": "e1", "source": "start", "target": "auth"},
        {"id": "e2", "source": "auth", "target": "validate"},
        {"id": "e3", "source": "validate", "target": "process"},
        {"id": "e4", "source": "process", "target": "notify"},
        {"id": "e5", "source": "notify", "target": "end"}
      ],
      "groups": [
        {
          "id": "security-group",
          "name": "Security",
          "nodeIds": ["auth", "validate"],
          "position": {"x": 150, "y": 100}
        },
        {
          "id": "processing-group", 
          "name": "Processing",
          "nodeIds": ["process", "notify"],
          "position": {"x": 350, "y": 100}
        }
      ]
    }
  }' | jq '.'

echo -e "\n✅ Tests completed!"
echo "💡 Check the frontend at http://localhost:3000 to test grouping UI"
echo "💡 Use Shift+click to select multiple nodes, then Ctrl+G to group them"
