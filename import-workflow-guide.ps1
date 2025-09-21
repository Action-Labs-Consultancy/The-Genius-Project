# Import n8n Workflow - Step by Step Guide
Write-Host "=== n8n WORKFLOW IMPORT GUIDE ===" -ForegroundColor Green

Write-Host "`n📋 MANUAL IMPORT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open n8n interface: http://localhost:5678" -ForegroundColor White
Write-Host "2. Click 'Add workflow' or '+' button" -ForegroundColor White
Write-Host "3. Click 'Import from file' or paste JSON" -ForegroundColor White
Write-Host "4. Select file: taiga-20-section-workflow.json" -ForegroundColor White
Write-Host "5. Click 'Import'" -ForegroundColor White
Write-Host "6. Click the workflow toggle to ACTIVATE it" -ForegroundColor White

Write-Host "`n🔍 WHAT TO LOOK FOR:" -ForegroundColor Cyan
Write-Host "• Workflow name: '20-Section Due Diligence Automation System'" -ForegroundColor White
Write-Host "• Status: ACTIVE (toggle should be ON)" -ForegroundColor White
Write-Host "• Webhook URL: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White

Write-Host "`n🧪 TEST AFTER IMPORT:" -ForegroundColor Cyan
Write-Host "1. Go to Taiga: http://localhost:9000" -ForegroundColor White
Write-Host "2. Login: admin / admin123" -ForegroundColor White
Write-Host "3. Create task with subject: 'Research on Tesla'" -ForegroundColor White
Write-Host "4. Wait 30-60 seconds" -ForegroundColor White
Write-Host "5. Refresh Taiga page" -ForegroundColor White
Write-Host "6. You should see 20 new User Stories created!" -ForegroundColor White

Write-Host "`n📁 FILE LOCATION:" -ForegroundColor Cyan
Write-Host "Workflow file: taiga-20-section-workflow.json" -ForegroundColor White
Write-Host "Current directory: $(Get-Location)" -ForegroundColor White

# Check if workflow file exists
if (Test-Path "taiga-20-section-workflow.json") {
    Write-Host "✅ Workflow file found!" -ForegroundColor Green
    $fileSize = (Get-Item "taiga-20-section-workflow.json").Length
    Write-Host "File size: $fileSize bytes" -ForegroundColor Yellow
} else {
    Write-Host "❌ Workflow file not found!" -ForegroundColor Red
}

Write-Host "`n🚀 QUICK START:" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:5678" -ForegroundColor White
Write-Host "2. Import: taiga-20-section-workflow.json" -ForegroundColor White
Write-Host "3. Activate the workflow" -ForegroundColor White
Write-Host "4. Test in Taiga!" -ForegroundColor White
