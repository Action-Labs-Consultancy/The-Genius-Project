# Script to create a corrected workflow file with all fixes applied

# Read the original file
$originalContent = Get-Content -Path "c:\Users\PC\The-Genius-Project\Enhanced_DD_MCA_Workflow.json" -Raw

# Create a new file with the fixed content
$fixedContent = $originalContent

# 1. Fix Query Knowledge Base function for proper null checking
$oldQueryKB = '// Query knowledge base for section content\r\nconst taskData = \$input\.first\(\)\.json;\r\nconst kb = taskData\.knowledge_base;\r\nconst sectionName = taskData\.current_section\.name;[\s\S]*?if \(kb\.website_content\) \{\r\n  relevantContent\.push\(`WEBSITE CONTENT \(\$\{kb\.website_content\.url\}\):\\\\n\$\{kb\.website_content\.raw_content\}\\\\n\\\\nWEBSITE ANALYSIS:\\\\n\$\{kb\.website_content\.analysis\}`\);\r\n\}'

$newQueryKB = '// Query knowledge base for section content
const taskData = $input.first().json;
const kb = taskData.knowledge_base || {};
const sectionName = taskData.current_section.name;

console.log(`🔍 Querying knowledge base for section: ${sectionName}`);

// Prepare relevant content based on section name
let relevantContent = [];

// Add website content with proper null checking
if (kb && kb.website_content && kb.website_content.url && kb.website_content.raw_content) {
  relevantContent.push(`WEBSITE CONTENT (${kb.website_content.url}):\\n${kb.website_content.raw_content}\\n\\nWEBSITE ANALYSIS:\\n${kb.website_content.analysis || \"No analysis available\"}`);\n}'

$fixedContent = $fixedContent -replace $oldQueryKB, $newQueryKB

# 2. Fix PDF content and analysis checking
$oldPdfCheck = '// Add all PDF content but prioritize financial or non-financial based on section\r\nkb\.pdf_contents\.forEach\(pdf => \{\r\n  // Add all content but prioritize based on section type\r\n  if \(\(isFinancialSection && pdf\.category === .financial.\) \|\| \r\n      \(!isFinancialSection && pdf\.category === .non-financial.\)\) \{\r\n    relevantContent\.push\(`DOCUMENT: \$\{pdf\.name\}\\\\n\$\{pdf\.content\}\\\\n\\\\nANALYSIS:\\\\n\$\{pdf\.analysis\}`\);\r\n  \}\r\n\}\);'

$newPdfCheck = '// Add all PDF content but prioritize financial or non-financial based on section
if (kb && kb.pdf_contents && Array.isArray(kb.pdf_contents)) {
  kb.pdf_contents.forEach(pdf => {
    // Add all content but prioritize based on section type
    if ((isFinancialSection && pdf.category === \"financial\") || 
        (!isFinancialSection && pdf.category === \"non-financial\")) {
      relevantContent.push(`DOCUMENT: ${pdf.name}\\\\n${pdf.content || \"\"}\\\\n\\\\nANALYSIS:\\\\n${pdf.analysis || \"No analysis available\"}`);\n    }
  });
}'

$fixedContent = $fixedContent -replace $oldPdfCheck, $newPdfCheck

# 3. Fix financial analysis section checking
$oldFinancialCheck = '// Add all financial analysis for financial sections\r\nif \(isFinancialSection\) \{\r\n  kb\.financial_analysis\.forEach\(analysis => \{\r\n    relevantContent\.push\(`FINANCIAL ANALYSIS \(\$\{analysis\.document_name\}\):\\\\n\$\{analysis\.analysis\}`\);\r\n  \}\);\r\n\} else \{\r\n  // Add non-financial analysis for other sections\r\n  kb\.non_financial_analysis\.forEach\(analysis => \{\r\n    relevantContent\.push\(`NON-FINANCIAL ANALYSIS \(\$\{analysis\.document_name\}\):\\\\n\$\{analysis\.analysis\}`\);\r\n  \}\);\r\n\}'

$newFinancialCheck = '// Add all financial analysis for financial sections
if (isFinancialSection && kb && kb.financial_analysis && Array.isArray(kb.financial_analysis)) {
  kb.financial_analysis.forEach(analysis => {
    relevantContent.push(`FINANCIAL ANALYSIS (${analysis.document_name}):\\\\n${analysis.analysis || \"No analysis available\"}`);\n  });
} else if (kb && kb.non_financial_analysis && Array.isArray(kb.non_financial_analysis)) {
  // Add non-financial analysis for other sections
  kb.non_financial_analysis.forEach(analysis => {
    relevantContent.push(`NON-FINANCIAL ANALYSIS (${analysis.document_name}):\\\\n${analysis.analysis || \"No analysis available\"}`);\n  });
}'

$fixedContent = $fixedContent -replace $oldFinancialCheck, $newFinancialCheck

# 4. Change Financial Analysis node name from Mistral to FinBERT
$fixedContent = $fixedContent -replace '"name": "Financial Analysis \(Mistral\)"', '"name": "Financial Analysis (FinBERT)"'

# 5. Change Financial Analysis model from mistral to finbert
$fixedContent = $fixedContent -replace '"model": "mistral:latest",\s+"prompt": "=Analyze this financial document using FinBERT-style financial analysis:', '"model": "finbert:latest",
          "prompt": "=You are a FinBERT financial language model. Analyze this financial document with specialized financial domain knowledge:'

# 6. Update references in the Store KB function
$oldStoreKB = 'if \(taskData\.is_financial\) \{\s+// Get Financial analysis result\s+const financialData = \$\(''Financial Analysis \(Mistral\)''\)\.first\(\)\.json;'
$newStoreKB = 'if (taskData.is_financial) {
  // Get Financial analysis result
  const financialData = $(\'Financial Analysis (FinBERT)\').first().json;'

$fixedContent = $fixedContent -replace $oldStoreKB, $newStoreKB

# 7. Fix any remaining node references
$fixedContent = $fixedContent -replace '"node": "Financial Analysis \(Mistral\)"', '"node": "Financial Analysis (FinBERT)"'
$fixedContent = $fixedContent -replace '"Financial Analysis \(Mistral\)": \{', '"Financial Analysis (FinBERT)": {'

# Write the fixed content to a new file
Set-Content -Path "c:\Users\PC\The-Genius-Project\Enhanced_DD_MCA_Workflow_Fixed.json" -Value $fixedContent

Write-Host "Created fixed workflow file at c:\Users\PC\The-Genius-Project\Enhanced_DD_MCA_Workflow_Fixed.json"
