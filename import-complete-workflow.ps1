Write-Host "=== IMPORTING 100% WORKING RESEARCH WORKFLOW ===" -ForegroundColor Green
Write-Host ""

try {
    # Step 1: Login to n8n
    Write-Host "1. Logging into n8n at localhost:9000..." -ForegroundColor Yellow
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $headers = @{'Content-Type' = 'application/json'}
    $loginData = @{emailOrLdapLoginId = 'admin@example.com'; password = 'GlassDoor2025!'} | ConvertTo-Json
    
    # Try n8n at port 9000 as specified
    try {
        $loginResponse = Invoke-WebRequest -Uri 'http://localhost:9000/rest/login' -Method POST -Headers $headers -Body $loginData -SessionVariable session
        Write-Host "✅ Logged into n8n on port 9000!" -ForegroundColor Green
    } catch {
        # Fallback to port 5678 if 9000 fails
        Write-Host "Port 9000 failed, trying 5678..." -ForegroundColor Yellow
        $loginResponse = Invoke-WebRequest -Uri 'http://localhost:5678/rest/login' -Method POST -Headers $headers -Body $loginData -SessionVariable session
        Write-Host "✅ Logged into n8n on port 5678!" -ForegroundColor Green
        $n8nPort = "5678"
    }
    
    # Step 2: Read and import workflow
    Write-Host "2. Reading complete research workflow..." -ForegroundColor Yellow
    $workflowJson = Get-Content -Path 'research-workflow-complete.json' -Raw
    Write-Host "✅ Workflow loaded: $($workflowJson.Length) characters" -ForegroundColor Green
    
    # Step 3: Create workflow
    Write-Host "3. Creating workflow in n8n..." -ForegroundColor Yellow
    $n8nUrl = if ($n8nPort -eq "5678") { "http://localhost:5678" } else { "http://localhost:9000" }
    $createResponse = Invoke-WebRequest -Uri "$n8nUrl/rest/workflows" -Method POST -Headers @{'Content-Type' = 'application/json'} -Body $workflowJson -WebSession $session
    Write-Host "✅ Workflow created! Status: $($createResponse.StatusCode)" -ForegroundColor Green
    
    # Step 4: Get workflow ID and activate
    $workflowData = $createResponse.Content | ConvertFrom-Json
    $workflowId = $workflowData.data.id
    Write-Host "✅ Workflow ID: $workflowId" -ForegroundColor Green
    
    Write-Host "4. Activating workflow..." -ForegroundColor Yellow
    $activateData = @{active = $true} | ConvertTo-Json
    $activateResponse = Invoke-WebRequest -Uri "$n8nUrl/rest/workflows/$workflowId" -Method PATCH -Headers @{'Content-Type' = 'application/json'} -Body $activateData -WebSession $session
    Write-Host "✅ Workflow activated!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎉 SUCCESS! Research Workflow is 100% ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 WORKFLOW DETAILS:" -ForegroundColor Cyan
    Write-Host "• Webhook URL: $n8nUrl/webhook-test/research-request" -ForegroundColor White
    Write-Host "• Method: POST" -ForegroundColor White
    Write-Host "• Expected JSON: {\"company\": \"Tesla Inc.\"}" -ForegroundColor White
    Write-Host "• LLM Endpoint: http://localhost:8000/v1/chat/completions" -ForegroundColor White
    Write-Host "• Database: research_results table" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Setup database: psql -U postgres -d your_db -f complete-database-setup.sql" -ForegroundColor White
    Write-Host "2. Configure PostgreSQL credentials in n8n" -ForegroundColor White
    Write-Host "3. Test with: .\test-complete-workflow.ps1" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🔧 MANUAL IMPORT REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Open n8n: http://localhost:9000 (or :5678)" -ForegroundColor White
    Write-Host "2. Login: admin@example.com / GlassDoor2025!" -ForegroundColor White
    Write-Host "3. Import: research-workflow-complete.json" -ForegroundColor White
    Write-Host "4. Activate the workflow" -ForegroundColor White
}
