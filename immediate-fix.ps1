# IMMEDIATE FIX - Import and Activate Workflow
Write-Host "🚀 IMMEDIATE FIX: Importing 20-Section Due Diligence Workflow" -ForegroundColor Green

# Check if n8n is running
Write-Host "1. Checking n8n status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -TimeoutSec 5
    Write-Host "✅ n8n is running on localhost:5678" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n is not accessible! Please start n8n first:" -ForegroundColor Red
    Write-Host "   docker-compose up -d" -ForegroundColor Cyan
    exit 1
}

# Check if Taiga is running
Write-Host "2. Checking Taiga status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000" -Method GET -TimeoutSec 5
    Write-Host "✅ Taiga is running on localhost:9000" -ForegroundColor Green
} catch {
    Write-Host "❌ Taiga is not accessible!" -ForegroundColor Red
    exit 1
}

# Check if Ollama/Mistral is running
Write-Host "3. Checking Ollama/Mistral status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
    Write-Host "✅ Ollama is running on localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not accessible!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔧 MANUAL IMPORT REQUIRED:" -ForegroundColor Red
Write-Host "Since the API import failed, you need to manually import the workflow:" -ForegroundColor Yellow
Write-Host ""
Write-Host "STEP 1: Open n8n web interface" -ForegroundColor Cyan
Write-Host "   → http://localhost:5678" -ForegroundColor White
Write-Host ""
Write-Host "STEP 2: Click 'Import workflow' button (top-right)" -ForegroundColor Cyan
Write-Host ""
Write-Host "STEP 3: Select 'Import from file'" -ForegroundColor Cyan
Write-Host ""
Write-Host "STEP 4: Choose this file:" -ForegroundColor Cyan
Write-Host "   → taiga-20-section-workflow.json" -ForegroundColor White
Write-Host ""
Write-Host "STEP 5: Click 'Save' and then 'Activate' the workflow" -ForegroundColor Cyan
Write-Host ""

# Create a test task immediately after import
Write-Host "🧪 IMMEDIATE TEST AFTER IMPORT:" -ForegroundColor Green
Write-Host "1. Go to Taiga: http://localhost:9000" -ForegroundColor Yellow
Write-Host "2. Login: admin / admin123" -ForegroundColor Yellow
Write-Host "3. Create a task with subject: 'Research on Tesla'" -ForegroundColor Yellow
Write-Host "4. You should see 20 User Stories created automatically!" -ForegroundColor Yellow
Write-Host ""

# Open both interfaces
Write-Host "Opening both interfaces for you..." -ForegroundColor Green
Start-Process "http://localhost:5678"
Start-Sleep 2
Start-Process "http://localhost:9000"

Write-Host "✅ READY! Follow the manual import steps above." -ForegroundColor Green
