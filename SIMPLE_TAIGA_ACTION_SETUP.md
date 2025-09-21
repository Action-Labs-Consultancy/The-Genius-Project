# 🚀 SIMPLE TAIGA ACTION FLOW - COMPLETE SETUP

## What This Does (EXACTLY what you asked for):

**1. You create a task:** "Test this action item"  
**2. Taiga sends webhook** → n8n receives it  
**3. n8n checks:** Does subject contain "action"? ✅ YES  
**4. n8n creates:** New task "🔥 ACTION FOLLOW-UP: Test this action item"  
**5. n8n adds comment:** "Action processed, new task created: #123"  

**Perfect demo for your boss!** Shows complete circle: Taiga → n8n → back to Taiga

---

## 🎯 STEP 1: Get Your Taiga Token

### Option A: Try Default Admin
```powershell
$body = @{
    type = "normal"
    username = "admin"  
    password = "123123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/auth" -Method POST -Body $body -ContentType "application/json"
$token = $response.auth_token
Write-Host "Your token: $token"
```

### Option B: Use Browser Login
1. Go to http://localhost:9000
2. Log in with your credentials  
3. Open browser dev tools (F12)
4. Go to Application/Storage → Local Storage
5. Find "auth_token" value

---

## 🎯 STEP 2: Import Workflow to n8n

1. **Open n8n:** http://localhost:5678
2. **Click "Import from file"**  
3. **Select:** `simple-taiga-action-flow.json`
4. **Replace "YOUR_TAIGA_TOKEN"** with your actual token (2 places)
5. **Click "Save"** and **"Activate"**

---

## 🎯 STEP 3: Configure Taiga Webhook

1. **Go to Taiga:** http://localhost:9000
2. **Open your project** → Project Settings → Integrations
3. **Add Webhook:**
   - **URL:** `http://localhost:5678/webhook/taiga-action-webhook`
   - **Events:** Check "User stories" 
   - **Save**

---

## 🎯 STEP 4: TEST IT!

### Create these test tasks in Taiga:

✅ **Test 1:** "Fix the login action"  
→ **Result:** Creates "🔥 ACTION FOLLOW-UP: Fix the login action" + comment

✅ **Test 2:** "Review the action plan"  
→ **Result:** Creates "🔥 ACTION FOLLOW-UP: Review the action plan" + comment  

❌ **Test 3:** "Update documentation"  
→ **Result:** No new task (no "action" keyword)

---

## 🎯 WHAT YOUR BOSS WILL SEE:

1. **Original Task:** "Implement user action tracking"
2. **Auto-Created Task:** "🔥 ACTION FOLLOW-UP: Implement user action tracking"  
3. **Comment Added:** "🤖 ACTION PROCESSED! New action task created: #124"

**Perfect demo of automation pipeline!**

---

## 🔧 Files Created:
- `simple-taiga-action-flow.json` - The n8n workflow
- `SIMPLE_TAIGA_ACTION_SETUP.md` - This setup guide

## 🎉 Ready to Demo:
Just create any task with "action" in the title and watch the magic happen!
