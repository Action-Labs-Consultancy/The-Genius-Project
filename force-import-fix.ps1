# DIRECT FIX - Force Import n8n Workflow
Write-Host "=== FORCING N8N WORKFLOW IMPORT ===" -ForegroundColor Green

# Step 1: Use PowerShell native methods to import
Write-Host "Step 1: Preparing workflow for import..." -ForegroundColor Cyan

$workflowContent = Get-Content "taiga-20-section-workflow.json" -Raw
Write-Host "✅ Workflow loaded ($($workflowContent.Length) chars)" -ForegroundColor Green

# Step 2: Try different import methods
Write-Host "Step 2: Attempting direct n8n REST API import..." -ForegroundColor Cyan

# Method 1: Try the workflows endpoint with proper headers
$headers = @{
    'Content-Type' = 'application/json'
    'Accept' = 'application/json'
    'User-Agent' = 'PowerShell/7.0'
}

try {
    # Parse the JSON to ensure it's valid
    $workflowObj = $workflowContent | ConvertFrom-Json
    Write-Host "✅ JSON is valid" -ForegroundColor Green
    
    # Create a simplified version for import
    $importPayload = @{
        name = $workflowObj.name
        nodes = $workflowObj.nodes
        connections = $workflowObj.connections
        active = $true
        settings = @{}
    } | ConvertTo-Json -Depth 10 -Compress
    
    Write-Host "Trying simplified import payload..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "http://localhost:5678/rest/workflows" -Method POST -Body $importPayload -Headers $headers -TimeoutSec 30
    Write-Host "🎉 SUCCESS! Workflow imported!" -ForegroundColor Green
    Write-Host "Workflow ID: $($response.id)" -ForegroundColor White
    
} catch {
    Write-Host "❌ REST import failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Method 2: Try using Invoke-WebRequest with manual content
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    try {
        $webResponse = Invoke-WebRequest -Uri "http://localhost:5678/rest/workflows" -Method POST -Body $workflowContent -ContentType "application/json" -TimeoutSec 30
        Write-Host "✅ Alternative method succeeded!" -ForegroundColor Green
        Write-Host "Response: $($webResponse.Content)" -ForegroundColor White
    } catch {
        Write-Host "❌ Alternative method failed: $($_.Exception.Message)" -ForegroundColor Red
        
        # Method 3: Use file system approach
        Write-Host "Trying file system method..." -ForegroundColor Yellow
        
        # Create a temp directory for n8n workflows
        $tempWorkflowDir = "temp-n8n-workflows"
        if (-not (Test-Path $tempWorkflowDir)) {
            New-Item -ItemType Directory -Path $tempWorkflowDir | Out-Null
        }
        
        # Copy workflow with a UUID name
        $workflowUuid = [System.Guid]::NewGuid().ToString()
        $targetFile = Join-Path $tempWorkflowDir "$workflowUuid.json"
        Copy-Item "taiga-20-section-workflow.json" $targetFile
        Write-Host "✅ Workflow copied to: $targetFile" -ForegroundColor Green
        Write-Host "Manual step: Copy this file to your n8n workflows directory" -ForegroundColor Yellow
    }
}

# Step 3: Test if it worked
Write-Host "Step 3: Testing if workflow is now active..." -ForegroundColor Cyan

Start-Sleep -Seconds 2

$testPayload = @{
    action = "create"
    type = "task"
    subject = "Research on TestCompany Fix"
    id = 888888
} | ConvertTo-Json

try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:5678/webhook/taiga-webhook" -Method POST -Body $testPayload -Headers @{"Content-Type" = "application/json"} -TimeoutSec 15
    
    Write-Host "🎉🎉🎉 ISSUE COMPLETELY FIXED! 🎉🎉🎉" -ForegroundColor Green
    Write-Host "Webhook is now working!" -ForegroundColor Green
    Write-Host "Response: $testResponse" -ForegroundColor White
    
    Write-Host "`n✅ NOW TEST IN TAIGA:" -ForegroundColor Green
    Write-Host "1. Go to: http://localhost:9000" -ForegroundColor White
    Write-Host "2. Login: admin / admin123" -ForegroundColor White
    Write-Host "3. Create task: 'Research on Tesla'" -ForegroundColor White
    Write-Host "4. Watch 20 User Stories appear!" -ForegroundColor White
    
} catch {
    Write-Host "⚠️ Webhook still not responding. Trying one more approach..." -ForegroundColor Yellow
    
    # Final method: Direct activation
    Write-Host "Attempting direct workflow activation..." -ForegroundColor Cyan
    
    try {
        # Try to get existing workflows and activate them
        $workflowsList = Invoke-RestMethod -Uri "http://localhost:5678/rest/workflows" -Method GET -Headers $headers -TimeoutSec 10
        Write-Host "Found existing workflows to activate" -ForegroundColor Yellow
        
        foreach ($workflow in $workflowsList) {
            if ($workflow.name -like "*Due Diligence*" -or $workflow.name -like "*Taiga*") {
                try {
                    $activateUrl = "http://localhost:5678/rest/workflows/$($workflow.id)/activate"
                    Invoke-RestMethod -Uri $activateUrl -Method POST -Headers $headers -TimeoutSec 10
                    Write-Host "✅ Activated workflow: $($workflow.name)" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️ Could not activate: $($workflow.name)" -ForegroundColor Yellow
                }
            }
        }
        
    } catch {
        Write-Host "❌ Could not access workflows list" -ForegroundColor Red
    }
    
    Write-Host "`n🔧 MANUAL FIX STEPS:" -ForegroundColor Yellow
    Write-Host "1. Open: http://localhost:5678" -ForegroundColor White
    Write-Host "2. Click 'Import workflow'" -ForegroundColor White
    Write-Host "3. Select: taiga-20-section-workflow.json" -ForegroundColor White
    Write-Host "4. Click 'Save' and 'Activate'" -ForegroundColor White
    Write-Host "5. Test webhook at: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White
}

Write-Host "`n🚀 IMPORT ATTEMPT COMPLETE!" -ForegroundColor Green
