# 🚀 Google Drive PDF Reader Setup Guide

## 📋 **What This Workflow Does**

1. **Scans Google Drive** for PDF files every 10 minutes
2. **Extracts company names** from PDF filenames  
3. **Downloads and reads PDF content**
4. **Extracts websites** from PDF text automatically
5. **Saves everything to PostgreSQL database**

## 🔧 **Setup Steps**

### **Step 1: Configure Google Drive Credentials**

1. **Go to n8n Credentials** → Add New → Google Drive OAuth2 API
2. **Get Google API credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add your n8n callback URL

3. **Configure in n8n**:
   - Client ID: `your-google-client-id`
   - Client Secret: `your-google-client-secret`
   - Authorize the connection

### **Step 2: Organize Your Google Drive**

**Recommended folder structure:**
```
📁 Company Research/
  📄 ACME Corp - Due Diligence.pdf
  📄 Company Research - TechStart Inc.pdf  
  📄 Financial Analysis - BigCorp Ltd.pdf
```

**Supported filename patterns:**
- `Company Research - [Company Name].pdf`
- `[Company Name] - Due Diligence.pdf`
- `[Company Name] - Analysis.pdf`
- Any PDF filename (will use full name as company)

### **Step 3: Update Database Credentials**

The workflow uses your existing PostgreSQL credentials:
- **Credential ID**: `Oq4V1fedaju3NBAp`
- **Database**: `due_diligence_db`
- **Table**: `due_diligence_reports`

### **Step 4: Customize Folder Location (Optional)**

By default, it scans the **root folder** of Google Drive. To scan a specific folder:

1. **Get folder ID** from Google Drive URL:
   - `https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs29`
   - Folder ID = `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs29`

2. **Update the workflow**:
   - Edit "List PDF Files from Google Drive" node
   - Change `folderId` from "root" to your folder ID

## 🎯 **How It Works**

### **Company Name Extraction**
The workflow automatically extracts company names from filenames using these patterns:
- `"Company Research - ACME Corp.pdf"` → `"ACME Corp"`
- `"ACME Corp - Due Diligence.pdf"` → `"ACME Corp"`
- `"TechStart Analysis.pdf"` → `"TechStart Analysis"`

### **Website Detection**
Automatically finds websites in PDF content looking for:
- `Website: https://example.com`
- `URL: www.company.com`
- `Site: company.co.uk`
- Any `https://` or `www.` links
- Domain names ending in `.com`, `.org`, `.net`, etc.

### **Database Storage**
Saves to your existing table:
- `kanboard_task_id` → Generated unique ID based on file
- `company_name` → Extracted from filename
- `website` → Found in PDF content
- `description` → Full PDF text content

## 🚀 **Usage**

### **Step 1: Upload PDFs to Google Drive**
Upload your company research PDFs with clear filenames.

### **Step 2: Import and Configure Workflow**
1. Import `Google_Drive_PDF_Reader.json`
2. Configure Google Drive credentials
3. Test the connection

### **Step 3: Run the Workflow**
- **Manual**: Click "Execute Workflow" to test
- **Automatic**: Runs every 10 minutes automatically

### **Step 4: Check Results**
Query your database to see the processed data:
```sql
SELECT 
  kanboard_task_id,
  company_name, 
  website,
  LENGTH(description) as pdf_text_length
FROM due_diligence_reports 
ORDER BY kanboard_task_id DESC;
```

## ✅ **Advantages of Google Drive Approach**

- **Simple file management** - just upload PDFs to Drive
- **Automatic processing** - no manual task creation needed  
- **Reliable API** - Google Drive API is stable and well-documented
- **Easy sharing** - team members can upload files directly
- **Version control** - Google Drive handles file versioning
- **No authentication issues** - OAuth2 handles all security

## 🔧 **Customization Options**

### **Change Scan Frequency**
Edit the "Every 10 Minutes" cron trigger:
- Every 5 minutes: `*/5 * * * *`
- Every hour: `0 * * * *`
- Daily at 9 AM: `0 9 * * *`

### **Filter Specific Files**
Modify the filename filter in "List PDF Files" node:
- Only "Due Diligence": `*Due Diligence*.pdf`
- Only "Research": `*Research*.pdf`
- All PDFs: `*.pdf` (current setting)

### **Process Specific Folder**
Change `folderId` from "root" to target a specific folder ID.

## 🚨 **Troubleshooting**

### **No PDFs Found**
- Check Google Drive credentials are authorized
- Verify PDFs exist in the specified folder
- Check folder permissions

### **PDF Extraction Fails**
- Ensure PDFs are not password-protected
- Check if PDFs are actual PDFs (not scanned images)
- Verify file size isn't too large

### **Database Errors**
- Confirm PostgreSQL is running
- Check database credentials
- Verify table structure exists

**This approach is much cleaner and more reliable than the Kanboard integration!** 🎉
