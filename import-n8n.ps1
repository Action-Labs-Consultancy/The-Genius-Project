Write-Host "Importing 20-Section Due Diligence Workflow to n8n" -ForegroundColor Green

try {
    Write-Host "1. Logging into n8n..." -ForegroundColor Yellow
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $headers = @{'Content-Type' = 'application/json'}
    $loginData = @{
        emailOrLdapLoginId = 'admin@example.com'
        password = 'GlassDoor2025!'
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri 'http://localhost:5678/rest/login' -Method POST -Headers $headers -Body $loginData -SessionVariable session
    Write-Host "Login successful! Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    
    Write-Host "2. Reading workflow file..." -ForegroundColor Yellow
    $workflowJson = Get-Content -Path 'taiga-20-section-workflow.json' -Raw
    Write-Host "Workflow loaded: $($workflowJson.Length) characters" -ForegroundColor Green
    
    Write-Host "3. Importing workflow..." -ForegroundColor Yellow
    $importHeaders = @{'Content-Type' = 'application/json'}
    $importResponse = Invoke-WebRequest -Uri 'http://localhost:5678/rest/workflows/import' -Method POST -Headers $importHeaders -Body $workflowJson -WebSession $session
    Write-Host "Import successful! Status: $($importResponse.StatusCode)" -ForegroundColor Green
    
    $importData = $importResponse.Content | ConvertFrom-Json
    $workflowId = $importData.data.id
    Write-Host "Workflow ID: $workflowId" -ForegroundColor Green
    
    Write-Host "4. Activating workflow..." -ForegroundColor Yellow
    $activateData = @{active = $true} | ConvertTo-Json
    $activateResponse = Invoke-WebRequest -Uri "http://localhost:5678/rest/workflows/$workflowId" -Method PATCH -Headers $importHeaders -Body $activateData -WebSession $session
    Write-Host "Workflow activated! Status: $($activateResponse.StatusCode)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "SUCCESS! Workflow is now active and ready!" -ForegroundColor Green
    Write-Host "Test it by creating a task in Taiga with subject: Research on Tesla" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
}
