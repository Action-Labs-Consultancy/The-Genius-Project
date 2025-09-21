# 🚀 Complete n8n Due Diligence System Setup Guide

## ✅ FIXES APPLIED

### Database Issues Fixed:
- ✅ Corrected PostgreSQL node parameter structure
- ✅ Changed from `columnToMatchOn` to proper `mappingMode: "defineBelow"` with `values` object
- ✅ Added `schema: "public"` to all database operations
- ✅ Fixed `sort` parameters to be outside `options`

### Workflow Connection Issues Fixed:
- ✅ Updated Master Workflow to use correct Section 1 ID: `IbkJEatTulMiGv9C`
- ✅ Changed Section 1 from webhook trigger to `executeWorkflowTrigger`
- ✅ Fixed all node connections and references

### Database Schema Enhanced:
- ✅ Created complete PostgreSQL schema with proper constraints
- ✅ Added indexes for performance
- ✅ Created progress tracking view
- ✅ Added proper data types and relationships

## 🎯 DEPLOYMENT STEPS

### 1. Database Setup
```sql
-- Run this in your PostgreSQL database:
\i postgresql_setup_fixed.sql
```

### 2. Import Workflows
1. **Master Workflow**: Import `DD_Master_Workflow.json`
2. **Section 1**: Import `DD_Section_01_Introduction.json` 
   - **Note**: Section 1 workflow ID should be `IbkJEatTulMiGv9C`

### 3. Configure Credentials

#### PostgreSQL Credentials:
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "n8n_due_diligence",
  "user": "your_username",
  "password": "your_password",
  "ssl": false
}
```

#### Update Both Workflows:
- Replace `REPLACE_WITH_POSTGRES_CRED_ID` with your actual PostgreSQL credential ID
- Verify all other credentials are properly configured:
  - Google Drive OAuth2: `OG8UMiExTSVUzBmH`
  - Pinecone API: `N8PyI62raKeDY3jI`
  - Ollama: `cGmcFHhiVZA3AmtD`

### 4. Test System Health
```bash
python test_system_health.py
```

## 🔧 DATABASE NODE CONFIGURATION

### ✅ Correct Format (Now Implemented):
```json
{
  "parameters": {
    "operation": "insert",
    "schema": "public",
    "table": "dd_sections",
    "columns": {
      "mappingMode": "defineBelow",
      "values": {
        "company_id": "={{ $json.company_id }}",
        "section_number": "={{ $json.section_number }}",
        "title": "={{ $json.section_title }}",
        "content": "={{ $json.generated_content }}"
      }
    }
  }
}
```

### ❌ Incorrect Format (Fixed):
```json
{
  "parameters": {
    "operation": "insert", 
    "table": "dd_sections",
    "columns": {
      "columnToMatchOn": [
        {
          "column": "company_id",
          "value": "={{ $json.company_id }}"
        }
      ]
    }
  }
}
```

## 🎯 BIG 4 INTRODUCTION SECTION FEATURES

The Section 1 workflow now includes:

### ✅ Big 4 Standards Compliance:
- **Engagement Framing**: Commissioning party, transaction type, reporting period
- **Scope & Methodology**: Procedures, team role, review nature, limitations  
- **Mandatory Subheadings**: "Key Findings / Overview", "Risks / Gaps / Limitations", "Recommended Actions"
- **Analysis Standards**: Confidence levels (High/Medium/Low), source citations, audit-ready language

### ✅ Quality Control Process:
1. **Maker**: Generates content using Big 4 prompt
2. **Checker**: Reviews against Big 4 evaluation criteria
3. **Senior Partner Approver**: Final executive-level quality check
4. **Retry Logic**: Up to 3 attempts with feedback incorporation

### ✅ Professional Output:
- 1000-1500 words suitable for executive stakeholders
- Formal, unambiguous, audit-ready language
- Evidence-based content with proper source citations
- Complete audit trail and risk management

## 🚀 TESTING WORKFLOW

### 1. Manual Test Section 1:
1. Go to: `http://localhost:5678/workflow/IbkJEatTulMiGv9C`
2. Click "Test workflow" 
3. Provide test input:
```json
{
  "company_id": "test_company_123",
  "company_name": "Test Corporation",
  "company_folder_name": "Test Corporation Folder"
}
```

### 2. End-to-End Test:
1. Create a test company folder in Google Drive
2. Add some PDF files
3. Monitor Master Workflow execution
4. Verify database entries
5. Check Pinecone vector storage

## 🏥 TROUBLESHOOTING

### Database Connection Issues:
- Verify PostgreSQL service is running
- Check credentials and database name
- Ensure schema exists: `\dt dd_*` in psql

### Workflow Execution Issues:
- Check n8n logs: `n8n start --log-level debug`
- Verify all credentials are properly configured
- Ensure Ollama models are available: `ollama list`

### Missing Dependencies:
```bash
# Install required Ollama models
ollama pull llama2
ollama pull mxbai-embed-large

# Test Ollama connection
curl http://localhost:11434/api/tags
```

## ✅ SUCCESS CRITERIA

System is ready when:
- ✅ All health checks pass
- ✅ Database schema created successfully  
- ✅ Both workflows imported without errors
- ✅ All credentials configured
- ✅ Test execution completes successfully
- ✅ Big 4 standard content generated
- ✅ Data properly stored in PostgreSQL

## 🎉 READY FOR PRODUCTION

Once all checks pass, your Big 4 due diligence system is ready to:
- Process company folders automatically
- Generate executive-level Introduction sections
- Maintain complete audit trails
- Ensure professional quality standards
- Scale to handle multiple companies simultaneously

**Your system now meets enterprise Big 4 consulting standards! 🏆**
