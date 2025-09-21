# Test Due Diligence System Trigger Points
Write-Host "=== Testing Due Diligence System Trigger Points ===" -ForegroundColor Green

Write-Host "`n1. Current System Analysis:" -ForegroundColor Cyan

# Check current webhook endpoint
Write-Host "   Webhook endpoint: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White

# Test Taiga API access
Write-Host "`n2. Testing Taiga API Access:" -ForegroundColor Cyan

# Login to Taiga first
$loginBody = @{
    type = "normal"
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/auth" -Method POST -Body $loginBody -Headers @{"Content-Type" = "application/json"}
    $authToken = $authResponse.auth_token
    Write-Host "   ✅ Taiga login successful" -ForegroundColor Green
    Write-Host "   Token: $($authToken.Substring(0,20))..." -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Taiga login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get projects
Write-Host "`n3. Checking Taiga Projects:" -ForegroundColor Cyan
try {
    $projects = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/projects" -Method GET -Headers @{"Authorization" = "Bearer $authToken"}
    Write-Host "   Found $($projects.Count) projects" -ForegroundColor White
    
    if ($projects.Count -gt 0) {
        $project = $projects[0]
        Write-Host "   Using project: $($project.name) (ID: $($project.id))" -ForegroundColor Yellow
        $projectId = $project.id
    } else {
        Write-Host "   ❌ No projects found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Failed to get projects: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Testing Trigger Method 1: Create Task in Taiga" -ForegroundColor Cyan

# Create a test task that should trigger the workflow
$taskBody = @{
    subject = "Research on Apple Inc"
    description = "Automated due diligence research task"
    project = $projectId
    status = 1
    priority = 1
    severity = 1
    type = 1
    assigned_to = $null
} | ConvertTo-Json

try {
    $taskResponse = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/tasks" -Method POST -Body $taskBody -Headers @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }
    
    Write-Host "   ✅ Test task created successfully!" -ForegroundColor Green
    Write-Host "   Task ID: $($taskResponse.id)" -ForegroundColor Yellow
    Write-Host "   Subject: $($taskResponse.subject)" -ForegroundColor Yellow
    Write-Host "   URL: http://localhost:9000/project/$($project.slug)/task/$($taskResponse.ref)" -ForegroundColor White
    
} catch {
    Write-Host "   ❌ Failed to create task: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Testing Trigger Method 2: Direct Webhook Call" -ForegroundColor Cyan

# Simulate webhook payload
$webhookPayload = @{
    action = "create"
    type = "task"
    subject = "Research on Tesla Inc"
    id = 999
    version = 1
    project = @{
        id = $projectId
        name = $project.name
    }
    user = @{
        username = "admin"
    }
} | ConvertTo-Json

try {
    $webhookResponse = Invoke-RestMethod -Uri "http://localhost:5678/webhook/taiga-webhook" -Method POST -Body $webhookPayload -Headers @{"Content-Type" = "application/json"} -TimeoutSec 30
    Write-Host "   ✅ Direct webhook call successful!" -ForegroundColor Green
    Write-Host "   Response: $webhookResponse" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Webhook call failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This is expected if workflow is not activated in n8n" -ForegroundColor Yellow
}

Write-Host "`n6. Testing n8n Workflow Status:" -ForegroundColor Cyan

try {
    $n8nHealth = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -Method GET
    Write-Host "   ✅ n8n is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ n8n is not accessible" -ForegroundColor Red
}

Write-Host "`n=== TRIGGER POINT ANALYSIS ===" -ForegroundColor Yellow

Write-Host "`n🎯 Where to Call From:" -ForegroundColor Cyan
Write-Host "   1. TAIGA TASK CREATION (Recommended)" -ForegroundColor White
Write-Host "      → Go to: http://localhost:9000" -ForegroundColor Gray
Write-Host "      → Login: admin/admin123" -ForegroundColor Gray
Write-Host "      → Create new task with subject: 'Research on [Company]'" -ForegroundColor Gray
Write-Host "      → Webhook automatically triggers n8n workflow" -ForegroundColor Gray

Write-Host "`n   2. RESEARCH PAGE (Your Website)" -ForegroundColor White
Write-Host "      → Add button/form on research page" -ForegroundColor Gray
Write-Host "      → POST to: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor Gray
Write-Host "      → Include company name in payload" -ForegroundColor Gray

Write-Host "`n   3. API INTEGRATION" -ForegroundColor White
Write-Host "      → External systems can call webhook directly" -ForegroundColor Gray
Write-Host "      → Format: POST with JSON payload" -ForegroundColor Gray

Write-Host "`n🔧 Required Setup:" -ForegroundColor Cyan
Write-Host "   1. Import taiga-ai-workflow.json into n8n" -ForegroundColor White
Write-Host "   2. Activate the workflow in n8n interface" -ForegroundColor White
Write-Host "   3. Configure Taiga webhook (if not using direct calls)" -ForegroundColor White

Write-Host "`n🧪 Test Instructions:" -ForegroundColor Cyan
Write-Host "   1. Open Taiga: http://localhost:9000" -ForegroundColor White
Write-Host "   2. Create task: 'Research on Apple Inc'" -ForegroundColor White
Write-Host "   3. Check task description for AI-generated content" -ForegroundColor White
Write-Host "   4. Verify 20-section due diligence structure" -ForegroundColor White
