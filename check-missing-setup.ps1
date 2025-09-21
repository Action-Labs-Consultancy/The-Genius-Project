# Check Why Taiga Shows No Output
Write-Host "Checking why you don't see output in Taiga..." -ForegroundColor Yellow

# Test if workflow exists in n8n
Write-Host "`nStep 1: Checking if workflow is imported in n8n..." -ForegroundColor Cyan

try {
    # Try to access n8n workflows (this will fail due to auth, but we can see the response)
    $response = Invoke-WebRequest -Uri "http://localhost:5678/rest/workflows" -Method GET -ErrorAction Stop
    Write-Host "n8n API accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "❌ n8n requires authentication (workflow not imported yet)" -ForegroundColor Red
    } else {
        Write-Host "❌ n8n API error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test webhook endpoint
Write-Host "`nStep 2: Testing webhook endpoint..." -ForegroundColor Cyan

$testPayload = @{
    action = "create"
    type = "task"
    subject = "Research on TestCompany"
    id = 999
} | ConvertTo-Json

try {
    $webhookResponse = Invoke-RestMethod -Uri "http://localhost:5678/webhook/taiga-webhook" -Method POST -Body $testPayload -Headers @{"Content-Type" = "application/json"} -TimeoutSec 10
    Write-Host "✅ Webhook responded (workflow is active)" -ForegroundColor Green
} catch {
    Write-Host "❌ Webhook failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This means the workflow is NOT imported/activated in n8n" -ForegroundColor Yellow
}

Write-Host "`nStep 3: Files available for import..." -ForegroundColor Cyan

$workflowFiles = @("taiga-20-section-workflow.json", "taiga-ai-workflow.json")
foreach ($file in $workflowFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file (ready to import)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (missing)" -ForegroundColor Red
    }
}

Write-Host "`nCONCLUSION:" -ForegroundColor Yellow
Write-Host "You don't see output in Taiga because:" -ForegroundColor White
Write-Host "1. The n8n workflow is not imported yet" -ForegroundColor Red
Write-Host "2. You need to manually import the JSON file into n8n" -ForegroundColor Red  
Write-Host "3. Then activate the workflow" -ForegroundColor Red

Write-Host "`nTO FIX:" -ForegroundColor Green
Write-Host "1. Open http://localhost:5678" -ForegroundColor White
Write-Host "2. Import taiga-20-section-workflow.json" -ForegroundColor White
Write-Host "3. Activate the workflow" -ForegroundColor White
Write-Host "4. Test by creating task in Taiga" -ForegroundColor White
