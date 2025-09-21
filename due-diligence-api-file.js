const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// File-based storage path
const DATA_DIR = path.join(__dirname, 'data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Section definitions matching your n8n workflow structure
const sectionDefinitions = [
  { id: 1, name: 'Introduction & Engagement Context', description: 'High-level overview and engagement scope', column: 'introduction_engagement_context' },
  { id: 2, name: 'Legal Disclaimers & Reliance Limitations', description: 'Legal framework and limitations', column: 'legal_disclaimers_reliance_limitations' },
  { id: 3, name: 'Methodology & Source Validation', description: 'Due diligence approach and data sources', column: 'methodology_source_validation' },
  { id: 4, name: 'Financial Trajectory & Revenue Quality', description: 'Financial statements and performance metrics', column: 'financial_trajectory_revenue_quality' },
  { id: 5, name: 'Partnerships & Ecosystem Alliances', description: 'Strategic partnerships and ecosystem', column: 'partnerships_ecosystem_alliances' },
  { id: 6, name: 'Intellectual Property & Technology', description: 'IP portfolio and technology assessment', column: 'intellectual_property_technology' },
  { id: 7, name: 'Governance & Disclosures Risks', description: 'Corporate governance and risk disclosure', column: 'governance_disclosures_risks' },
  { id: 8, name: 'Appendix & Management RFI', description: 'Additional information and management requests', column: 'appendix_management_rfi' },
  { id: 9, name: 'Market Analysis & Competitive Landscape', description: 'Detailed market and competition analysis', column: 'section_9' },
  { id: 10, name: 'Customer Analysis & Satisfaction', description: 'Customer base and satisfaction metrics', column: 'section_10' },
  { id: 11, name: 'Operational Excellence & Efficiency', description: 'Operations and process efficiency', column: 'section_11' },
  { id: 12, name: 'Human Resources & Talent', description: 'HR policies and talent management', column: 'section_12' },
  { id: 13, name: 'Technology Infrastructure & Security', description: 'IT infrastructure and cybersecurity', column: 'section_13' },
  { id: 14, name: 'Environmental & Sustainability', description: 'ESG and sustainability practices', column: 'section_14' },
  { id: 15, name: 'Supply Chain & Vendor Management', description: 'Supply chain analysis and vendor relationships', column: 'section_15' },
  { id: 16, name: 'Regulatory Compliance & Risk', description: 'Regulatory environment and compliance', column: 'section_16' },
  { id: 17, name: 'Financial Projections & Forecasting', description: 'Future financial projections', column: 'section_17' },
  { id: 18, name: 'Strategic Recommendations', description: 'Strategic recommendations and next steps', column: 'section_18' },
  { id: 19, name: 'Investment Thesis & Valuation', description: 'Investment analysis and valuation', column: 'section_19' },
  { id: 20, name: 'Executive Summary & Conclusions', description: 'Final summary and conclusions', column: 'section_20' }
];

// Initialize data directory and files
const initializeStorage = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize companies file
    try {
      await fs.access(COMPANIES_FILE);
    } catch {
      await fs.writeFile(COMPANIES_FILE, JSON.stringify([]));
    }
    
    // Initialize reports file
    try {
      await fs.access(REPORTS_FILE);
    } catch {
      await fs.writeFile(REPORTS_FILE, JSON.stringify({}));
    }
    
    console.log('✅ File-based storage initialized');
    return true;
  } catch (error) {
    console.error('❌ Storage initialization failed:', error.message);
    return false;
  }
};

