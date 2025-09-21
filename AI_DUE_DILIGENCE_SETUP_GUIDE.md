# 🤖 AI Due Diligence Workflow - Complete Setup Guide

## 🎯 Overview
This is a fully automated AI-driven Due Diligence workflow that processes PDF documents through a Maker → Checker → Approver pipeline using local LLaMA AI and integrates with Kanboard for project management.

## 📋 Prerequisites

### 1. **Ollama Setup** (Local AI)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull LLaMA model
ollama pull llama3.2
```

### 2. **Required Node.js Packages**
```bash
npm install express puppeteer
```

### 3. **Services Status Check**
- ✅ **n8n**: Running on http://localhost:5678
- ✅ **Kanboard**: Running on http://localhost:8000  
- ✅ **Rollback System**: Running on http://localhost:3001
- 🔄 **PDF Converter**: Needs to run on http://localhost:3000
- 🔄 **Ollama**: Needs to run on http://localhost:11434

## 🚀 Start All Services

### 1. Start PDF Converter Service
```bash
cd "c:\Users\PC\The-Genius-Project"
node pdf-converter-service.js
```

### 2. Start Ollama (if not running)
```bash
ollama serve
```

### 3. Verify All Services
```bash
# Check n8n
curl http://localhost:5678

# Check Kanboard  
curl http://localhost:8000

# Check Ollama
curl http://localhost:11434/api/tags

# Check PDF Converter
curl http://localhost:3000/health

# Check Rollback System
curl http://localhost:3001/api/health
```

## 📥 Import Workflow to n8n

1. **Open n8n**: Go to http://localhost:5678
2. **Login**: Use credentials `admin` / `GlassDoor2025!`
3. **Import Workflow**:
   - Click "+" → "Import from File"
   - Select `AI_Due_Diligence_Workflow.json`
   - Click "Import"

## 🔧 Configure Workflow

### 1. **Set Kanboard Credentials**
- In n8n, go to Credentials
- Create "HTTP Basic Auth" credential named `kanboard_auth`
- Username: `admin`
- Password: `admin`

### 2. **Verify Connections**
- Kanboard API: http://localhost:8000/jsonrpc.php
- Ollama API: http://localhost:11434/api/generate
- PDF Converter: http://localhost:3000/pdf-convert

## 📝 How to Use

### 1. **Create Kanboard Task**
- Open Kanboard: http://localhost:8000
- Create new task with:
  - **Title**: Company name (e.g., "Acme Corporation")
  - **Description**: Include company website (e.g., "https://acme.com")
  - **Attachments**: Upload PDF documents for analysis

### 2. **Activate Workflow**
- In n8n, activate the "AI Due Diligence - MCA Pipeline" workflow
- It will check for new tasks every 60 seconds

### 3. **Monitor Progress**
- Check Kanboard for subtasks created for each section
- View comments for detailed AI analysis
- Final PDF report will be uploaded as attachment

## 🧠 AI Pipeline Process

### **For Each Due Diligence Section:**

1. **🛠️ Maker AI**
   - Generates comprehensive content
   - Uses company data and PDF content
   - Creates detailed analysis

2. **🧪 Checker AI**
   - Reviews for hallucinations
   - Checks for fake/mock data
   - Validates logical consistency
   - Returns PASSED/FAILED

3. **✅ Approver AI**
   - Final business logic review
   - Assesses completeness
   - Makes APPROVED/REJECTED decision

### **Retry Logic**
- Failed sections retry up to 3 times
- Failed sections logged with details
- Only approved sections included in final report

## 📊 Due Diligence Sections (22 Standard Sections)

1. Executive Summary
2. Company Overview  
3. Financial Analysis
4. Market Analysis
5. Competitive Landscape
6. Management Team
7. Business Model
8. Technology Stack
9. Intellectual Property
10. Legal & Compliance
11. Risk Assessment
12. ESG Factors
13. Operational Analysis
14. Strategic Position
15. Growth Opportunities
16. Financial Projections
17. Valuation Analysis
18. Deal Structure
19. Investment Thesis
20. Due Diligence Findings
21. Recommendations
22. Appendices

## 🔍 Monitoring & Troubleshooting

### **Check Service Status**
```bash
# n8n workflows
curl http://localhost:5678/rest/workflows

# Kanboard health
curl http://localhost:8000

# Ollama models
curl http://localhost:11434/api/tags

# PDF converter
curl http://localhost:3000/health
```

### **Common Issues**

1. **Ollama not responding**
   - Restart: `ollama serve`
   - Check model: `ollama list`

2. **PDF conversion failing**
   - Restart PDF service: `node pdf-converter-service.js`
   - Check Puppeteer installation

3. **Kanboard authentication**
   - Verify credentials in n8n
   - Check Kanboard API access

### **Logs & Debugging**
- n8n execution logs in workflow history
- Kanboard task comments show AI outputs
- PDF converter console logs
- Rollback system logs at http://localhost:3001

## 🎯 Expected Results

### **Per Section:**
- Maker subtask with AI-generated content
- Checker subtask with validation results  
- Approver subtask with final decision
- Detailed comments with full AI pipeline outputs

### **Final Output:**
- Complete PDF report with all approved sections
- Quality assessment summary
- Full audit trail in Kanboard
- Professional formatted document

## ⚡ Performance Notes

- **Processing Time**: ~2-3 minutes per section (depends on AI model)
- **Total Time**: ~45-60 minutes for full 22-section report
- **Resource Usage**: Moderate CPU for AI processing
- **Scalability**: Can process multiple companies in parallel

## 🔐 Security & Compliance

- **Local AI**: All processing done locally (no external API calls)
- **Data Privacy**: Documents never leave your environment
- **Audit Trail**: Complete logging in Kanboard
- **Rollback Capability**: Full system rollback available

---

## 🚀 **READY TO RUN!**

Your AI Due Diligence system is now fully configured and ready to process company documents through the complete Maker-Checker-Approver pipeline!

**Next Steps:**
1. Start all services
2. Import workflow to n8n
3. Create test task in Kanboard with PDF
4. Watch the magic happen! ✨
