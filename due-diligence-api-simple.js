const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data - in-memory storage for testing
let reports = new Map();
let companies = [
  { id: 1, name: 'ActionLabs Technologies Inc.', status: 'active' },
  { id: 2, name: 'TechCorp Solutions Ltd.', status: 'active' },
  { id: 3, name: 'InnovatePlus LLC', status: 'active' }
];

// Section definitions matching the n8n workflow exactly
const sections = [
  {
    id: 'introduction_engagement_context',
    title: 'Introduction & Engagement Context',
    description: 'Overview of the due diligence engagement and contextual framework'
  },
  {
    id: 'legal_disclaimers_reliance_limitations',
    title: 'Legal Disclaimers & Reliance Limitations',
    description: 'Legal disclaimers, reliance limitations, and regulatory considerations'
  },
  {
    id: 'methodology_source_validation',
    title: 'Methodology & Source Validation',
    description: 'Due diligence methodology and source validation procedures'
  },
  {
    id: 'financial_trajectory_revenue_quality',
    title: 'Financial Trajectory & Revenue Quality',
    description: 'Financial performance analysis and revenue quality assessment'
  },
  {
    id: 'partnerships_ecosystem_alliances',
    title: 'Partnerships, Ecosystem & Alliances',
    description: 'Strategic partnerships, ecosystem analysis, and alliance evaluation'
  },
  {
    id: 'intellectual_property_technology',
    title: 'Intellectual Property & Technology',
    description: 'IP portfolio analysis and technology assessment'
  },
  {
    id: 'governance_disclosures_risks',
    title: 'Governance, Disclosures & Risks',
    description: 'Corporate governance, risk assessment, and disclosure analysis'
  },
  {
    id: 'appendix_management_rfi',
    title: 'Appendix & Management RFI',
    description: 'Supporting documentation and management information requests'
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Due Diligence API Server (Simple Mode) is running',
    sections: sections.length
  });
});

