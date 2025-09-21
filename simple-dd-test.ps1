# Test Complete DD System
Write-Host "Testing 20-Section Due Diligence System" -ForegroundColor Green

# Check services
Write-Host "1. Checking services..." -ForegroundColor Cyan

try {
    Invoke-WebRequest -Uri "http://localhost:5678/healthz" -TimeoutSec 5 | Out-Null
    Write-Host "✅ n8n: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n: Not accessible" -ForegroundColor Red
}

try {
    Invoke-WebRequest -Uri "http://localhost:9000" -TimeoutSec 5 | Out-Null
    Write-Host "✅ Taiga: Running" -ForegroundColor Green  
} catch {
    Write-Host "❌ Taiga: Not accessible" -ForegroundColor Red
}

try {
    Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 | Out-Null
    Write-Host "✅ Ollama/Mistral: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama/Mistral: Not accessible" -ForegroundColor Red
}

# Test webhook endpoint
Write-Host "`n2. Testing webhook endpoint..." -ForegroundColor Cyan

$testPayload = @{
    action = "create"
    type = "task"
    subject = "Research on Apple Inc"
    id = 12345
    version = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5678/webhook/taiga-webhook" -Method POST -Body $testPayload -Headers @{"Content-Type" = "application/json"} -TimeoutSec 30
    Write-Host "✅ Webhook responded successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Webhook failed (expected if workflow not active)" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test AI generation
Write-Host "`n3. Testing AI generation..." -ForegroundColor Cyan

$aiPrompt = "Generate a comprehensive due diligence analysis for Apple Inc specifically for Financial Analysis section. Include revenue trends, profitability, and key financial metrics."

$aiBody = @{
    model = "mistral"
    prompt = $aiPrompt
    stream = $false
} | ConvertTo-Json

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method POST -Body $aiBody -Headers @{"Content-Type" = "application/json"} -TimeoutSec 45
    Write-Host "✅ AI generated $($aiResponse.response.Length) characters" -ForegroundColor Green
} catch {
    Write-Host "❌ AI generation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nSYSTEM STATUS:" -ForegroundColor Yellow
Write-Host "📍 WHERE TO TRIGGER:" -ForegroundColor Cyan
Write-Host "  1. Taiga Web: http://localhost:9000" -ForegroundColor White
Write-Host "     → Login: admin/admin123" -ForegroundColor White
Write-Host "     → Create task: 'Research on [Company Name]'" -ForegroundColor White
Write-Host ""
Write-Host "  2. Webhook: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White
Write-Host "     → POST JSON with company name" -ForegroundColor White
Write-Host ""
Write-Host "📋 WHAT IT CREATES:" -ForegroundColor Cyan
Write-Host "  → 20 User Stories (one per due diligence section)" -ForegroundColor White
Write-Host "  → AI-generated analysis for each section" -ForegroundColor White
Write-Host "  → Role assignments (Maker, Checker, Approver, QA)" -ForegroundColor White
Write-Host "  → Individual tasks with compliance tracking" -ForegroundColor White
Write-Host ""
Write-Host "🔧 TO ACTIVATE:" -ForegroundColor Cyan
Write-Host "  1. Import taiga-20-section-workflow.json into n8n" -ForegroundColor White
Write-Host "  2. Activate the workflow" -ForegroundColor White
Write-Host "  3. Test with any company name" -ForegroundColor White
