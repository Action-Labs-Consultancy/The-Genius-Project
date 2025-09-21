// Complete Fixed Workflow
// This script creates a new fixed workflow file with all issues resolved

$originalFile = "c:\Users\PC\The-Genius-Project\Enhanced_DD_MCA_Workflow.json"
$fixedFile = "c:\Users\PC\The-Genius-Project\Enhanced_DD_MCA_Workflow_Fixed.json"

$jsonContent = Get-Content -Path $originalFile -Raw

# 1. Fix all references to Financial Analysis (Mistral) -> Financial Analysis (FinBERT)
$jsonContent = $jsonContent -replace '"Financial Analysis \(Mistral\)"', '"Financial Analysis (FinBERT)"'
$jsonContent = $jsonContent -replace '"node": "Financial Analysis \(Mistral\)"', '"node": "Financial Analysis (FinBERT)"'
$jsonContent = $jsonContent -replace '"Financial Analysis \(Mistral\)": \{', '"Financial Analysis (FinBERT)": {'

# 2. Replace the model from mistral to finbert in the Financial Analysis node
$jsonContent = $jsonContent -replace '"model": "mistral:latest",\s+"prompt": "=Analyze this financial document using FinBERT-style financial analysis:', '"model": "finbert:latest",\s+"prompt": "=You are a FinBERT financial language model. Analyze this financial document with specialized financial domain knowledge:'

# 3. Fix specific function code in Store in Knowledge Base
$oldCode = 'const financialData = \$\(''Financial Analysis \(Mistral\)''\)\.first\(\)\.json;'
$newCode = 'const financialData = $(\'Financial Analysis (FinBERT)\').first().json;'
$jsonContent = $jsonContent -replace $oldCode, $newCode

# 4. Write the fixed content to the new file
Set-Content -Path $fixedFile -Value $jsonContent

Write-Host "Created fixed workflow file at $fixedFile"
