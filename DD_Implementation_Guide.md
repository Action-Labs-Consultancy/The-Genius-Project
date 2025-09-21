# Complete Due Diligence Workflow Implementation Guide

## 🎯 What This Workflow Does

This workflow completely transforms your original 5-section research workflow into a **20-section Due Diligence automation system** that:

1. **Fetches tasks** from Kanboard every 5 minutes
2. **Filters** for "Due Diligence: Company" tasks
3. **Downloads and extracts** attached documents (PDFs, DOCs)
4. **Creates database records** in your PostgreSQL `due_diligence_reports` table
5. **Generates AI content** for all 20 DD sections using Mistral
6. **Creates professional PDFs** with all sections
7. **Uploads final PDFs** back to Kanboard tasks
8. **Marks reports** as completed in the database

## 📁 Files Created

1. **`DD_Kanboard_Complete_Workflow.json`** - Full workflow (IMPORT THIS ONE)
2. **`DD_Kanboard_Core_Workflow.json`** - Core section generation only
3. **`Workflow_Transformation_Analysis.md`** - Detailed comparison

## 🔧 Required Credentials Setup

### 1. Kanboard API Credentials
```
Type: HTTP Basic Auth
Name: "Kanboard API"
Username: your_kanboard_username
Password: your_kanboard_api_token
```

### 2. PostgreSQL Database Credentials
```
Type: PostgreSQL
Name: "PostgreSQL DD Database"
Host: localhost
Port: 5432
Database: due_diligence_db
Username: postgres
Password: duediligence123
```

### 3. PDF Generation Service (Optional)
```
Type: API Template.io API
Name: "PDF Generator"
API Key: your_api_template_key
```

## 🔄 Workflow Logic Flow

### Phase 1: Task Discovery & Processing
1. **Schedule Trigger** (every 5 minutes)
2. **Get Kanboard Tasks** (status_id = 1, active tasks)
3. **Extract DD Tasks** (filter for "Due Diligence" in title)
4. **Get Task Attachments** (fetch files from tasks)
5. **Process Attachments** (filter PDFs/DOCs, create download URLs)

### Phase 2: Content Extraction
6. **Has Attachments?** (conditional branch)
7. **Split Attachments** → **Download** → **Extract File Content**
8. **Combine Extracted Text** (merge all attachment content)
9. **Merge Task with Content** (combine task data + extracted text)

### Phase 3: Database Operations
10. **Check Report Exists** (avoid duplicates)
11. **Is New Task?** → **Create New Report** (if needed)
12. **Get In-Progress Reports** (find incomplete reports)

### Phase 4: AI Content Generation
13. **Find Missing Sections** (check which of 20 sections are empty)
14. **Has Sections to Generate?** (conditional branch)
15. **Create Section Prompt** (AI prompt with section-specific requirements)
16. **Generate Section** (Ollama/Mistral API call)
17. **Process Section Content** (clean and prepare content)
18. **Update Section in DB** (save to PostgreSQL)

### Phase 5: Report Completion & PDF Generation
19. **Get Complete Reports** (find reports with all 20 sections done)
20. **Check Complete Reports** (verify completion)
21. **Has Complete Reports?** (conditional branch)
22. **Generate HTML Report** (create formatted HTML with all sections)
23. **Generate PDF** (convert HTML to PDF)
24. **Download PDF** (get generated PDF file)
25. **Upload PDF to Kanboard** (attach to original task)
26. **Mark Report Complete** (update database status)

## 🧩 Key Transformations Made

### Original vs. New
| Feature | Original | Transformed |
|---------|----------|-------------|
| **Data Storage** | Google Sheets | PostgreSQL |
| **Sections** | 5 generic topics | 20 specific DD sections |
| **Input** | Manual form | Kanboard tasks + attachments |
| **Output** | Generic PDF | Professional DD report |
| **Trigger** | Manual | Automated (5-min schedule) |
| **AI Integration** | Multiple models | Single Mistral model |

