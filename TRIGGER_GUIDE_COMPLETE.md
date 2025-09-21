# 🎯 **WHERE TO CALL THE 20-SECTION DUE DILIGENCE SYSTEM**

## **Step-by-Step Trigger Guide**

### **Method 1: Taiga Web Interface (Recommended)**

#### **Step 1: Access Taiga**
- Open browser: `http://localhost:9000`
- Login credentials: `admin` / `admin123`

#### **Step 2: Navigate to Project**  
- Click on any existing project (or create new one)
- You'll see the project dashboard

#### **Step 3: Create Research Task**
- Click the **"New Task"** button or **"+"** icon
- Fill in the form:
  - **Subject**: `Research on [Company Name]` (e.g., "Research on Apple Inc")
  - **Description**: Any additional context
  - **Priority**: Select as needed
  - **Assigned to**: Can be left blank
- Click **"Create"**

#### **Step 4: Automatic Workflow Trigger**
- The moment you create the task, it triggers:
  - n8n webhook: `http://localhost:5678/webhook/taiga-webhook`
  - AI analysis begins automatically
  - 20 User Stories are created in Taiga
  - Each section gets detailed AI-generated content
  - Individual tasks are created with role assignments

---

### **Method 2: Direct Webhook Call (For Integration)**

#### **From Your Research Page or External App:**

```javascript
// JavaScript example for your research page
const triggerDueDiligence = async (companyName) => {
  const payload = {
    action: "create",
    type: "task",
    subject: `Research on ${companyName}`,
    id: Date.now(), // Unique ID
    version: 1,
    project: {
      id: 1, // Your project ID
      name: "Due Diligence Project"
    },
    user: {
      username: "admin"
    }
  };

  const response = await fetch('http://localhost:5678/webhook/taiga-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
};

// Usage
triggerDueDiligence("Tesla Inc");
```

#### **PowerShell Example:**
```powershell
$payload = @{
    action = "create"
    type = "task"
    subject = "Research on Tesla Inc"
    id = (Get-Date).Ticks
    version = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/taiga-webhook" -Method POST -Body $payload -Headers @{"Content-Type" = "application/json"}
```

---

### **Method 3: API Integration (For Automated Systems)**

#### **From Backend Systems:**

```python
import requests
import json
from datetime import datetime

def trigger_due_diligence(company_name, project_id=1):
    url = "http://localhost:5678/webhook/taiga-webhook"
    
    payload = {
        "action": "create",
        "type": "task", 
        "subject": f"Research on {company_name}",
        "id": int(datetime.now().timestamp()),
        "version": 1,
        "project": {
            "id": project_id,
            "name": "Due Diligence Project"
        },
        "user": {
            "username": "admin"
        }
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Usage
result = trigger_due_diligence("Apple Inc")
```

---

## **🔍 What Happens When You Trigger It**

### **Immediate Actions (Within 30 seconds):**
1. **Authentication**: System logs into Taiga with admin/admin123
2. **Company Extraction**: Extracts company name from "Research on [Company]"
3. **AI Analysis**: Calls Mistral LLM for each of 20 sections
4. **Structure Creation**: Creates 20 User Stories in Taiga

### **Detailed Process:**

#### **20 User Stories Created:**
1. **Executive Summary** - Overview and key findings
2. **Company Overview** - History, mission, structure  
3. **Financial Analysis** - Revenue, profitability, ratios
4. **Market Position** - Competitive landscape, market share
5. **Management Team** - Leadership backgrounds, compensation
6. **Products and Services** - Portfolio analysis, innovation
7. **Technology and Innovation** - R&D, patents, tech stack
8. **Legal and Regulatory** - Compliance, litigation, IP
9. **Risk Assessment** - Market, operational, financial risks
10. **ESG and Sustainability** - Environmental, social, governance
11. **Operations and Supply Chain** - Efficiency, vendor relations
12. **Human Resources** - Workforce, satisfaction, development
13. **Customer Analysis** - Segmentation, acquisition, lifetime value
14. **Strategic Partnerships** - Alliances, joint ventures
15. **Growth Strategy** - Expansion plans, acquisition strategy
16. **Digital Transformation** - Digital maturity, cybersecurity
17. **Competitive Intelligence** - Competitor analysis, threats
18. **Valuation Analysis** - DCF, comparables, precedents
19. **Investment Recommendation** - Investment thesis, risk-return
20. **Final Review and Sign-off** - Comprehensive review, sign-offs

#### **Each User Story Contains:**
- **AI-Generated Analysis** (1,000+ characters per section)
- **Assigned Roles**: Maker, Checker, Approver, QA, Integrity Checker
- **Compliance Requirements**: Evidence mandatory, audit trail
- **Individual Tasks** for each requirement
- **Professional Formatting** with disclaimers

---

## **🧪 TEST THE SYSTEM NOW**

### **Quick Test Steps:**

1. **Open Taiga**: http://localhost:9000
2. **Login**: admin/admin123  
3. **Create Task**: Subject = "Research on Tesla"
4. **Wait 30-60 seconds**
5. **Check Results**: Refresh page, see 20 new User Stories
6. **Verify Content**: Each story has detailed AI analysis

### **Expected Results:**
- **20 User Stories** created automatically
- **Comprehensive AI content** in each section
- **Professional formatting** with role assignments
- **Compliance structure** with evidence requirements
- **Audit trail** and workflow enforcement

---

## **📋 INTEGRATION CHECKLIST**

### **Before Using:**
- ✅ n8n running on localhost:5678
- ✅ Taiga running on localhost:9000  
- ✅ Ollama/Mistral running on localhost:11434
- ✅ Workflow imported and activated in n8n

### **For Your Research Page:**
- ✅ Add "Start Due Diligence" button
- ✅ Call webhook with company name
- ✅ Show progress indicator
- ✅ Link to Taiga project results

### **For External Systems:**
- ✅ API endpoint: `http://localhost:5678/webhook/taiga-webhook`
- ✅ POST method with JSON payload
- ✅ Include company name in subject field
- ✅ Handle response and error cases

---

## **🎯 TRIGGER SUMMARY**

| **Method** | **Where** | **How** | **Use Case** |
|------------|-----------|---------|--------------|
| **Taiga UI** | http://localhost:9000 | Create task with "Research on [Company]" | Manual research requests |
| **Webhook** | http://localhost:5678/webhook/taiga-webhook | POST JSON payload | Website integration |
| **API** | REST calls to webhook | Programmatic integration | Automated systems |
| **Scheduled** | n8n scheduler | Time-based triggers | Regular due diligence |

**The system is ready to generate comprehensive, AI-powered due diligence reports with full compliance tracking and audit trails!** 🚀
