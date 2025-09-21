# Test what the AI Agent will receive for AMANA HEALTHCARE
Write-Host "=== AI Agent Input Simulation ===" -ForegroundColor Yellow

# Simulate the data that will be passed to AI Agent
$taskData = @{
    task_id = 17
    company_name = "AMANA HEALTHCARE"
    title = "AMANA HEALTHCARE @CG"
    description = "Please provide a summary of all documents and information we have about AMANA HEALTHCARE. @CG What services do they offer and what are their key business details?"
}

Write-Host "`n📋 Task Data:" -ForegroundColor Cyan
Write-Host "Task ID: $($taskData.task_id)" -ForegroundColor White
Write-Host "Company: $($taskData.company_name)" -ForegroundColor White
Write-Host "Title: $($taskData.title)" -ForegroundColor White
Write-Host "Description: $($taskData.description)" -ForegroundColor Gray

Write-Host "`n🤖 AI Agent Prompt (what gets sent):" -ForegroundColor Green
$userMessage = @"
I need you to search for information about $($taskData.company_name) to answer this specific request:

**COMPANY TO SEARCH FOR:** $($taskData.company_name)
**SPECIFIC REQUEST:** $($taskData.description)
**TASK TITLE:** $($taskData.title)

IMPORTANT INSTRUCTIONS:
1. You MUST use the Pinecone Vector Store tool to search for "$($taskData.company_name)"
2. Search multiple times with different keywords if needed
3. Look for documents, attachments, or information related to this company
4. Do NOT respond with generic statements - provide specific information from the search results
5. If you find documents, summarize the key details about $($taskData.company_name)
6. If no documents are found, clearly state you searched for "$($taskData.company_name)" but found no results

Search now and provide a detailed response based on what you find!
"@

Write-Host $userMessage -ForegroundColor White

Write-Host "`n💡 System Message:" -ForegroundColor Magenta
$systemMessage = "You are an AI assistant with access to a Pinecone Vector Store tool containing client documents. CRITICAL: You must ALWAYS use the Pinecone Vector Store tool to search for information before responding. Never provide generic responses - only respond based on actual search results from Pinecone. If you cannot find specific information in Pinecone, clearly state what you searched for and that no results were found."
Write-Host $systemMessage -ForegroundColor Gray

Write-Host "`n🎯 Expected Behavior:" -ForegroundColor Yellow
Write-Host "1. AI Agent receives above prompt with AMANA HEALTHCARE data" -ForegroundColor White
Write-Host "2. AI MUST use Pinecone Vector Store tool to search" -ForegroundColor White  
Write-Host "3. AI finds PDF: 'Amana Healthcare_Guidelines_2025.pdf'" -ForegroundColor White
Write-Host "4. AI summarizes content from PDF" -ForegroundColor White
Write-Host "5. AI provides detailed response about services/business details" -ForegroundColor White
Write-Host "6. Response gets posted as comment to Kanboard task" -ForegroundColor White

Write-Host "`n✅ This workflow should now work correctly!" -ForegroundColor Green
