Write-Host "Testing Website Research Workflow" -ForegroundColor Green

# Test data for the webhook
$testData = @{
    company = "Tesla"
} | ConvertTo-Json

Write-Host "Sending test request..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:5678/webhook/research-webhook" -ForegroundColor Cyan
Write-Host "Data: $testData" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5678/webhook/research-webhook' -Method POST -Headers @{'Content-Type' = 'application/json'} -Body $testData
    Write-Host "SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Workflow should process 20 sections for Tesla and store in PostgreSQL!" -ForegroundColor Yellow
    Write-Host "Check your research_results table for the data." -ForegroundColor Cyan
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure workflow is imported and activated in n8n" -ForegroundColor Yellow
    Write-Host "Also ensure PostgreSQL is running and database/table exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To setup PostgreSQL database, run:" -ForegroundColor Green
Write-Host "psql -U postgres -d your_database -f setup-database.sql" -ForegroundColor Cyan
