Write-Host "=== TESTING COMPLETE RESEARCH WORKFLOW ===" -ForegroundColor Green
Write-Host ""

# Test data exactly as specified
$testData = @{
    company = "Tesla Inc."
} | ConvertTo-Json

Write-Host "📤 Sending test request..." -ForegroundColor Yellow
Write-Host "Company: Tesla Inc." -ForegroundColor Cyan
Write-Host "Expected: 20 sections processed by LLM and saved to database" -ForegroundColor Cyan
Write-Host ""

# Try both possible n8n ports
$webhookUrls = @(
    "http://localhost:9000/webhook-test/research-request",
    "http://localhost:5678/webhook-test/research-request"
)

$success = $false
foreach ($url in $webhookUrls) {
    try {
        Write-Host "Trying: $url" -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $url -Method POST -Headers @{'Content-Type' = 'application/json'} -Body $testData -TimeoutSec 60
        
        Write-Host "🎉 SUCCESS!" -ForegroundColor Green
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor White
        
        Write-Host ""
        Write-Host "✅ Workflow executed successfully!" -ForegroundColor Green
        Write-Host "✅ 20 sections should be processing..." -ForegroundColor Green
        Write-Host "✅ LLM generating analysis for each section..." -ForegroundColor Green
        Write-Host "✅ Results being saved to research_results table..." -ForegroundColor Green
        
        $success = $true
        break
        
    } catch {
        Write-Host "❌ Failed on $url" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

if (-not $success) {
    Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "1. Ensure n8n is running on localhost:9000 or localhost:5678" -ForegroundColor White
    Write-Host "2. Verify workflow is imported and activated" -ForegroundColor White
    Write-Host "3. Check LLM is running on localhost:8000" -ForegroundColor White
    Write-Host "4. Ensure PostgreSQL credentials are configured in n8n" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual test command:" -ForegroundColor Cyan
    Write-Host "curl -X POST http://localhost:9000/webhook-test/research-request -H \"Content-Type: application/json\" -d '{\"company\": \"Tesla Inc.\"}'" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 TO CHECK RESULTS:" -ForegroundColor Cyan
Write-Host "SELECT * FROM research_results WHERE company = 'Tesla Inc.' ORDER BY created_at;" -ForegroundColor White
