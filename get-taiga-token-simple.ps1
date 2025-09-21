Write-Host "Getting Taiga Authentication Token..." -ForegroundColor Yellow

$loginData = @{
    username = "admin"
    password = "123123" 
    type = "normal"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/auth" -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "SUCCESS! Auth token retrieved:" -ForegroundColor Green
    Write-Host ""
    Write-Host "AUTH TOKEN: $($authResponse.auth_token)" -ForegroundColor White -BackgroundColor Black
    Write-Host ""
    Write-Host "User ID: $($authResponse.id)" -ForegroundColor Cyan
    Write-Host "Username: $($authResponse.username)" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: Failed to get token" -ForegroundColor Red
    Write-Host "Make sure Taiga is running on localhost:8001" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next: Import taiga-circle-workflow.json into n8n and use this token" -ForegroundColor Green