### 20 DD Sections Included
1. Introduction & Engagement Context
2. Methodology & Reliability Levels  
3. Company Overview
4. Business Model & Unit Economics
5. Products & Technology
6. Target Market & Competitive Set
7. Financials (Multi-Year, Reconciled & Recomputed)
8. Cash Burn & Runway
9. Revenue Quality & Client Cohorts
10. Partnerships & Ecosystem
11. Intellectual Property
12. Legal & Regulatory
13. Governance & Board Effectiveness
14. Capital Structure & Dilution
15. Risk Matrix & Mitigations
16. Gaps, Uncertainties & Disclaimers
17. Scenario Analysis
18. Strategic Options
19. Recommendations & Next Steps
20. Source Map & Integrity Log

## 🚀 Implementation Steps

### Step 1: Import Workflow
```bash
# In n8n interface
1. Go to Workflows
2. Click "Import from file"
3. Select "DD_Kanboard_Complete_Workflow.json"
4. Click Import
```

### Step 2: Configure Credentials
```bash
# Set up the 3 required credentials in n8n:
1. Kanboard API (HTTP Basic Auth)
2. PostgreSQL DD Database 
3. API Template.io (optional, for PDF generation)
```

### Step 3: Update Node Configurations
```bash
# Replace placeholder credential IDs:
- "your-kanboard-credentials-id" → actual Kanboard credential ID
- "your-postgres-credentials-id" → actual PostgreSQL credential ID
```

### Step 4: Test with Sample Task
```bash
# Create test task in Kanboard:
Title: "Due Diligence: Test Company"
Description: "Website: https://example.com\nTest description"
Attach: Sample PDF document
```

### Step 5: Monitor Execution
```bash
# Check workflow execution every 5 minutes
# Monitor database for new records
# Check for generated PDFs in Kanboard
```

## 🔍 Verification & Testing

### Database Verification
```sql
-- Check for new reports
SELECT id, company_name, status, created_at 
FROM due_diligence_reports 
ORDER BY created_at DESC;

-- Check section completion
SELECT id, company_name, 
  CASE WHEN introduction_engagement_context IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN methodology_reliability_levels IS NOT NULL THEN 1 ELSE 0 END +
  -- ... (add all 20 sections)
  CASE WHEN source_map_integrity_log IS NOT NULL THEN 1 ELSE 0 END as completed_sections
FROM due_diligence_reports;
```

### Kanboard Verification
- Check for new file attachments on completed tasks
- Verify PDF contains all 20 sections
- Confirm task status updates

### AI Generation Verification  
- Monitor Ollama/Mistral API calls
- Check section content quality and length
- Verify section-specific requirements are met

## 🎛️ Configuration Options

### Timing Adjustments
```json
// Change schedule frequency
"field": "minutes",
"minutesInterval": 10  // Change from 5 to 10 minutes
```

### AI Model Configuration
```json
// Adjust AI parameters
"model": "mistral:latest",  // Change model
"num_predict": 3000,        // Increase/decrease length
"temperature": 0.3          // Adjust creativity
```

### Section Requirements
Edit the `getSectionRequirements()` function in "Create Section Prompt" node to customize section-specific prompts.

## 🚨 Troubleshooting

### Common Issues
1. **PostgreSQL Connection** - Verify database is running and credentials are correct
2. **Kanboard API** - Check API token and URL format
3. **Ollama/Mistral** - Ensure model is loaded and accessible
4. **PDF Generation** - Verify API Template.io service and credentials

### Debugging Steps
1. Check workflow execution logs
2. Verify database connections
3. Test individual API calls
4. Monitor section generation progress

## 📊 Success Metrics

The workflow is working correctly when:
- ✅ New DD tasks are automatically detected
- ✅ Attachments are downloaded and processed
- ✅ Database records are created and updated
- ✅ All 20 sections are generated progressively
- ✅ Professional PDFs are created and uploaded
- ✅ Reports are marked as completed

This complete workflow replaces all Google Sheets operations with PostgreSQL, transforms the generic research into specific Due Diligence sections, and provides full automation from Kanboard task detection to final PDF delivery.
