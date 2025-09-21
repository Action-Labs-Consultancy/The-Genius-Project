Write-Host "Testing webhook endpoint..." -ForegroundColor Yellow

try {
    # Test if webhook is working by sending a test request
    $testData = @{
        company = "Tesla"
        project = 1
    } | ConvertTo-Json
    
    Write-Host "Sending test request to webhook..." -ForegroundColor Yellow
    $webhookResponse = Invoke-WebRequest -Uri 'http://localhost:5678/webhook/research-request' -Method POST -Headers @{'Content-Type' = 'application/json'} -Body $testData
    Write-Host "Webhook test successful! Status: $($webhookResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($webhookResponse.Content)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Webhook not available yet - needs manual import first" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "MANUAL IMPORT REQUIRED:" -ForegroundColor Red
Write-Host "1. Open: http://localhost:5678" -ForegroundColor Cyan
Write-Host "2. Login: admin@example.com / GlassDoor2025!" -ForegroundColor Cyan
Write-Host "3. Click + button then Import" -ForegroundColor Cyan
Write-Host "4. Select Import from file" -ForegroundColor Cyan
Write-Host "5. Choose: fixed-dd-workflow.json" -ForegroundColor Cyan
Write-Host "6. Save and Activate" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then test with:" -ForegroundColor Green
Write-Host "POST http://localhost:5678/webhook/research-request" -ForegroundColor White
Write-Host "Body: {\"company\": \"Tesla\", \"project\": 1}" -ForegroundColor White
