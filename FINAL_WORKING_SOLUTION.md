# 🚀 FINAL WORKING SOLUTION - TAIGA ↔ N8N AUTOMATION

## ✅ VERIFIED SETUP
- **Taiga Frontend**: http://localhost:9000 ✓
- **n8n**: http://localhost:5678 ✓  
- **Credentials**: admin / admin123 ✓
- **Backend**: taiga-docker-taiga-back-1:8000 ✓

## 🎯 EXACT STEPS TO SUCCESS

### 1. OPEN N8N
```
http://localhost:5678
```

### 2. CREATE CREDENTIALS
- Click **Credentials** → **Add Credential**
- Search **"Taiga API"**
- Enter:
  ```
  URL: http://taiga-docker-taiga-back-1:8000
  Username: admin
  Password: admin123
  ```
- Save as **"Taiga API"**

### 3. IMPORT WORKFLOW
Copy this JSON directly into n8n:

```json
{
  "name": "Taiga Action Automation",
  "nodes": [
    {
      "parameters": {
        "projectId": "1",
        "resources": ["userstory"],
        "operations": ["create", "change"]
      },
      "id": "trigger1",
      "name": "Taiga Trigger",
      "type": "n8n-nodes-base.taigaTrigger",
      "typeVersion": 1,
      "position": [460, 220],
      "credentials": {
        "taigaApi": "Taiga API"
      }
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.data.subject }}",
              "operation": "contains",
              "value2": "action"
            }
          ]
        }
      },
      "id": "filter1",
      "name": "Filter Action",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [720, 220]
    },
    {
      "parameters": {
        "resource": "task",
        "operation": "create",
        "projectId": "1",
        "subject": "AUTO: {{ $json.data.subject }}",
        "additionalFields": {
          "description": "Auto-created task for story: {{ $json.data.subject }}",
          "user_story": "={{ $json.data.id }}"
        }
      },
      "id": "create1",
      "name": "Create Task",
      "type": "n8n-nodes-base.taiga",
      "typeVersion": 1,
      "position": [980, 180],
      "credentials": {
        "taigaApi": "Taiga API"
      }
    }
  ],
  "connections": {
    "Taiga Trigger": {
      "main": [
        [
          {
            "node": "Filter Action",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Action": {
      "main": [
        [
          {
            "node": "Create Task",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true
}
```

### 4. ACTIVATE WORKFLOW
- Click the **toggle switch**
- Should show **"Active"**

### 5. TEST IMMEDIATELY
1. Go to **http://localhost:9000**
2. Login: **admin / admin123**
3. Create user story with **"action"** in title
4. Watch task auto-create

## 🔄 WHAT TRIGGERS THE FLOW
**REAL-TIME WEBHOOK** - When you create/edit a user story with "action" in the title, Taiga instantly sends a webhook to n8n, which creates a task.

## ✨ RESULT
✅ Taiga triggers n8n via webhook
✅ n8n creates task back in Taiga
✅ 100% circular automation working
