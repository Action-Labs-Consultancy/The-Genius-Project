Write-Host "IMPORTING 100% WORKING RESEARCH WORKFLOW" -ForegroundColor Green

try {
    Write-Host "1. Logging into n8n..." -ForegroundColor Yellow
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $headers = @{'Content-Type' = 'application/json'}
    $loginData = @{emailOrLdapLoginId = 'admin@example.com'; password = 'GlassDoor2025!'} | ConvertTo-Json
    
    # Try port 9000 first as specified
    try {
        $loginResponse = Invoke-WebRequest -Uri 'http://localhost:9000/rest/login' -Method POST -Headers $headers -Body $loginData -SessionVariable session
        $n8nUrl = "http://localhost:9000"
        Write-Host "Logged into n8n on port 9000!" -ForegroundColor Green
    } catch {
        $loginResponse = Invoke-WebRequest -Uri 'http://localhost:5678/rest/login' -Method POST -Headers $headers -Body $loginData -SessionVariable session
        $n8nUrl = "http://localhost:5678"
        Write-Host "Logged into n8n on port 5678!" -ForegroundColor Green
    }
    
    Write-Host "2. Reading workflow..." -ForegroundColor Yellow
    $workflowJson = Get-Content -Path 'research-workflow-complete.json' -Raw
    Write-Host "Workflow loaded: $($workflowJson.Length) characters" -ForegroundColor Green
    
    Write-Host "3. Creating workflow..." -ForegroundColor Yellow
    $createResponse = Invoke-WebRequest -Uri "$n8nUrl/rest/workflows" -Method POST -Headers @{'Content-Type' = 'application/json'} -Body $workflowJson -WebSession $session
    $workflowData = $createResponse.Content | ConvertFrom-Json
    $workflowId = $workflowData.data.id
    Write-Host "Workflow created! ID: $workflowId" -ForegroundColor Green
    
    Write-Host "4. Activating workflow..." -ForegroundColor Yellow
    $activateData = @{active = $true} | ConvertTo-Json
    $activateResponse = Invoke-WebRequest -Uri "$n8nUrl/rest/workflows/$workflowId" -Method PATCH -Headers @{'Content-Type' = 'application/json'} -Body $activateData -WebSession $session
    Write-Host "Workflow activated!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "SUCCESS! Workflow is ready!" -ForegroundColor Green
    Write-Host "Webhook URL: $n8nUrl/webhook-test/research-request" -ForegroundColor Cyan
    Write-Host "Test with: {\"company\": \"Tesla Inc.\"}" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Manual import required - n8n should be open" -ForegroundColor Yellow
}
