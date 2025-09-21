# PowerShell script to systematically add context retrieval for sections 16-20
$jsonFile = "DD_Section_01_SIMPLE_WORKING.json"

Write-Host "🔧 IMPLEMENTING CASCADING CONTEXT FOR SECTIONS 16-20" -ForegroundColor Green
Write-Host "Starting systematic context implementation..." -ForegroundColor Yellow

# Read the current file
$content = Get-Content $jsonFile -Raw

# Section 16 - Add context retrieval before Generate Section 16 Report
Write-Host "📋 Adding Section 16 context..." -ForegroundColor Cyan

$section16_context = @"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "=SELECT \n  company_id,\n  company_name,\n  -- Section 1: Executive Summary\n  COALESCE(executive_summary, '') as section_1,\n  -- Section 2: Company Overview\n  COALESCE(company_overview, '') as section_2,\n  -- Section 3: Market Analysis\n  COALESCE(market_analysis, '') as section_3,\n  -- Section 4: Business Model\n  COALESCE(business_model, '') as section_4,\n  -- Section 5: Leadership Team\n  COALESCE(leadership_team, '') as section_5,\n  -- Section 6: Technology & Products\n  COALESCE(technology_products, '') as section_6,\n  -- Section 7: Financial Analysis\n  COALESCE(financial_analysis, '') as section_7,\n  -- Section 8: Customer Base\n  COALESCE(customer_base, '') as section_8,\n  -- Section 9: Competitive Analysis\n  COALESCE(competitive_analysis, '') as section_9,\n  -- Section 10: Strategic Partnerships\n  COALESCE(strategic_partnerships, '') as section_10,\n  -- Section 11: SWOT Analysis\n  COALESCE(swot_analysis, '') as section_11,\n  -- Section 12: Legal & Regulatory\n  COALESCE(legal_regulatory, '') as section_12,\n  -- Section 13: Governance & Board Effectiveness\n  COALESCE(governance_board_effectiveness, '') as section_13,\n  -- Section 14: Capital Structure & Dilution\n  COALESCE(capital_structure_dilution, '') as section_14,\n  -- Section 15: Risk Matrix & Mitigations\n  COALESCE(risk_matrix_mitigations, '') as section_15\nFROM due_diligence_reports \nWHERE company_id = '{{ $node[\"Save Company Data\"].json.company_id }}'\nLIMIT 1;",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        }
      },
      "id": "i1j2k3l4-m5n6-7890-1234-567890abcdef",
      "name": "Retrieve Sections 1-15 for Context",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        -1448,
        3952
      ],
      "credentials": {
        "postgres": {
          "id": "Oq4V1fedaju3NBAp",
          "name": "Postgres account 3"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "// Section 16: Gaps, Uncertainties & Disclaimers Context Preparation\nconst currentData = $node['Save Company Data'].json;\nconst previousSections = $input.first().json;\n\nconsole.log('📋 Preparing Section 16 Gaps, Uncertainties & Disclaimers context...');\nconsole.log(`Company: ${currentData.company_name}`);\nconsole.log(`Company ID: ${currentData.company_id}`);\n\n// Build comprehensive context from previous sections\nlet contextSections = [];\n\nif (previousSections.section_1) contextSections.push(`EXECUTIVE SUMMARY:\\n${previousSections.section_1}`);\nif (previousSections.section_2) contextSections.push(`COMPANY OVERVIEW:\\n${previousSections.section_2}`);\nif (previousSections.section_3) contextSections.push(`MARKET ANALYSIS:\\n${previousSections.section_3}`);\nif (previousSections.section_4) contextSections.push(`BUSINESS MODEL:\\n${previousSections.section_4}`);\nif (previousSections.section_5) contextSections.push(`LEADERSHIP TEAM:\\n${previousSections.section_5}`);\nif (previousSections.section_6) contextSections.push(`TECHNOLOGY & PRODUCTS:\\n${previousSections.section_6}`);\nif (previousSections.section_7) contextSections.push(`FINANCIAL ANALYSIS:\\n${previousSections.section_7}`);\nif (previousSections.section_8) contextSections.push(`CUSTOMER BASE:\\n${previousSections.section_8}`);\nif (previousSections.section_9) contextSections.push(`COMPETITIVE ANALYSIS:\\n${previousSections.section_9}`);\nif (previousSections.section_10) contextSections.push(`STRATEGIC PARTNERSHIPS:\\n${previousSections.section_10}`);\nif (previousSections.section_11) contextSections.push(`SWOT ANALYSIS:\\n${previousSections.section_11}`);\nif (previousSections.section_12) contextSections.push(`LEGAL & REGULATORY:\\n${previousSections.section_12}`);\nif (previousSections.section_13) contextSections.push(`GOVERNANCE & BOARD EFFECTIVENESS:\\n${previousSections.section_13}`);\nif (previousSections.section_14) contextSections.push(`CAPITAL STRUCTURE & DILUTION:\\n${previousSections.section_14}`);\nif (previousSections.section_15) contextSections.push(`RISK MATRIX & MITIGATIONS:\\n${previousSections.section_15}`);\n\n// Create comprehensive context\nconst context = contextSections.length > 0 \n  ? `PREVIOUS SECTIONS CONTEXT FOR GAPS, UNCERTAINTIES & DISCLAIMERS ANALYSIS:\n\n${contextSections.join('\\n\\n==========\\n\\n')}`\n  : 'No previous sections available for context.';\n\nconsole.log(`Context prepared: ${context.substring(0, 200)}...`);\nconsole.log(`Total context length: ${context.length} characters`);\nconsole.log(`Number of previous sections: ${contextSections.length}`);\n\nreturn {\n  json: {\n    company_id: currentData.company_id,\n    company_name: currentData.company_name,\n    content: currentData.content,\n    context: context,\n    section_type: 'gaps_uncertainties_disclaimers',\n    context_sections_count: contextSections.length\n  }\n};"
      },
      "id": "j2k3l4m5-n6o7-8901-2345-67890abcdef5",
      "name": "Prepare Section 16 Context",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -1248,
        3952
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://127.0.0.1:11434/api/generate",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": {
          "model": "llama3:latest",
          "prompt": "=You are a senior financial analyst creating a professional due diligence report. Generate a comprehensive \"Gaps, Uncertainties & Disclaimers\" section for: {{ $json.company_name }}\n\n{{ $json.feedback ? ('IMPORTANT - PREVIOUS VERSION HAD ISSUES: ' + $json.feedback + ' Please address these specific concerns in your revision. ') : '' }}{{ $json.context ? ('PREVIOUS SECTIONS CONTEXT:\n' + $json.context + '\n\n') : '' }}SOURCE DOCUMENT CONTENT:\n{{ $json.content }}\n\nREQUIREMENTS:\n- Use ONLY factual information from the provided document\n- Write in professional, business-appropriate language\n- Minimum 400 words, well-structured paragraphs\n- Include specific details about information gaps, data limitations, analytical uncertainties\n- Structure with clear subsections: Information Gaps, Data Limitations, Analytical Uncertainties, Disclosure Disclaimers, and Recommendation Caveats\n- Reference specific missing information, uncertain assumptions, or data limitations from the analysis\n- Cross-reference insights from previous sections for comprehensive analysis\n- Avoid generic statements - be specific to this company and analysis\n- Do not use placeholder text or template variables\n- Focus on transparent disclosure of analytical limitations, missing data points, and uncertainty factors\n{{ $json.feedback ? ('CRITICAL: Address the specific feedback provided above. Make substantial improvements to resolve the noted issues. ') : '' }}\nGenerate a detailed, professional gaps, uncertainties, and disclaimers analysis based solely on the document content and analytical limitations identified.",
"@

# Apply the replacement for Section 16
$section16_old = '    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://127.0.0.1:11434/api/generate",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": {
          "model": "llama3:latest",
          "prompt": "=You are a senior financial analyst creating a professional due diligence report. Generate a comprehensive \"Gaps, Uncertainties & Disclaimers\" section for: {{ $json.company_name }}\n\n{{ $json.feedback ? (''IMPORTANT - PREVIOUS VERSION HAD ISSUES: '' + $json.feedback + '' Please address these specific concerns in your revision. '') : '''' }}SOURCE DOCUMENT CONTENT:\n{{ $json.content }}\n\nREQUIREMENTS:\n- Use ONLY factual information from the provided document\n- Write in professional, business-appropriate language\n- Minimum 400 words, well-structured paragraphs\n- Include specific details about information gaps, data limitations, analytical uncertainties\n- Structure with clear subsections: Information Gaps, Data Limitations, Analytical Uncertainties, Disclosure Disclaimers, and Recommendation Caveats\n- Reference specific missing information, uncertain assumptions, or data limitations from the analysis\n- Avoid generic statements - be specific to this company and analysis\n- Do not use placeholder text or template variables\n- Focus on transparent disclosure of analytical limitations, missing data points, and uncertainty factors\n{{ $json.feedback ? (''CRITICAL: Address the specific feedback provided above. Make substantial improvements to resolve the noted issues. '') : '''' }}\nGenerate a detailed, professional gaps, uncertainties, and disclaimers analysis based solely on the document content and analytical limitations identified.",'

$content = $content -replace [regex]::Escape($section16_old), $section16_context

Write-Host "✅ Section 16 context added successfully" -ForegroundColor Green

# Save the file
Set-Content -Path $jsonFile -Value $content -Encoding UTF8

Write-Host "🎯 COMPLETION: Cascading context implementation batch completed!" -ForegroundColor Green
Write-Host "📊 Sections 12-16 now have complete context retrieval from all previous sections" -ForegroundColor Yellow
Write-Host "🔗 Next: Update connections to route through context nodes and implement sections 17-20" -ForegroundColor Cyan
