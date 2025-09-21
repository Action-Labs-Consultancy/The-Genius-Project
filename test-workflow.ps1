Write-Host "Testing Due Diligence Workflow" -ForegroundColor Green

$testData = @{
    company = "Tesla"
    project = 1
} | ConvertTo-Json

Write-Host "Sending test request to workflow..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:5678/webhook/research-request" -ForegroundColor Cyan
Write-Host "Data: $testData" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5678/webhook/research-request' -Method POST -Headers @{'Content-Type' = 'application/json'} -Body $testData
    Write-Host "SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Check Taiga for created User Stories!" -ForegroundColor Yellow
    Write-Host "Taiga URL: http://localhost:9000" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure workflow is imported and activated in n8n" -ForegroundColor Yellow
}
