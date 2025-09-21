$jsonPath = "c:\Users\PC\The-Genius-Project\Enhanced_DD_MCA_Workflow.json"
$jsonContent = Get-Content -Path $jsonPath -Raw

# Create a safer regex replacement that only targets the specific function code
$oldCode = 'if \(taskData\.is_financial\) \{\s*// Get Financial analysis result\s*const financialData = \$\(''Financial Analysis \(Mistral\)''\)\.first\(\)\.json;'
$newCode = 'if (taskData.is_financial) {\n  // Get Financial analysis result\n  const financialData = $(\'Financial Analysis (FinBERT)\').first().json;'

$jsonContent = $jsonContent -replace $oldCode, $newCode

# Write back the updated content
Set-Content -Path $jsonPath -Value $jsonContent

Write-Host "Updated specific function code reference to use FinBERT"
