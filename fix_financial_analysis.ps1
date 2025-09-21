$jsonPath = "c:\Users\PC\The-Genius-Project\Enhanced_DD_MCA_Workflow.json"
$jsonContent = Get-Content -Path $jsonPath -Raw

# Fix the reference to Financial Analysis node in the Store KB function
$jsonContent = $jsonContent -replace '"Financial Analysis \(Mistral\)"', '"Financial Analysis (FinBERT)"'

# Fix the name of the node in the nodes connection section
$jsonContent = $jsonContent -replace '"node": "Financial Analysis \(Mistral\)"', '"node": "Financial Analysis (FinBERT)"'

# Fix the connection section name
$jsonContent = $jsonContent -replace '"Financial Analysis \(Mistral\)": \{', '"Financial Analysis (FinBERT)": {'

# Write back the updated content
Set-Content -Path $jsonPath -Value $jsonContent

Write-Host "Updated Financial Analysis references in the workflow file"
