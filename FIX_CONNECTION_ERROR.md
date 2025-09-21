# 🔧 FIXING "Service Refused Connection" ERROR

## ❌ PROBLEM IDENTIFIED
The workflow can't connect to Taiga because:
1. **Credentials not configured in n8n**
2. **Wrong API URL format**
3. **Authentication token issues**

## ✅ STEP-BY-STEP FIX

### Step 1: Configure Taiga API Credentials in n8n
1. Go to **http://localhost:5678** (n8n interface)
2. Click **Credentials** in sidebar
3. Click **Add Credential**
4. Search for **"Taiga API"**
5. Fill in:
   ```
   URL: http://taiga-docker-taiga-back-1:8000
   Username: admin
   Password: admin123
   ```
6. **Save** as "Taiga API"

### Step 2: Import the Native Workflow
1. In n8n, click **Workflows** → **Import from File**
2. Upload: `/tmp/native-workflow.json` (already copied to n8n container)
3. **OR** Copy-paste the workflow JSON directly

### Step 3: Fix Workflow Credentials
1. Open the imported workflow
2. Click on **"Taiga Trigger"** node
3. Under **Credentials**, select the **"Taiga API"** credential you created
4. Repeat for **"Create Task"** and **"Update Story"** nodes
5. **Save** the workflow

### Step 4: Set Correct Project ID
1. Click **"Taiga Trigger"** node
2. Change **Project Name or ID** to **"1"** (or select from dropdown)
3. Repeat for other Taiga nodes
4. **Save** the workflow

### Step 5: Activate Workflow
1. Click the **toggle switch** to activate
2. n8n will automatically create webhook in Taiga
3. You should see webhook URL in the trigger node

## 🧪 TEST THE FIX
1. Create a user story with "action" in title
2. Check if task is auto-created
3. Check if story description updated

## 🚨 ALTERNATIVE: QUICK API TEST
If still not working, test API directly:
```bash
# Test from n8n container
docker exec n8n-fixed sh -c "
echo '{\"password\":\"123123\",\"type\":\"normal\",\"username\":\"admin\"}' | 
wget -qO- --post-data=@- --header='Content-Type:application/json' 
http://taiga-docker-taiga-back-1:8000/api/v1/auth
"
```

## 🔍 DEBUGGING
If still failing:
1. Check n8n workflow execution logs
2. Check Taiga backend logs: `docker logs taiga-docker-taiga-back-1`
3. Verify network connectivity: `docker exec n8n-fixed ping taiga-docker-taiga-back-1`

The main issue is **credentials configuration** in n8n UI - the workflow JSON can't contain actual credentials for security reasons.
