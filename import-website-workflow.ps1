Write-Host "Importing Website Research Workflow" -ForegroundColor Green

try {
    Write-Host "1. Logging into n8n..." -ForegroundColor Yellow
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $headers = @{'Content-Type' = 'application/json'}
    $loginData = @{emailOrLdapLoginId = 'admin@example.com'; password = 'GlassDoor2025!'} | ConvertTo-Json
    $loginResponse = Invoke-WebRequest -Uri 'http://localhost:5678/rest/login' -Method POST -Headers $headers -Body $loginData -SessionVariable session
    Write-Host "Login successful! Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    
    Write-Host "2. Reading website workflow..." -ForegroundColor Yellow
    $workflowJson = Get-Content -Path 'website-research-workflow.json' -Raw
    Write-Host "Workflow loaded: $($workflowJson.Length) characters" -ForegroundColor Green
    
    Write-Host "3. Creating workflow..." -ForegroundColor Yellow
    $createResponse = Invoke-WebRequest -Uri 'http://localhost:5678/rest/workflows' -Method POST -Headers @{'Content-Type' = 'application/json'} -Body $workflowJson -WebSession $session
    Write-Host "Workflow created! Status: $($createResponse.StatusCode)" -ForegroundColor Green
    
    $workflowData = $createResponse.Content | ConvertFrom-Json
    $workflowId = $workflowData.data.id
    Write-Host "Workflow ID: $workflowId" -ForegroundColor Green
    
    Write-Host "4. Activating workflow..." -ForegroundColor Yellow
    $activateData = @{active = $true} | ConvertTo-Json
    $activateResponse = Invoke-WebRequest -Uri "http://localhost:5678/rest/workflows/$workflowId" -Method PATCH -Headers @{'Content-Type' = 'application/json'} -Body $activateData -WebSession $session
    Write-Host "Workflow activated! Status: $($activateResponse.StatusCode)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "SUCCESS! Website Research Workflow is ready!" -ForegroundColor Green
    Write-Host "Webhook URL: http://localhost:5678/webhook/research-webhook" -ForegroundColor Cyan
    Write-Host "Test with: {\"company\": \"Tesla\"}" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
