# Due Diligence Generator System

## Overview

This is a comprehensive due diligence report generation system that creates professional 20-section reports with intelligent context learning. Each section builds upon insights from previously completed sections, creating a cohesive and comprehensive analysis.

## 🚀 Quick Start

### Option 1: Use the PowerShell Script
```powershell
.\start-due-diligence-system.ps1
```

### Option 2: Manual Start
1. Start the backend API server:
   ```bash
   node backend-api-server.js
   ```

2. Start the frontend on port 2345:
   ```bash
   cd frontend
   npm run start:2345
   ```

3. Open your browser to: `http://localhost:2345`

## 📋 Features

### Core Functionality
- **20 Comprehensive Sections**: Complete due diligence coverage from Executive Summary to Final Recommendations
- **Section Context Learning**: Later sections automatically incorporate insights from previous sections
- **Real-time Progress Tracking**: Visual progress bar and section status indicators
- **Professional HTML Output**: Clean, formatted content suitable for reports
- **Auto-refresh**: Automatically polls for updates every 30 seconds

### Section Learning System
The key innovation of this system is that sections learn from each other:

1. **Sequential Generation**: Sections should be generated in order (1-20)
2. **Context Passing**: When generating a section, all previously completed sections are passed as context
3. **Intelligent Analysis**: The AI uses previous findings to create more comprehensive and cohesive reports
4. **Visual Context Display**: Each section shows which previous sections were used as context

## 🗂️ Section Structure

1. **Executive Summary** - High-level overview and key findings
2. **Company Overview** - Basic company information and structure
3. **Methodology** - Due diligence approach and data sources
4. **Financial Analysis** - Financial statements and performance metrics
5. **Market Analysis** - Industry and competitive landscape
6. **Management Team** - Leadership assessment and background checks
7. **Operations Review** - Operational efficiency and processes
8. **Technology Assessment** - IT infrastructure and digital capabilities
9. **Legal Review** - Legal compliance and outstanding issues
10. **Risk Assessment** - Identified risks and mitigation strategies
11. **Customer Analysis** - Customer base and relationship assessment
12. **Supplier Review** - Supply chain and vendor relationships
13. **Intellectual Property** - IP portfolio and protection strategies
14. **Environmental Impact** - Environmental compliance and sustainability
15. **Tax Review** - Tax compliance and optimization opportunities
16. **Insurance Coverage** - Insurance policies and coverage gaps
17. **Human Resources** - Employee assessment and HR policies
18. **Synergies Analysis** - Potential integration benefits
19. **Valuation** - Financial valuation and pricing analysis
20. **Recommendations** - Final recommendations and next steps

## 🎯 Usage Instructions

### Accessing the System
1. Navigate to `http://localhost:2345`
2. Login with your credentials
3. Click on **"Due Diligence Generator"** in the dashboard sidebar

### Generating Sections
1. **Start with Section 1**: Always begin with the Executive Summary
2. **Generate Sequentially**: Generate sections in order for best context learning
3. **Wait for Completion**: Each section takes 30-60 seconds to generate
4. **Review Content**: Click on any section to view its content
5. **Track Progress**: Use the progress bar to monitor completion

### Understanding Section Status
- 🔴 **Pending**: Not yet generated
- 🟡 **In Progress**: Currently being generated
- 🟢 **Completed**: Successfully generated
- 🔴 **Failed**: Generation failed (can retry)

## 🔧 Technical Details

### Frontend (Port 2345)
- **Framework**: React 18.3.1
- **Styling**: Custom CSS with professional theme
- **API Communication**: Axios for backend requests
- **Refresh**: Auto-polling every 30 seconds

### Backend (Port 10000)
- **Framework**: Express.js + Node.js
- **API Endpoints**: `/api/due-diligence/*`
- **Data Storage**: Mock data (can be upgraded to PostgreSQL)
- **AI Integration**: Ollama API support (localhost:11434)

### API Endpoints
- `GET /api/due-diligence/sections` - Get all sections
- `POST /api/due-diligence/generate` - Generate a specific section
- `GET /api/due-diligence/sections/:id` - Get specific section
- `PUT /api/due-diligence/sections/:id` - Update section manually
- `POST /api/due-diligence/reset` - Reset all sections

## 🤖 AI Integration

### Ollama Support
The system supports AI content generation via Ollama:
- **Model**: llama3:latest
- **Endpoint**: http://localhost:11434
- **Fallback**: If Ollama is unavailable, generates sample content

### Context Learning Prompt
```
You are a professional due diligence analyst. Generate comprehensive content for the "[SECTION_NAME]" section of a due diligence report.

Context from previous sections:
[PREVIOUS_SECTIONS_CONTENT]

Please generate detailed, professional content that builds upon the previous sections...
```

## 🎨 User Interface

### Color Scheme
- **Primary**: #FFD600 (Yellow/Gold)
- **Background**: #000000 (Black)
- **Secondary**: #333333 (Dark Gray)
- **Text**: #FFFFFF (White)

### Layout
- **Sidebar**: Section navigation and status
- **Main Area**: Content display with HTML rendering
- **Header**: Progress tracking and refresh controls

## 🔄 Section Context Learning Example

When generating Section 4 (Financial Analysis), the system will:

1. **Gather Context**: Retrieve content from Sections 1-3
2. **Create Prompt**: Include previous findings in the AI prompt
3. **Generate Content**: AI creates Section 4 building upon previous insights
4. **Store Context**: Record which sections were used as context
5. **Display**: Show context tags for transparency

This ensures each section becomes more comprehensive and cohesive as the report progresses.

## 📊 Progress Tracking

The system provides visual feedback:
- **Progress Bar**: Shows overall completion percentage
- **Section Status**: Color-coded indicators for each section
- **Context Tags**: Shows which previous sections influenced each generated section
- **Timestamps**: When each section was generated

## 🛠️ Customization

### Adding New Sections
1. Update `sectionDefinitions` in `due-diligence-api.js`
2. Add corresponding UI elements in `DueDiligencePage.js`
3. Update section count in progress calculations

### Modifying AI Prompts
Edit the prompt template in the `/generate` endpoint of `due-diligence-api.js`

### Styling Changes
Modify `DueDiligencePage.css` for visual customizations

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start on port 2345**
```bash
# Check if port is in use
netstat -ano | findstr 2345
# Kill process if needed
taskkill /PID [PID_NUMBER] /F
```

**Backend API not responding**
```bash
# Restart backend
node backend-api-server.js
# Check logs for errors
```

**Sections not generating**
1. Check if backend is running on port 10000
2. Verify Ollama is running (optional)
3. Check browser console for errors

## 📝 Notes

- The system currently uses mock data storage for demonstration
- For production use, implement PostgreSQL database integration
- AI content generation requires Ollama with llama3:latest model
- Section context learning works best when sections are generated sequentially

## 🔮 Future Enhancements

- **Database Integration**: Full PostgreSQL support
- **User Management**: Multi-user section assignment
- **Export Features**: PDF/Word export functionality
- **Template Management**: Custom section templates
- **Workflow Integration**: n8n workflow triggers
- **Advanced AI**: Multiple AI model support

This system demonstrates the power of context-aware AI content generation, where each section builds intelligently upon previous work to create comprehensive, professional due diligence reports.