// Helper functions
const readCompanies = async () => {
  try {
    const data = await fs.readFile(COMPANIES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeCompanies = async (companies) => {
  await fs.writeFile(COMPANIES_FILE, JSON.stringify(companies, null, 2));
};

const readReports = async () => {
  try {
    const data = await fs.readFile(REPORTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const writeReports = async (reports) => {
  await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2));
};

// Initialize on startup
initializeStorage();

// Webhook endpoint for n8n to update sections
router.post('/webhook/section-complete', async (req, res) => {
  try {
    const { companyId, sectionId, content, status } = req.body;
    
    console.log(`📨 Webhook received: Company ${companyId}, Section ${sectionId}`);
    
    if (!companyId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID and Section ID are required'
      });
    }
    
    const sectionDef = sectionDefinitions.find(s => s.id === parseInt(sectionId));
    if (!sectionDef) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID'
      });
    }
    
    // Update the section in file storage
    const reports = await readReports();
    if (!reports[companyId]) {
      reports[companyId] = {
        company_id: companyId,
        company_name: companyId,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sections: {}
      };
    }
    
    reports[companyId].sections[sectionDef.column] = {
      content: content,
      generated_at: new Date().toISOString(),
      status: 'completed'
    };
    reports[companyId].updated_at = new Date().toISOString();
    
    await writeReports(reports);
    
    console.log(`✅ Section ${sectionId} updated via webhook for company ${companyId}`);
    
    res.json({
      success: true,
      message: `Section ${sectionId} updated successfully`
    });
    
  } catch (error) {
    console.error('Error updating section via webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update section',
      error: error.message
    });
  }
});

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await readCompanies();
    
    // Ensure we have at least one sample company
    if (companies.length === 0) {
      const sampleCompany = {
        company_id: 'techstart_innovation',
        company_name: 'TechStart Innovation Inc.',
        created_at: new Date().toISOString(),
        status: 'in_progress'
      };
      companies.push(sampleCompany);
      await writeCompanies(companies);
    }
    
    res.json({ 
      success: true, 
      companies: companies 
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch companies',
      error: error.message 
    });
  }
});

// Get sections for a specific company
router.get('/sections/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const companies = await readCompanies();
    const company = companies.find(c => c.company_id === companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    const reports = await readReports();
    const companyReport = reports[companyId] || {
      sections: {}
    };

    // Transform to section format
    const sections = sectionDefinitions.map(def => {
      const sectionData = companyReport.sections[def.column] || {};
      const content = sectionData.content || '';
      const status = content ? 'completed' : 'pending';
      
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        content: content,
        status: status,
        generated_at: sectionData.generated_at || null,
        context_used: []
      };
    });

    res.json({ 
      success: true,
      company: {
        id: company.company_id,
        name: company.company_name,
        status: company.status
      },
      sections: sections
    });

  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sections',
      error: error.message 
    });
  }
});

// Get all sections (backwards compatibility)
router.get('/sections', async (req, res) => {
  try {
    const companies = await readCompanies();
    
    // Get the first company or create a sample one
    let company = companies[0];
    if (!company) {
      company = {
        company_id: 'techstart_innovation',
        company_name: 'TechStart Innovation Inc.',
        created_at: new Date().toISOString(),
        status: 'in_progress'
      };
      companies.push(company);
      await writeCompanies(companies);
    }
    
    const reports = await readReports();
    const companyReport = reports[company.company_id] || {
      sections: {}
    };
    
    // Transform to section format
    const sections = sectionDefinitions.map(def => {
      const sectionData = companyReport.sections[def.column] || {};
      const content = sectionData.content || '';
      const status = content ? 'completed' : 'pending';
      
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        content: content,
        status: status,
        generated_at: sectionData.generated_at || null,
        context_used: []
      };
    });

    res.json({ 
      success: true,
      company: {
        id: company.company_id,
        name: company.company_name,
        status: company.status
      },
      sections: sections
    });

  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sections',
      error: error.message 
    });
  }
});

// Generate content for a specific section by triggering n8n workflow
router.post('/generate', async (req, res) => {
  try {
    const { sectionId, companyId, userId, previousSections } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Section ID is required'
      });
    }

    // Find section definition
    const sectionDef = sectionDefinitions.find(s => s.id === parseInt(sectionId));
    if (!sectionDef) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID'
      });
    }

    console.log(`🚀 Triggering n8n workflow for section ${sectionId}`);

    // Try to trigger n8n workflow
    try {
      const n8nWebhookUrl = 'http://localhost:5678/webhook/generate-section';
      const response = await require('axios').post(n8nWebhookUrl, {
        companyId: companyId || 'techstart_innovation',
        sectionId: parseInt(sectionId),
        userId: userId || 'frontend_user',
        previousSections: previousSections || [],
        timestamp: new Date().toISOString()
      }, { timeout: 5000 });

      console.log('✅ n8n workflow triggered successfully');
      
      res.json({
        success: true,
        workflowTriggered: true,
        message: `n8n workflow triggered for section ${sectionId}`,
        webhookResponse: response.data
      });

    } catch (webhookError) {
      console.error('❌ n8n webhook failed - NO FALLBACK:', webhookError.message);
      
      res.status(500).json({
        success: false,
        workflowTriggered: false,
        message: `Failed to trigger n8n workflow for section ${sectionId}`,
        error: webhookError.message,
        note: 'n8n connection required - no fallback available'
      });
    }

  } catch (error) {
    console.error('Error generating section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate section',
      error: error.message
    });
  }
});

