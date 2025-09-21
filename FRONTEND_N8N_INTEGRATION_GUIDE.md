# Frontend-n8n Integration Setup Guide

## Overview
This guide explains how to integrate your frontend Due Diligence Generator with your existing n8n workflow to enable seamless content generation and display.

## Integration Flow

1. **Frontend** → Triggers section generation via API
2. **Backend API** → Tries to call n8n webhook, falls back to local generation
3. **n8n Workflow** → Processes request, generates content, updates database
4. **Database** → Stores generated content in `complete_dd_reports` table
5. **Frontend** → Polls for completion and displays updated content

## Required Components

### 1. Database Integration ✅ READY
- Backend now connects to your PostgreSQL database
- Uses same tables as your n8n workflow: `complete_dd_reports`, `company_data`
- Section columns match your workflow structure

### 2. Backend API Webhook Endpoints ✅ READY
- **POST** `/api/due-diligence/generate` - Triggers section generation
- **POST** `/api/due-diligence/webhook/section-complete` - Receives n8n completion notifications
- **GET** `/api/due-diligence/sections/:companyId` - Reads sections from database
- **POST** `/api/due-diligence/companies` - Creates new companies

### 3. n8n Webhook Integration 📋 TO IMPLEMENT

Add this webhook workflow to your n8n instance (import `n8n-webhook-integration.json`):

```
Webhook: /webhook/generate-section
↓
Process Request (Function)
↓
Generate Content (Ollama/AI)
↓
Update Database (PostgreSQL)
↓
Notify Frontend (HTTP Request)
↓
Return Response
```

## Setup Instructions

### Step 1: Import Webhook Workflow
1. Open n8n interface (http://localhost:5678)
2. Go to Workflows → Import from file
3. Import `n8n-webhook-integration.json`
4. Activate the workflow

### Step 2: Update Your Existing Workflow
Add webhook integration to your `content-publishing-workflow.json`:

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "generate-section",
    "responseMode": "responseNode"
  },
  "name": "Frontend Section Request",
  "type": "n8n-nodes-base.webhook"
}
```

### Step 3: Configure Database Connection
Ensure your PostgreSQL credentials are set:
```bash
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DB=n8n_db
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
```

### Step 4: Start the System
1. Start PostgreSQL database
2. Start n8n: `npx n8n start`
3. Start backend API: `node server.js` (port 10000)
4. Start frontend: `npm start` (port 2345)

## Section Mapping

Your n8n workflow sections are now mapped to the frontend:

| Frontend ID | Section Name | Database Column |
|------------|--------------|----------------|
| 1 | Introduction & Engagement Context | `introduction_engagement_context` |
| 2 | Legal Disclaimers & Reliance Limitations | `legal_disclaimers_reliance_limitations` |
| 3 | Methodology & Source Validation | `methodology_source_validation` |
| 4 | Financial Trajectory & Revenue Quality | `financial_trajectory_revenue_quality` |
| 5 | Partnerships & Ecosystem Alliances | `partnerships_ecosystem_alliances` |
| 6 | Intellectual Property & Technology | `intellectual_property_technology` |
| 7 | Governance & Disclosures Risks | `governance_disclosures_risks` |
| 8 | Appendix & Management RFI | `appendix_management_rfi` |
| 9+ | Extended sections from `due_diligence_reports` table | Various columns |

## Testing the Integration

### Test 1: Create a Company
1. Go to frontend (http://localhost:2345/due-diligence)
2. Click "➕ New Company"
3. Enter company name, click Create
4. Verify it appears in your database

### Test 2: Generate a Section
1. Select a company from dropdown
2. Click "🤖 Generate" on any section
3. Watch for "n8n workflow triggered" message
4. Content should appear within 30 seconds

### Test 3: Context Learning
1. Generate Section 1
2. Generate Section 2
3. Section 2 should reference content from Section 1

## Troubleshooting

### n8n Webhook Not Working
- Check n8n is running on port 5678
- Verify webhook URL: `http://localhost:5678/webhook/generate-section`
- Check n8n logs for errors
- Frontend will fallback to local generation

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in environment variables
- Ensure tables `complete_dd_reports` and `company_data` exist

### Frontend Not Updating
- Check browser console for API errors
- Verify backend is running on port 10000
- Check network tab for failed requests

## API Endpoints Reference

### Generate Section
```bash
POST http://localhost:10000/api/due-diligence/generate
Content-Type: application/json

{
  "sectionId": 1,
  "companyId": "comp_123",
  "userId": "frontend_user"
}
```

### Get Company Sections
```bash
GET http://localhost:10000/api/due-diligence/sections/comp_123
```

### Create Company
```bash
POST http://localhost:10000/api/due-diligence/companies
Content-Type: application/json

{
  "companyName": "Test Company",
  "folderId": "manual_entry",
  "content": "Created via frontend"
}
```

## Success Indicators

✅ **Frontend loads company list from database**
✅ **Section generation triggers n8n workflow**
✅ **Generated content appears in frontend**
✅ **Context learning works between sections**
✅ **Progress tracking shows completion status**

## Next Steps

1. **Import the webhook workflow** into your n8n instance
2. **Test the integration** with a sample company
3. **Customize section definitions** if needed
4. **Add error handling** for production use
5. **Configure backup/restore** for your database

Your frontend and n8n workflow are now integrated! The frontend serves as a user-friendly interface for your automated due diligence process, while n8n handles the heavy lifting of content generation and data processing.
