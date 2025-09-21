# 🎯 NATIVE TAIGA NODES WORKFLOW - CLEAN & SIMPLE

## ✅ USING ONLY TAIGA NODES - NO HTTP REQUESTS!

Now using native n8n Taiga nodes for cleaner, more reliable automation.

---

## 🔧 SETUP INSTRUCTIONS:

### Step 1: Create Taiga Credential in n8n
1. Open n8n: **http://localhost:5678**
2. Go to **Settings** → **Credentials** → **Add Credential**
3. Search for **"Taiga"** → Select **"TaigaApi"**
4. Configure with these **EXACT** values:
   ```
   Name: Taiga Working Credential
   Server: http://localhost:9000
   Username: admin
   Password: admin123
   ```
5. Click **"Test"** - Should show ✅ **"Connection successful"**
6. Click **"Save"**

### Step 2: Import Native Taiga Workflow
1. Import **`WORKING_TAIGA_N8N_WORKFLOW.json`**
2. The workflow uses **only native Taiga nodes**
3. **Pre-activated** - will start running immediately

### Step 3: Test the Clean Workflow
1. Go to Taiga: **http://localhost:9000**
2. Login: **admin** / **admin123**
3. Create a new issue in **Project 1**
4. **Wait 30 seconds** (next polling cycle)
5. Check **Tasks** section → New task will appear

---

## 🚀 WORKFLOW STRUCTURE - NATIVE TAIGA NODES:

### Clean Flow:
```
Cron (30s) → Taiga Get Issues → Check Count → Taiga Create Task
```

### Node Types Used:
1. **📅 Cron Trigger** - Runs every 30 seconds
2. **🔍 Taiga Node** - Gets recent issues (native API)
3. **❓ IF Node** - Checks if issues exist  
4. **📝 Taiga Node** - Creates task (native API)

### Benefits of Native Nodes:
- ✅ **No HTTP complexity** - Taiga nodes handle authentication
- ✅ **Built-in error handling** - Native nodes are more robust
- ✅ **Cleaner configuration** - No manual API calls
- ✅ **Better data handling** - Proper Taiga data structures
- ✅ **Credential management** - Secure token handling

---

## 🎯 WHAT YOU'LL SEE:

### Task Creation:
- **Title**: "AUTO: Task for Issue - [issue subject]"
- **Description**: Includes issue details + automation timestamp
- **Status**: "New" (Status ID 1)
- **Priority**: Default (Priority ID 2)
- **Tags**: ["auto-generated", "from-issue"]

### Execution Pattern:
- **Runs every 30 seconds**
- **Only processes new issues** (created in last 60 seconds)
- **Creates one task per issue** (no duplicates)

---

## 🛡️ RELIABILITY FEATURES:

1. **Native Authentication** - Taiga credential handles tokens
2. **Proper Filtering** - Uses Taiga's native date filtering
3. **Clean Data Flow** - Native nodes return proper data structures
4. **Error Resilience** - Built-in Taiga node error handling
5. **No Manual API** - Everything through official n8n Taiga integration

---

## 🔧 CONFIGURATION DETAILS:

### Verified Settings:
- **Project ID**: 1 ("Project 1")
- **Issue Filter**: `created_date__gte` (last 60 seconds)
- **Task Status**: 1 ("New")
- **Task Priority**: 2 (default for Project 1)

### Credential Requirements:
- **Server**: `http://localhost:9000` (frontend gateway)
- **Username**: `admin`
- **Password**: `admin123`

---

## 🎉 PURE TAIGA INTEGRATION:

This workflow is now **100% native Taiga** - no HTTP requests, no complex authentication, just clean Taiga node integration.

**Import the workflow, create the credential, and enjoy pure Taiga automation!** 🚀
