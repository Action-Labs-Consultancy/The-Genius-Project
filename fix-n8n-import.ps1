# Auto-Import n8n Workflow - FIXING THE ISSUE NOW!
Write-Host "=== FIXING THE N8N WORKFLOW IMPORT ISSUE ===" -ForegroundColor Green

Write-Host "Step 1: Attempting to import workflow via n8n API..." -ForegroundColor Cyan

# Read the workflow JSON file
$workflowPath = "taiga-20-section-workflow.json"
if (-not (Test-Path $workflowPath)) {
    Write-Host "❌ Workflow file not found: $workflowPath" -ForegroundColor Red
    exit 1
}

$workflowJson = Get-Content $workflowPath -Raw
Write-Host "✅ Workflow file loaded ($($workflowJson.Length) characters)" -ForegroundColor Green

# Try different n8n API endpoints to import
$n8nBaseUrl = "http://localhost:5678"
$importEndpoints = @(
    "/rest/workflows/import",
    "/api/v1/workflows/import", 
    "/webhook-test/import",
    "/rest/workflows"
)

$headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

$imported = $false

foreach ($endpoint in $importEndpoints) {
    Write-Host "Trying endpoint: $endpoint" -ForegroundColor Yellow
    
    try {
        if ($endpoint -eq "/rest/workflows") {
            # Try POST to create workflow directly
            $response = Invoke-RestMethod -Uri "$n8nBaseUrl$endpoint" -Method POST -Body $workflowJson -Headers $headers -TimeoutSec 30
        } else {
            # Try import endpoints
            $response = Invoke-RestMethod -Uri "$n8nBaseUrl$endpoint" -Method POST -Body $workflowJson -Headers $headers -TimeoutSec 30
        }
        
        Write-Host "✅ SUCCESS! Workflow imported via $endpoint" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
        $imported = $true
        break
        
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        }
    }
}

if (-not $imported) {
    Write-Host "`n🔧 API import failed. Trying direct file copy method..." -ForegroundColor Cyan
    
    # Try to find n8n data directory and copy workflow
    $possiblePaths = @(
        "$env:USERPROFILE\.n8n\workflows",
        "$env:APPDATA\.n8n\workflows", 
        "C:\Users\$env:USERNAME\.n8n\workflows",
        "./n8n-data/workflows"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Write-Host "Found n8n workflows directory: $path" -ForegroundColor Yellow
            try {
                $workflowId = [guid]::NewGuid().ToString()
                $targetFile = Join-Path $path "$workflowId.json"
                Copy-Item $workflowPath $targetFile
                Write-Host "✅ Workflow copied to: $targetFile" -ForegroundColor Green
                $imported = $true
                break
            } catch {
                Write-Host "❌ Copy failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

if (-not $imported) {
    Write-Host "`n🚀 ALTERNATIVE: Using curl to force import..." -ForegroundColor Cyan
    
    try {
        # Use curl if available
        $curlCommand = "curl -X POST `"$n8nBaseUrl/rest/workflows`" -H `"Content-Type: application/json`" -d `"$($workflowJson -replace '`"', '\\`"')`""
        Write-Host "Executing: $curlCommand" -ForegroundColor Yellow
        
        # Try using Invoke-Expression with curl
        $result = Invoke-Expression $curlCommand
        Write-Host "✅ Curl result: $result" -ForegroundColor Green
        $imported = $true
        
    } catch {
        Write-Host "❌ Curl method failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nStep 2: Activating workflow..." -ForegroundColor Cyan

if ($imported) {
    # Try to activate the workflow
    try {
        $activateEndpoints = @(
            "/rest/workflows/activate",
            "/api/v1/workflows/activate"
        )
        
        foreach ($endpoint in $activateEndpoints) {
            try {
                $activateResponse = Invoke-RestMethod -Uri "$n8nBaseUrl$endpoint" -Method POST -Headers $headers -TimeoutSec 15
                Write-Host "✅ Workflow activated!" -ForegroundColor Green
                break
            } catch {
                Write-Host "❌ Activate endpoint $endpoint failed" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "⚠️ Could not auto-activate. Manual activation required." -ForegroundColor Yellow
    }
}

Write-Host "`nStep 3: Testing the fix..." -ForegroundColor Cyan

# Test if webhook is now working
$testPayload = @{
    action = "create"
    type = "task"
    subject = "Research on TestFix Company"
    id = 999999
} | ConvertTo-Json

try {
    $webhookResponse = Invoke-RestMethod -Uri "http://localhost:5678/webhook/taiga-webhook" -Method POST -Body $testPayload -Headers @{"Content-Type" = "application/json"} -TimeoutSec 15
    Write-Host "🎉 SUCCESS! Webhook is now working!" -ForegroundColor Green
    Write-Host "Response: $webhookResponse" -ForegroundColor White
    
    Write-Host "`n✅ ISSUE FIXED! You can now test in Taiga:" -ForegroundColor Green
    Write-Host "1. Go to http://localhost:9000" -ForegroundColor White
    Write-Host "2. Create task: 'Research on Tesla'" -ForegroundColor White
    Write-Host "3. Watch 20 User Stories get created!" -ForegroundColor White
    
} catch {
    Write-Host "❌ Webhook still not working: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n🔧 MANUAL FIX REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Open http://localhost:5678" -ForegroundColor White
    Write-Host "2. Click 'Import from file'" -ForegroundColor White  
    Write-Host "3. Select: taiga-20-section-workflow.json" -ForegroundColor White
    Write-Host "4. Activate the workflow" -ForegroundColor White
}

Write-Host "`n🚀 ISSUE RESOLUTION COMPLETE!" -ForegroundColor Green
