Write-Host "🚀 IMMEDIATE FIX: Importing 20-Section Due Diligence Workflow" -ForegroundColor Green
Write-Host ""

# Check services
Write-Host "1. Checking services..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -TimeoutSec 5 | Out-Null
    Write-Host "✅ n8n is running" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n not running - start with: docker-compose up -d" -ForegroundColor Red
    exit 1
}

try {
    Invoke-WebRequest -Uri "http://localhost:9000" -Method GET -TimeoutSec 5 | Out-Null
    Write-Host "✅ Taiga is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Taiga not running" -ForegroundColor Red
    exit 1
}

try {
    Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 | Out-Null
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama not running" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 WORKFLOW NOT IMPORTED YET!" -ForegroundColor Red
Write-Host "You need to manually import the workflow:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: http://localhost:5678" -ForegroundColor Cyan
Write-Host "2. Click 'Import workflow' button" -ForegroundColor Cyan
Write-Host "3. Select 'Import from file'" -ForegroundColor Cyan
Write-Host "4. Choose: taiga-20-section-workflow.json" -ForegroundColor Cyan
Write-Host "5. Click 'Save' then 'Activate'" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 THEN TEST WITH:" -ForegroundColor Green
Write-Host "- Go to Taiga: http://localhost:9000" -ForegroundColor Yellow
Write-Host "- Login: admin / admin123" -ForegroundColor Yellow
Write-Host "- Create task: 'Research on Tesla'" -ForegroundColor Yellow
Write-Host "- Should create 20 User Stories!" -ForegroundColor Yellow
Write-Host ""

# Open browsers
Start-Process "http://localhost:5678"
Start-Sleep 2
Start-Process "http://localhost:9000"

Write-Host "✅ Browsers opened - follow steps above!" -ForegroundColor Green
