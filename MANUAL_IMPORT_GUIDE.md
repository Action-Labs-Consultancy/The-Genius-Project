# MANUAL IMPORT STEPS FOR N8N WORKFLOW

## Step 1: Copy the workflow JSON
1. Open the file `research-workflow-FIXED.json`
2. Copy all contents (Ctrl+A, Ctrl+C)

## Step 2: Import in n8n interface
1. Go to http://localhost:9000
2. Login with: admin@example.com / GlassDoor2025!
3. Click "New workflow" 
4. Click the 3 dots menu (⋮) at top right
5. Select "Import from JSON"
6. Paste the copied JSON and click "Import"

## Step 3: Configure PostgreSQL credentials
1. In the workflow, click on the "Postgres Save" node
2. Click on "Select credentials"
3. Click "Create New" 
4. Add connection details:
   - Host: localhost
   - Database: research_db
   - User: postgres  
   - Password: your_postgres_password
5. Test connection and save

## Step 4: Activate workflow
1. Click the toggle switch to activate the workflow
2. The webhook URL will be: http://localhost:9000/webhook/research-request

## Step 5: Test the workflow
Run in PowerShell:
```powershell
$body = @{company = "Tesla Inc."} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:9000/webhook/research-request" -Method POST -Body $body -ContentType "application/json"
```

## Expected result:
```json
{
  "message": "Research queued for Tesla Inc.",
  "status": "success", 
  "sections_count": 20
}
```

Check PostgreSQL for the research results:
```sql
SELECT * FROM research_results WHERE company = 'Tesla Inc.';
```
