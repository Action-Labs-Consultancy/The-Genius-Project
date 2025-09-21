# Test AI-Enhanced Research Generation
Write-Host "🧠 Testing AI-Enhanced Research Generation" -ForegroundColor Green

$companyName = "Tesla"
Write-Host "📊 Generating research for: $companyName"

# Test the LLM endpoint directly
$prompt = "Generate a comprehensive business overview for $companyName. Include the following sections with detailed, factual information: 1. Company Overview: Brief history, founding, headquarters, and core mission 2. Business Model: How the company makes money, key revenue streams 3. Market Position: Industry standing, market share, competitive advantages 4. Financial Highlights: Recent revenue, profitability, key financial metrics 5. Leadership: Key executives and their backgrounds 6. Products/Services: Main offerings and their market impact 7. Innovation: Technology focus, R and D investments, patents 8. Growth Strategy: Expansion plans, new markets, strategic initiatives 9. Key Risks: Market risks, regulatory challenges, competitive threats 10. Sustainability: ESG initiatives, environmental impact, social responsibility. Provide specific, factual details for each section. Format as professional due diligence report. Be comprehensive but concise."

$requestBody = @{
    model = "mistral"
    prompt = $prompt
    stream = $false
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🚀 Calling Mistral LLM..."

try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method POST -Body $requestBody -Headers $headers -TimeoutSec 60
    
    Write-Host "✅ AI Research Generated Successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Sample AI-Generated Content:" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor White
    
    # Display first 500 characters of the response
    $content = $response.response
    if ($content.Length -gt 500) {
        Write-Host ($content.Substring(0, 500) + "...") -ForegroundColor White
    } else {
        Write-Host $content -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📊 Response Stats:" -ForegroundColor Cyan
    Write-Host "- Length: $($content.Length) characters" -ForegroundColor White
    Write-Host "- Model: $($response.model)" -ForegroundColor White
    Write-Host "- Quality: Professional AI Analysis" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error calling LLM: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Import the taiga-ai-workflow.json into n8n manually" -ForegroundColor White
Write-Host "2. Activate the workflow in n8n interface" -ForegroundColor White
Write-Host "3. Create a task with subject: Research on Tesla in Taiga" -ForegroundColor White
Write-Host "4. Watch the AI generate detailed research reports!" -ForegroundColor White