// Create company
router.post('/companies', async (req, res) => {
  try {
    const { companyName, folderId, content } = req.body;

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const companies = await readCompanies();
    const newCompany = {
      company_id: `company_${Date.now()}`,
      company_name: companyName,
      created_at: new Date().toISOString(),
      status: 'in_progress'
    };
    
    companies.push(newCompany);
    await writeCompanies(companies);

    res.json({
      success: true,
      message: 'Company created successfully',
      company: newCompany
    });

  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    });
  }
});

// Get specific section for a company
router.get('/sections/:companyId/:sectionId', async (req, res) => {
  try {
    const { companyId, sectionId } = req.params;
    
    const sectionDef = sectionDefinitions.find(s => s.id === parseInt(sectionId));
    if (!sectionDef) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID'
      });
    }
    
    const reports = await readReports();
    const companyReport = reports[companyId];
    
    if (!companyReport) {
      return res.status(404).json({
        success: false,
        message: 'Company report not found'
      });
    }
    
    const sectionData = companyReport.sections[sectionDef.column] || {};
    
    res.json({
      success: true,
      section: {
        id: parseInt(sectionId),
        name: sectionDef.name,
        content: sectionData.content || '',
        generated_at: sectionData.generated_at || null,
        status: sectionData.content ? 'completed' : 'pending'
      }
    });
    
  } catch (error) {
    console.error('Error fetching specific section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch section',
      error: error.message
    });
  }
});