// Get all companies
app.get('/api/companies', (req, res) => {
  try {
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get all reports for a company
app.get('/api/reports/:companyId', (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const companyReports = Array.from(reports.values()).filter(r => r.company_id === companyId);
    res.json(companyReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get specific report with all sections
app.get('/api/reports/:companyId/:reportId', (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const report = reports.get(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Return report with sections data
    const response = {
      id: report.id,
      company_id: report.company_id,
      title: report.title,
      created_at: report.created_at,
      updated_at: report.updated_at,
      sections: {},
      consolidated_report: report.consolidated_report
    };

    // Add section content
    sections.forEach(section => {
      response.sections[section.id] = report[section.id] || null;
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Create new report
app.post('/api/reports', (req, res) => {
  try {
    const { companyId, title } = req.body;
    
    if (!companyId || !title) {
      return res.status(400).json({ error: 'Company ID and title are required' });
    }

    const reportId = Date.now(); // Simple ID generation
    const report = {
      id: reportId,
      company_id: parseInt(companyId),
      title: title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Initialize all sections as null
    sections.forEach(section => {
      report[section.id] = null;
    });

    // Initialize consolidated report
    report.consolidated_report = null;

    reports.set(reportId, report);
    res.json({ id: reportId, message: 'Report created successfully' });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Function to generate consolidated report from all sections
const generateConsolidatedReport = (report) => {
  const company = companies.find(c => c.id === report.company_id);
  const companyName = company ? company.name : 'Unknown Company';
  
  // Start with report header
  let consolidatedContent = `
    <div class="consolidated-report">
      <div class="report-header-consolidated">
        <h1>Due Diligence Report</h1>
        <h2>${companyName}</h2>
        <p class="report-date">Generated on ${new Date().toLocaleDateString()}</p>
        <hr style="border: 2px solid #007bff; margin: 30px 0;">
      </div>
      
      <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>This comprehensive due diligence report provides a detailed analysis of ${companyName} across multiple critical areas. The assessment encompasses financial trajectory, operational capabilities, governance structures, intellectual property portfolio, and strategic partnerships.</p>
      </div>
  `;

  // Add each completed section
  sections.forEach((section, index) => {
    const sectionContent = report[section.id];
    if (sectionContent) {
      consolidatedContent += `
        <div class="report-section-consolidated" id="section-${section.id}">
          <div class="section-number">${index + 1}.</div>
          <div class="section-content">
            ${sectionContent}
          </div>
        </div>
        <div class="section-break"></div>
      `;
    }
  });

  // Add report footer
  consolidatedContent += `
      <div class="report-footer">
        <hr style="border: 1px solid #dee2e6; margin: 40px 0 20px 0;">
        <p style="text-align: center; color: #6c757d; font-size: 14px;">
          <strong>This report was generated on ${new Date().toLocaleString()}</strong><br>
          Confidential and Proprietary Information
        </p>
      </div>
    </div>
  `;

  return consolidatedContent;
};

// Generate section content (mock implementation)
app.post('/api/generate/:reportId/:sectionId', (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const sectionId = req.params.sectionId;
    
    const report = reports.get(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    // Generate mock content
    const company = companies.find(c => c.id === report.company_id);
    const companyName = company ? company.name : 'Unknown Company';
    
    const mockContent = `
      <h3>${section.title}</h3>
      <p>This section provides detailed analysis of <strong>${companyName}</strong> regarding ${section.description.toLowerCase()}.</p>
      
      <h4>Executive Summary</h4>
      <p>Based on our comprehensive review and analysis, we have identified key areas of focus for this section. Our findings indicate that ${companyName} demonstrates strong performance in several critical areas while also presenting opportunities for improvement and strategic development.</p>
      
      <h4>Key Findings</h4>
      <ul>
        <li>Primary assessment indicates positive indicators in core operational areas</li>
        <li>Strategic positioning shows alignment with industry best practices</li>
        <li>Risk assessment reveals manageable exposure levels within acceptable parameters</li>
        <li>Compliance and regulatory framework appears robust and well-maintained</li>
      </ul>
      
      <h4>Detailed Analysis</h4>
      <p>Our detailed examination of ${section.description.toLowerCase()} reveals a comprehensive picture of ${companyName}'s current position. The analysis incorporates multiple data sources and validation methodologies to ensure accuracy and reliability of our findings.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Metric</th>
            <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Assessment</th>
            <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #dee2e6; padding: 12px;">Overall Rating</td>
            <td style="border: 1px solid #dee2e6; padding: 12px;">Positive with strategic opportunities</td>
            <td style="border: 1px solid #dee2e6; padding: 12px;">✅ Satisfactory</td>
          </tr>
          <tr>
            <td style="border: 1px solid #dee2e6; padding: 12px;">Risk Level</td>
            <td style="border: 1px solid #dee2e6; padding: 12px;">Low to moderate risk profile</td>
            <td style="border: 1px solid #dee2e6; padding: 12px;">✅ Acceptable</td>
          </tr>
          <tr>
            <td style="border: 1px solid #dee2e6; padding: 12px;">Compliance</td>
            <td style="border: 1px solid #dee2e6; padding: 12px;">Strong regulatory adherence</td>
            <td style="border: 1px solid #dee2e6; padding: 12px;">✅ Compliant</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Recommendations</h4>
      <p>Based on our analysis, we recommend the following strategic considerations:</p>
      <ol>
        <li>Continue current operational excellence initiatives</li>
        <li>Monitor key performance indicators on a quarterly basis</li>
        <li>Consider strategic enhancements in identified opportunity areas</li>
        <li>Maintain robust compliance and risk management frameworks</li>
      </ol>
      
      <blockquote style="border-left: 4px solid #007bff; margin: 20px 0; padding: 10px 20px; background: #f8f9fa; font-style: italic;">
        <p><strong>Note:</strong> This analysis is based on information available as of ${new Date().toLocaleDateString()} and should be reviewed in conjunction with other sections of this due diligence report for a comprehensive understanding.</p>
      </blockquote>
    `;

    // Update the report
    report[sectionId] = mockContent;
    report.updated_at = new Date().toISOString();
    
    // Regenerate consolidated report with all current sections
    report.consolidated_report = generateConsolidatedReport(report);
    
    reports.set(reportId, report);

    res.json({ 
      success: true, 
      message: `${section.title} generated successfully`,
      content: mockContent,
      consolidated_updated: true
    });
  } catch (error) {
    console.error('Error generating section:', error);
    res.status(500).json({ error: 'Failed to generate section content' });
  }
});

// Get consolidated report for a specific report
app.get('/api/reports/:companyId/:reportId/consolidated', (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const report = reports.get(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // If consolidated report doesn't exist, generate it
    if (!report.consolidated_report) {
      report.consolidated_report = generateConsolidatedReport(report);
      reports.set(reportId, report);
    }

    res.json({
      id: report.id,
      company_id: report.company_id,
      title: report.title,
      created_at: report.created_at,
      updated_at: report.updated_at,
      consolidated_report: report.consolidated_report,
      sections_count: sections.filter(s => report[s.id] !== null).length,
      total_sections: sections.length
    });
  } catch (error) {
    console.error('Error fetching consolidated report:', error);
    res.status(500).json({ error: 'Failed to fetch consolidated report' });
  }
});

// Regenerate consolidated report manually
app.post('/api/reports/:companyId/:reportId/regenerate-consolidated', (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const report = reports.get(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Regenerate consolidated report
    report.consolidated_report = generateConsolidatedReport(report);
    report.updated_at = new Date().toISOString();
    reports.set(reportId, report);

    res.json({
      success: true,
      message: 'Consolidated report regenerated successfully',
      sections_included: sections.filter(s => report[s.id] !== null).length,
      total_sections: sections.length
    });
  } catch (error) {
    console.error('Error regenerating consolidated report:', error);
    res.status(500).json({ error: 'Failed to regenerate consolidated report' });
  }
});

// Get section definitions
app.get('/api/sections', (req, res) => {
  res.json(sections);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
const PORT = process.env.PORT || 10001;
app.listen(PORT, () => {
  console.log(`🚀 Due Diligence API Server (Simple Mode) running on port ${PORT}`);
  console.log(`📊 Loaded ${sections.length} section definitions`);
  console.log(`🏢 ${companies.length} companies available for testing`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
