# AI-Enhanced n8n Workflow Upgrade Script
Write-Host "🚀 Upgrading n8n workflow with AI-enhanced research generation..." -ForegroundColor Green

# Check if services are running
Write-Host "📊 Checking service status..."

try {
    $n8nResponse = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -Method GET -TimeoutSec 5
    Write-Host "✅ n8n is running" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n is not accessible. Please start it first." -ForegroundColor Red
    exit 1
}

try {
    $ollamaResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
    Write-Host "✅ Ollama/Mistral is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not accessible. Please start it first." -ForegroundColor Red
    exit 1
}

# Import the AI-enhanced workflow
Write-Host "📥 Importing AI-enhanced workflow..."

$workflowJson = Get-Content "taiga-ai-workflow.json" -Raw
$headers = @{
    "Content-Type" = "application/json"
}

try {
    $importResponse = Invoke-RestMethod -Uri "http://localhost:5678/rest/workflows/import" -Method POST -Body $workflowJson -Headers $headers
    Write-Host "✅ AI-enhanced workflow imported successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to import workflow: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get workflows and find the new one
Write-Host "🔄 Activating workflow..."

try {
    $workflows = Invoke-RestMethod -Uri "http://localhost:5678/rest/workflows" -Method GET
    $targetWorkflow = $workflows.data | Where-Object { $_.name -eq "Taiga Due Diligence Research with AI (Enhanced)" }
    
    if ($targetWorkflow) {
        $workflowId = $targetWorkflow.id
        $activateBody = @{ active = $true } | ConvertTo-Json
        
        $activateResponse = Invoke-RestMethod -Uri "http://localhost:5678/rest/workflows/$workflowId" -Method PATCH -Body $activateBody -Headers $headers
        Write-Host "✅ Workflow activated with ID: $workflowId" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not find workflow to activate" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️ Warning: Could not activate workflow automatically: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 AI Enhancement Summary:" -ForegroundColor Cyan
Write-Host "- Added Mistral LLM integration (localhost:11434)" -ForegroundColor White
Write-Host "- Comprehensive 10-section research reports" -ForegroundColor White
Write-Host "- Professional formatting with disclaimers" -ForegroundColor White
Write-Host "- Quality AI-generated content replaces templates" -ForegroundColor White
Write-Host ""
Write-Host "📋 Test the enhanced workflow:" -ForegroundColor Cyan
Write-Host "1. Create a task in Taiga with subject: 'Research on Tesla'" -ForegroundColor White
Write-Host "2. Watch n8n generate detailed AI analysis" -ForegroundColor White
Write-Host "3. Check task description for comprehensive report" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Access points:" -ForegroundColor Cyan
Write-Host "- n8n: http://localhost:5678" -ForegroundColor White
Write-Host "- Taiga: http://localhost:9000" -ForegroundColor White
Write-Host "- Webhook: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White
Write-Host ""
Write-Host "🧠 Local LLM Ready: Mistral model will generate detailed, professional research reports!" -ForegroundColor Green
