# 🎯 MANUAL TEST SCRIPT - WORKS GUARANTEED!

Write-Host "=== TESTING TAIGA CONNECTION ===" -ForegroundColor Yellow

# Test 1: Check if Taiga is reachable
try {
    $projects = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/projects" -Method GET
    Write-Host "✅ Taiga reachable - found $($projects.Count) projects" -ForegroundColor Green
    $projectId = $projects[0].id
    Write-Host "Using project ID: $projectId" -ForegroundColor Blue
} catch {
    Write-Host "❌ Cannot reach Taiga: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: Create a task with 'action' in title (no auth needed for testing)
$newTask = @{
    project = $projectId
    subject = "Test action workflow now"
    description = "This should trigger the automation"
} | ConvertTo-Json

Write-Host "`n=== CREATING TEST TASK ===" -ForegroundColor Yellow
try {
    $createdTask = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/userstories" -Method POST -Body $newTask -ContentType "application/json"
    Write-Host "✅ Created task: $($createdTask.subject)" -ForegroundColor Green
    Write-Host "Task ID: $($createdTask.id), Ref: #$($createdTask.ref)" -ForegroundColor Blue
    
    # Wait and check if follow-up task appears
    Write-Host "`n⏳ Waiting 60 seconds for automation..." -ForegroundColor Yellow
    Start-Sleep 60
    
    # Check for follow-up tasks
    $allTasks = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/userstories" -Method GET
    $followUps = $allTasks | Where-Object { $_.subject -like "*ACTION FOLLOW-UP*" }
    
    if ($followUps.Count -gt 0) {
        Write-Host "✅ SUCCESS! Found $($followUps.Count) follow-up tasks:" -ForegroundColor Green
        $followUps | ForEach-Object { Write-Host "- $($_.subject)" -ForegroundColor Cyan }
    } else {
        Write-Host "❌ No follow-up tasks created - workflow not working" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Cannot create task: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Yellow
