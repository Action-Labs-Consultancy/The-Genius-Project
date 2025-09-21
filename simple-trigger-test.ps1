# Simple Due Diligence System Test
Write-Host "Testing Due Diligence System Trigger Points" -ForegroundColor Green

Write-Host "1. Testing Taiga API Access..." -ForegroundColor Cyan

# Login to Taiga
$loginBody = @{
    type = "normal"
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/auth" -Method POST -Body $loginBody -Headers @{"Content-Type" = "application/json"}
    $authToken = $authResponse.auth_token
    Write-Host "✅ Taiga login successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Taiga login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get projects
Write-Host "2. Getting Taiga Projects..." -ForegroundColor Cyan
try {
    $projects = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/projects" -Method GET -Headers @{"Authorization" = "Bearer $authToken"}
    Write-Host "Found $($projects.Count) projects" -ForegroundColor White
    
    if ($projects.Count -gt 0) {
        $project = $projects[0]
        Write-Host "Using project: $($project.name)" -ForegroundColor Yellow
        $projectId = $project.id
    } else {
        Write-Host "❌ No projects found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get projects: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create test task that should trigger workflow
Write-Host "3. Creating Test Task..." -ForegroundColor Cyan

$taskBody = @{
    subject = "Research on Apple Inc"
    description = "Test task for due diligence automation"
    project = $projectId
    status = 1
    priority = 1
    severity = 1
    type = 1
} | ConvertTo-Json

try {
    $taskResponse = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/tasks" -Method POST -Body $taskBody -Headers @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }
    
    Write-Host "✅ Test task created successfully!" -ForegroundColor Green
    Write-Host "Task ID: $($taskResponse.id)" -ForegroundColor Yellow
    Write-Host "Subject: $($taskResponse.subject)" -ForegroundColor Yellow
    Write-Host "View at: http://localhost:9000/project/$($project.slug)/task/$($taskResponse.ref)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to create task: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "TRIGGER LOCATIONS:" -ForegroundColor Yellow
Write-Host "1. TAIGA WEB INTERFACE:" -ForegroundColor Cyan
Write-Host "   → Go to: http://localhost:9000" -ForegroundColor White
Write-Host "   → Login: admin/admin123" -ForegroundColor White  
Write-Host "   → Click 'New Task' or '+' button" -ForegroundColor White
Write-Host "   → Subject: 'Research on [Company Name]'" -ForegroundColor White
Write-Host "   → This triggers the n8n workflow automatically" -ForegroundColor White

Write-Host ""
Write-Host "2. WEBHOOK ENDPOINT:" -ForegroundColor Cyan
Write-Host "   → URL: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White
Write-Host "   → Method: POST" -ForegroundColor White
Write-Host "   → Use this from your research page or external apps" -ForegroundColor White

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Import taiga-ai-workflow.json into n8n" -ForegroundColor White
Write-Host "2. Activate the workflow" -ForegroundColor White  
Write-Host "3. Test by creating task in Taiga" -ForegroundColor White
