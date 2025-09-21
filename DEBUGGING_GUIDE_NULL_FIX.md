# 🔧 DEBUGGING GUIDE - NULL kanboard_task_id Issue

## 🎯 Problem Analysis
The error shows that `kanboard_task_id` is NULL when trying to insert into the database. This means:
1. Either no Due Diligence tasks exist in Kanboard
2. The data isn't flowing properly through the workflow
3. The task ID isn't being parsed correctly

## 🧪 Step-by-Step Debugging

### Step 1: Check if Due Diligence Tasks Exist
```bash
# Import and run: Test_DD_Tasks_Quick_Check.json
```
This will show you:
- Total tasks in Kanboard
- Which tasks contain "Due Diligence" 
- Exact task data structure

### Step 2: Create a Test Due Diligence Task
In Kanboard:
1. Go to your project (Project ID: 1)
2. Create a new task with:
   - **Title**: `Due Diligence: ACME Corp`
   - **Description**: `Company website: https://acme.com`
   - **Status**: Open (status_id: 1)

### Step 3: Test Main Workflow Nodes Individually

**Test Node 1: Get Kanboard Tasks**
- Run manually
- Check output - should show JSON with `result` array
- Verify tasks exist with status_id: 1

**Test Node 2: Find Due Diligence Task** 
- After running Node 1, run this manually
- Check output for extracted task data
- Verify `kanboard_task_id` is populated

**Test Node 3: Database Insert**
- Only test after confirming Node 2 works
- Should insert task with all required fields

## 🔍 Fixed Issues in the Workflow

### Issue 1: Merge Node Not Connected ✅ FIXED
**Before**: Merge node wasn't connected to anything
**After**: Now properly merges both paths (with/without PDF)

### Issue 2: Data Type Conversion ✅ FIXED  
**Before**: Task IDs were strings
**After**: Convert to integers with `parseInt(task.id)`

### Issue 3: Better Error Handling ✅ FIXED
**Before**: Workflow continued with invalid data
**After**: Stops gracefully if no DD tasks found

### Issue 4: Merge Logic ✅ FIXED
**Before**: Used mergeByIndex which could fail
**After**: Uses combineAll with data validation

## 🚀 Updated Workflow Flow

```
Every 5 Minutes → Get Kanboard Tasks → Find DD Tasks
                                          ↓
                                    (if no tasks, stop)
                                          ↓
Get Task Files → Process Files → Has Files?
                                    ↓         ↓
                              [YES]         [NO]
                                ↓           ↓
                        Download PDF      Direct to Merge
                             ↓             ↓
                        Fix Binary → Extract → Combine Text
                             ↓
                        Merge Paths ← ← ← ← ← 
                             ↓
                        Prepare Database (validate data)
                             ↓
                        Insert to Database
```

## 🛠️ Manual Testing Commands

### Test PostgreSQL Connection
```bash
docker exec dd_postgres psql -U postgres -d due_diligence_db -c "
SELECT COUNT(*) FROM due_diligence_reports;
"
```

### Test Kanboard API
```bash
curl -X POST http://localhost:8000/jsonrpc.php \
  -u "your_username:your_password" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getAllTasks", 
    "id": 1,
    "params": {"project_id": 1, "status_id": 1}
  }'
```

## 📋 Expected Test Results

### If Test Workflow Shows No DD Tasks:
```json
{
  "total_tasks": 5,
  "dd_tasks": [],
  "dd_count": 0,
  "message": "No Due Diligence tasks found. Create a task with title containing 'Due Diligence'"
}
```
**Action**: Create a test task in Kanboard

### If Test Workflow Shows DD Tasks:
```json
{
  "total_tasks": 5,
  "dd_tasks": [
    {
      "id": "123",
      "title": "Due Diligence: ACME Corp", 
      "description": "Company website: https://acme.com"
    }
  ],
  "dd_count": 1,
  "message": "Found 1 Due Diligence tasks"
}
```
**Action**: Main workflow should work now

## 🎯 Success Criteria

✅ **Test workflow returns DD tasks**  
✅ **kanboard_task_id is populated (not null)**  
✅ **Database insert succeeds**  
✅ **Workflow processes both with/without PDF paths**  

## 🚨 If Still Getting NULL Error

1. **Run the test workflow first** - this will show you exactly what's in Kanboard
2. **Check the n8n execution log** - look for the console.log outputs
3. **Verify task structure** - ensure Kanboard is returning valid task IDs
4. **Check credential permissions** - ensure your Kanboard user can access tasks

The key fix is that we now properly validate and convert the task IDs to integers, and the merge properly combines both paths without losing data! 🚀
