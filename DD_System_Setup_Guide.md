# Comprehensive Due Diligence System Setup Guide

## Overview
This system creates a complete due diligence automation platform that:
- Reads Kanboard tasks titled "Due Diligence: Company Name"
- Extracts company info, website, and attachments
- Stores everything in PostgreSQL with 20 DD sections
- Generates sections iteratively using AI
- Creates PDF reports and attaches them back to Kanboard

## Prerequisites
1. **n8n** - Workflow automation platform
2. **PostgreSQL** - Database for storing DD reports
3. **Kanboard** - Project management with API access
4. **Ollama with Mistral** - Local AI for content generation
5. **Basic credentials setup** in n8n

## Step 1: Database Setup

### 1.1 Create PostgreSQL Database
```sql
-- Create the database
CREATE DATABASE due_diligence_db;

-- Connect to the database and run the schema
\c due_diligence_db;
\i dd_database_schema.sql
```

### 1.2 Verify Database Structure
```sql
-- Check table creation
\dt due_diligence_reports

-- View the structure
\d due_diligence_reports

-- Check the progress view
SELECT * FROM dd_section_status LIMIT 5;
```

## Step 2: n8n Configuration

### 2.1 Import the Workflow
1. Open n8n interface
2. Go to Workflows → Import
3. Upload `Comprehensive_DD_System.json`

### 2.2 Configure Credentials
You need to set up these credentials in n8n:

#### PostgreSQL Credentials
- **Name**: `PostgreSQL`
- **Host**: `localhost` (or your DB host)
- **Database**: `due_diligence_db`
- **User**: Your PostgreSQL username
- **Password**: Your PostgreSQL password
- **Port**: `5432`

#### Kanboard Credentials
- **Name**: `Kanboard Credentials`
- **Username**: Your Kanboard username
- **Password**: Your Kanboard password or API token

### 2.3 Update Node References
Update these nodes with your credential IDs:
- All PostgreSQL nodes → Use your PostgreSQL credential ID
- All HTTP Request nodes → Use your Kanboard credential ID

## Step 3: Kanboard Setup

### 3.1 Create Due Diligence Tasks
Create tasks with this format:
- **Title**: `Due Diligence: [Company Name]`
- **Description**: Include company website URL
- **Attachments**: Upload relevant documents (PDFs, financial statements, etc.)

### 3.2 Example Task
```
Title: Due Diligence: mirriad
Description: https://www.mirriadplc.com/
Attachments: 
- Annual_Report_2024.pdf
- Financial_Statements.xlsx
```

## Step 4: AI Setup (Ollama)

### 4.1 Install Ollama
```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the Mistral model
ollama pull mistral:latest

# Start Ollama server
ollama serve
```

### 4.2 Verify AI Connection
```bash
# Test the API
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:latest",
  "prompt": "Test prompt",
  "stream": false
}'
```

## Step 5: System Operation

### 5.1 How It Works
1. **Every 10 minutes** the workflow runs automatically
2. **Scans Kanboard** for "Due Diligence: Company" tasks
3. **Checks database** if report already exists
4. **Creates new record** with company info and attachments
5. **Generates sections** one by one using AI
6. **Updates database** with each completed section
7. **Creates PDF** when all 20 sections are complete
8. **Marks report** as completed

### 5.2 The 20 Due Diligence Sections
1. Executive Summary
2. Company Overview  
3. Business Model
4. Market Analysis
5. Competitive Landscape
6. Financial Analysis
7. Revenue Streams
8. Cost Structure
9. Cash Flow Analysis
10. Balance Sheet Review
11. Management Team
12. Governance Structure
13. Operational Assessment
14. Technology Infrastructure
15. Risk Assessment
16. Legal Compliance
17. Regulatory Environment
18. Growth Prospects
19. Valuation Analysis
20. Recommendations

## Step 6: Monitoring & Management

### 6.1 Check Report Progress
```sql
-- View all reports and their completion status
SELECT 
    company_name,
    status,
    completed_sections,
    completion_percentage,
    created_at
FROM dd_section_status 
ORDER BY completion_percentage DESC;
```

### 6.2 Monitor Section Generation
```sql
-- See which sections are missing for incomplete reports
SELECT 
    company_name,
    CASE WHEN executive_summary IS NULL OR executive_summary = '' THEN 'executive_summary,' ELSE '' END ||
    CASE WHEN company_overview IS NULL OR company_overview = '' THEN 'company_overview,' ELSE '' END ||
    CASE WHEN business_model IS NULL OR business_model = '' THEN 'business_model,' ELSE '' END AS missing_sections
FROM due_diligence_reports 
WHERE status = 'in_progress';
```

### 6.3 View Generated Content
```sql
-- Check a specific section
SELECT company_name, executive_summary 
FROM due_diligence_reports 
WHERE company_name = 'mirriad';
```

## Step 7: Troubleshooting

### 7.1 Common Issues

#### No Tasks Found
- Check Kanboard API connection
- Verify task title format: "Due Diligence: Company Name"
- Check project_id and status_id in workflow

#### AI Generation Fails  
- Verify Ollama is running: `ollama list`
- Check model availability: `ollama pull mistral:latest`
- Test API endpoint manually

#### Database Errors
- Check PostgreSQL connection
- Verify database exists and schema is loaded
- Check user permissions

### 7.2 Manual Section Generation
If AI fails, you can manually update sections:
```sql
UPDATE due_diligence_reports 
SET executive_summary = 'Your manual content here',
    updated_at = CURRENT_TIMESTAMP
WHERE company_name = 'YourCompany';
```

## Step 8: Advanced Configuration

### 8.1 Adjust AI Parameters
In the "Generate Section" node, modify:
- `num_predict`: Control response length (default: 2000)
- `temperature`: Control creativity (0.1-1.0, default: 0.3)

### 8.2 Change Processing Frequency
In the "Every 10 Minutes" trigger, adjust:
- `minutesInterval`: Set to 5, 15, 30, etc.

### 8.3 Add More Sections
To add custom sections:
1. Add column to database table
2. Update the `ddSections` array in "Find Missing Sections" node
3. Update PDF generation in "Generate PDF Content" node

## Step 9: PDF Generation & Kanboard Integration

The system will:
1. Generate comprehensive PDF reports
2. Store them with unique filenames
3. Mark reports as completed
4. (Future enhancement: Upload PDF back to Kanboard task)

## System Benefits

✅ **Automated**: No manual intervention required
✅ **Comprehensive**: 20 detailed DD sections
✅ **Iterative**: Generates one section at a time
✅ **Database-driven**: All data stored and trackable
✅ **AI-powered**: Uses local Mistral model
✅ **Scalable**: Handles multiple companies simultaneously
✅ **Resumable**: Can continue from where it left off

This system transforms your due diligence process from manual work into a fully automated, AI-powered analysis platform!