// Webhook endpoint to trigger n8n workflow
router.post('/webhook/due-diligence-upload', async (req, res) => {
  try {
    console.log('=== DUE DILIGENCE UPLOAD WEBHOOK ===');
    console.log('Received webhook data:', JSON.stringify(req.body, null, 2));
    
    const { requestId, companyInfo, uploadedFiles, timestamp } = req.body;
    
    // Validate required data
    if (!companyInfo || !companyInfo.companyName || !uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data: companyInfo and uploadedFiles are required'
      });
    }
    
    // Save company data locally for tracking
    const companies = await readCompanies();
    const companyId = companyInfo.company_id || `comp_${Date.now()}_${companyInfo.companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    
    const newCompany = {
      id: companyId,
      name: companyInfo.companyName,
      description: companyInfo.description || '',
      industry: companyInfo.industry || 'Technology',
      contact_email: companyInfo.contactEmail || '',
      contact_phone: companyInfo.contactPhone || '',
      website_url: companyInfo.websiteUrl || '',
      created_at: new Date().toISOString(),
      source: 'website_upload',
      uploaded_files_count: uploadedFiles.length,
      processing_status: 'processing'
    };
    
    // Add or update company
    const existingIndex = companies.findIndex(c => c.id === companyId);
    if (existingIndex >= 0) {
      companies[existingIndex] = { ...companies[existingIndex], ...newCompany };
    } else {
      companies.push(newCompany);
    }
    
    await writeCompanies(companies);
    
    // Initialize empty report for this company
    const reports = await readReports();
    reports[companyId] = {
      company_id: companyId,
      company_name: companyInfo.companyName,
      sections: {},
      status: 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await writeReports(reports);
    
    console.log(`✅ Saved company data for: ${companyInfo.companyName} (${companyId})`);
    console.log(`📁 Files to process: ${uploadedFiles.length}`);
    
    // Forward to n8n webhook
    try {
      const axios = require('axios');
      const n8nWebhookUrl = 'http://localhost:5678/webhook/due-diligence-upload';
      
      console.log(`🔄 Forwarding to n8n webhook: ${n8nWebhookUrl}`);
      
      const n8nResponse = await axios.post(n8nWebhookUrl, req.body, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      console.log(`✅ n8n webhook responded: ${n8nResponse.status}`);
      console.log('n8n response data:', n8nResponse.data);
      
      res.json({
        success: true,
        message: 'Upload processed successfully and forwarded to n8n',
        company_id: companyId,
        request_id: requestId,
        n8n_status: n8nResponse.status,
        processing_started: true
      });
      
    } catch (n8nError) {
      console.error('❌ Error forwarding to n8n:', n8nError.message);
      
      // Update company status to error
      const updatedCompanies = await readCompanies();
      const companyIndex = updatedCompanies.findIndex(c => c.id === companyId);
      if (companyIndex >= 0) {
        updatedCompanies[companyIndex].processing_status = 'error';
        updatedCompanies[companyIndex].error_message = n8nError.message;
        await writeCompanies(updatedCompanies);
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to trigger n8n workflow',
        error: n8nError.message,
        company_id: companyId,
        local_save_successful: true
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

// Webhook endpoint for n8n to notify completion
router.post('/webhook/report-completed', async (req, res) => {
  try {
    console.log('🎉 Final report completion webhook received:', req.body);
    
    const { requestId, companyId, companyName, company_id, company_name, status, report, sections, message, timestamp } = req.body;
    
    // Handle both old and new parameter names
    const finalCompanyId = companyId || company_id;
    const finalCompanyName = companyName || company_name;
    
    if (!finalCompanyId || !finalCompanyName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: companyId/company_id and companyName/company_name'
      });
    }

    // Update the report in storage
    const reports = await readReports();
    
    if (!reports[finalCompanyId]) {
      reports[finalCompanyId] = {
        company_id: finalCompanyId,
        company_name: finalCompanyName,
        sections: {},
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    // Update sections if provided
    if (sections) {
      Object.keys(sections).forEach(sectionKey => {
        if (sections[sectionKey]) {
          reports[finalCompanyId].sections[sectionKey] = {
            content: sections[sectionKey],
            generated_at: new Date().toISOString(),
            status: 'completed'
          };
        }
      });
    }
    
    // Update overall status
    reports[finalCompanyId].status = status || 'completed';
    reports[finalCompanyId].updated_at = new Date().toISOString();
    
    await writeReports(reports);
    
    // Update company status
    const companies = await readCompanies();
    const companyIndex = companies.findIndex(c => c.id === finalCompanyId);
    if (companyIndex >= 0) {
      companies[companyIndex].processing_status = status || 'completed';
      companies[companyIndex].updated_at = new Date().toISOString();
      await writeCompanies(companies);
    }

    // Save completion notification for future retrieval
    const completionData = {
      requestId: requestId || `completion_${Date.now()}`,
      companyId: finalCompanyId,
      companyName: finalCompanyName,
      status: status || 'completed',
      report: report || {},
      message: message || 'Report generation completed',
      timestamp: timestamp || new Date().toISOString(),
      received_at: new Date().toISOString()
    };

    // Ensure completions directory exists
    const completionsDir = path.join(DATA_DIR, 'completions');
    try {
      await fs.mkdir(completionsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Save to file for later retrieval
    const completionFilePath = path.join(completionsDir, `${finalCompanyId}_completion.json`);
    await fs.writeFile(completionFilePath, JSON.stringify(completionData, null, 2));

    console.log(`✅ Updated report for company: ${finalCompanyName} (${finalCompanyId})`);
    console.log(`📄 Sections completed: ${Object.keys(sections || {}).length}`);

    res.json({
      success: true,
      message: 'Report updated successfully',
      company_id: finalCompanyId,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error handling report completion webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing report completion',
      error: error.message
    });
  }
});

// Get report completion status
router.get('/report-status/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const completionFilePath = path.join(DATA_DIR, 'completions', `${companyId}_completion.json`);
    
    if (fs.existsSync(completionFilePath)) {
      const completionData = JSON.parse(fs.readFileSync(completionFilePath, 'utf8'));
      res.json({
        success: true,
        completion: completionData
      });
    } else {
      res.json({
        success: true,
        completion: null,
        message: 'No completion data found'
      });
    }
  } catch (error) {
    console.error('❌ Error getting report status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving report status',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Due Diligence API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

module.exports = router;
