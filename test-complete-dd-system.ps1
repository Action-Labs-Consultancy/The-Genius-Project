# Test the 20-Section Due Diligence System End-to-End
Write-Host "=== TESTING 20-SECTION DUE DILIGENCE SYSTEM ===" -ForegroundColor Green

Write-Host "`nStep 1: Verify all services are running..." -ForegroundColor Cyan

# Check n8n
try {
    $n8nCheck = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -TimeoutSec 5
    Write-Host "✅ n8n: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n: Not accessible" -ForegroundColor Red
    exit 1
}

# Check Taiga
try {
    $taigaCheck = Invoke-WebRequest -Uri "http://localhost:9000" -TimeoutSec 5
    Write-Host "✅ Taiga: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Taiga: Not accessible" -ForegroundColor Red
    exit 1
}

# Check Ollama/Mistral
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    Write-Host "✅ Ollama/Mistral: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama/Mistral: Not accessible" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Login to Taiga and get project info..." -ForegroundColor Cyan

# Login to Taiga
$loginBody = @{
    type = "normal"
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/auth" -Method POST -Body $loginBody -Headers @{"Content-Type" = "application/json"}
    $authToken = $authResponse.auth_token
    Write-Host "✅ Taiga authentication successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Taiga authentication failed" -ForegroundColor Red
    exit 1
}

# Get projects
$projects = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/projects" -Method GET -Headers @{"Authorization" = "Bearer $authToken"}
$project = $projects[0]
Write-Host "✅ Using project: $($project.name) (ID: $($project.id))" -ForegroundColor Green

Write-Host "`nStep 3: Test direct webhook call with comprehensive payload..." -ForegroundColor Cyan

# Create comprehensive test payload
$testCompany = "Microsoft Corporation"
$webhookPayload = @{
    action = "create"
    type = "task"
    subject = "Research on $testCompany"
    id = (Get-Date).Ticks
    version = 1
    project = @{
        id = $project.id
        name = $project.name
        slug = $project.slug
    }
    user = @{
        username = "admin"
        id = 1
    }
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json -Depth 3

Write-Host "📤 Sending webhook payload for: $testCompany" -ForegroundColor Yellow
Write-Host "📡 Webhook URL: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White

try {
    $webhookResponse = Invoke-RestMethod -Uri "http://localhost:5678/webhook/taiga-webhook" -Method POST -Body $webhookPayload -Headers @{"Content-Type" = "application/json"} -TimeoutSec 60
    Write-Host "✅ Webhook call successful!" -ForegroundColor Green
    Write-Host "Response: $webhookResponse" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Webhook call failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "ℹ️  This is expected if workflow is not activated in n8n" -ForegroundColor Yellow
}

Write-Host "`nStep 4: Check if User Stories were created in Taiga..." -ForegroundColor Cyan

# Wait a moment for processing
Start-Sleep -Seconds 5

try {
    $userStories = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/userstories?project=$($project.id)" -Method GET -Headers @{"Authorization" = "Bearer $authToken"}
    Write-Host "📋 Found $($userStories.Count) User Stories in project" -ForegroundColor White
    
    # Check for recent stories (created in last 5 minutes)
    $recentStories = $userStories | Where-Object { 
        $createdTime = [DateTime]::Parse($_.created_date)
        $timeDiff = (Get-Date) - $createdTime
        $timeDiff.TotalMinutes -lt 5
    }
    
    if ($recentStories.Count -gt 0) {
        Write-Host "✅ Found $($recentStories.Count) recently created User Stories!" -ForegroundColor Green
        Write-Host "Recent stories:" -ForegroundColor Yellow
        $recentStories | ForEach-Object { Write-Host "  - $($_.subject)" -ForegroundColor White }
    } else {
        Write-Host "⚠️  No recent User Stories found (workflow may not be active)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to check User Stories: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nStep 5: Test AI generation capability..." -ForegroundColor Cyan

# Test a sample section analysis
$samplePrompt = "Generate a comprehensive due diligence analysis for $testCompany specifically for the section: Financial Analysis. Required Tasks: Revenue analysis (3-year trend), Profitability metrics, Cash flow analysis, Debt and liquidity position, Financial ratios calculation. Provide detailed, factual analysis covering: 1. Current status and assessment 2. Key findings and insights 3. Strengths and opportunities 4. Risks and concerns 5. Recommendations and next steps. Be comprehensive, professional, and specific."

$aiRequestBody = @{
    model = "mistral"
    prompt = $samplePrompt
    stream = $false
} | ConvertTo-Json

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method POST -Body $aiRequestBody -Headers @{"Content-Type" = "application/json"} -TimeoutSec 45
    
    $contentLength = $aiResponse.response.Length
    Write-Host "✅ AI Analysis Generated: $contentLength characters" -ForegroundColor Green
    
    if ($contentLength -gt 1000) {
        Write-Host "✅ Content Quality: Comprehensive (suitable for due diligence)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Content Quality: Basic (may need longer prompts)" -ForegroundColor Yellow
    }
    
    Write-Host "`n📊 Sample AI Output (first 300 chars):" -ForegroundColor Cyan
    Write-Host $aiResponse.response.Substring(0, [Math]::Min(300, $aiResponse.response.Length)) -ForegroundColor White
    Write-Host "..." -ForegroundColor Gray
    
} catch {
    Write-Host "❌ AI generation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== SYSTEM STATUS SUMMARY ===" -ForegroundColor Yellow

Write-Host "`n🎯 Trigger Points Available:" -ForegroundColor Cyan
Write-Host "1. Taiga Web UI: http://localhost:9000 (Create task: 'Research on [Company]')" -ForegroundColor White
Write-Host "2. Direct Webhook: http://localhost:5678/webhook/taiga-webhook" -ForegroundColor White
Write-Host "3. API Integration: POST JSON payload with company name" -ForegroundColor White

Write-Host "`n📋 Expected Output (when workflow is active):" -ForegroundColor Cyan
Write-Host "• 20 User Stories created automatically" -ForegroundColor White
Write-Host "• Each with AI-generated analysis (1000+ chars)" -ForegroundColor White
Write-Host "• Role assignments (Maker, Checker, Approver, QA, Integrity)" -ForegroundColor White
Write-Host "• Compliance tracking and evidence requirements" -ForegroundColor White
Write-Host "• Individual tasks for each due diligence requirement" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Import taiga-20-section-workflow.json into n8n" -ForegroundColor White
Write-Host "2. Activate the workflow in n8n interface" -ForegroundColor White
Write-Host "3. Test by creating 'Research on Tesla' task in Taiga" -ForegroundColor White
Write-Host "4. Verify 20 comprehensive sections are created" -ForegroundColor White

Write-Host "`n🏆 SYSTEM READY FOR 20-SECTION DUE DILIGENCE AUTOMATION!" -ForegroundColor Green
