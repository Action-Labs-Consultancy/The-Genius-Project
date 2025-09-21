# Get Taiga Authentication Token for n8n Integration

Write-Host "🔐 Getting Taiga Authentication Token..." -ForegroundColor Yellow
Write-Host ""

# Taiga login credentials
$loginData = @{
    username = "admin"
    password = "123123" 
    type = "normal"
} | ConvertTo-Json

try {
    Write-Host "📡 Connecting to Taiga API..." -ForegroundColor Cyan
    $authResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth" -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "✅ SUCCESS! Authentication token retrieved:" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔑 AUTH TOKEN: $($authResponse.auth_token)" -ForegroundColor White -BackgroundColor Black
    Write-Host ""
    Write-Host "📋 Copy this token and use it in your n8n workflow HTTP Request nodes" -ForegroundColor Yellow
    Write-Host "Replace 'taiga-auth-token' with this value in both:" -ForegroundColor Yellow
    Write-Host "- Create Human Review Subtask node" -ForegroundColor Cyan
    Write-Host "- Create Auto-Analysis Subtask node" -ForegroundColor Cyan
    Write-Host ""
    
    # Also get user info
    Write-Host "👤 User Info:" -ForegroundColor Magenta
    Write-Host "User ID: $($authResponse.id)" -ForegroundColor White
    Write-Host "Username: $($authResponse.username)" -ForegroundColor White
    Write-Host "Email: $($authResponse.email)" -ForegroundColor White
    
} catch {
    Write-Host "❌ ERROR: Failed to get authentication token" -ForegroundColor Red
    Write-Host "🔍 Make sure Taiga is running on http://localhost:8000" -ForegroundColor Yellow
    Write-Host "🔍 Check credentials: admin / 123123" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Next Steps:" -ForegroundColor Green
Write-Host "1. Copy the AUTH TOKEN above" -ForegroundColor White
Write-Host "2. Import taiga-circle-workflow.json into n8n" -ForegroundColor White
Write-Host "3. Update both HTTP Request nodes with the token" -ForegroundColor White
Write-Host "4. Activate the workflow" -ForegroundColor White
Write-Host "5. Test by creating a task in Taiga!" -ForegroundColor White
