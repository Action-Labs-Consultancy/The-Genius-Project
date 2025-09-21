const express = require('express');
const router = express.Router();

// Mock section definitions
const sectionDefinitions = [
  { id: 1, name: 'Introduction & Engagement Context', description: 'High-level overview and engagement scope', column: 'introduction_engagement_context' },
  { id: 2, name: 'Legal Disclaimers & Reliance Limitations', description: 'Legal framework and limitations', column: 'legal_disclaimers_reliance_limitations' },
  { id: 3, name: 'Methodology & Source Validation', description: 'Due diligence approach and data sources', column: 'methodology_source_validation' },
  { id: 4, name: 'Financial Trajectory & Revenue Quality', description: 'Financial statements and performance metrics', column: 'financial_trajectory_revenue_quality' },
  { id: 5, name: 'Partnerships & Ecosystem Alliances', description: 'Strategic partnerships and ecosystem', column: 'partnerships_ecosystem_alliances' },
  { id: 6, name: 'Intellectual Property & Technology', description: 'IP portfolio and technology assessment', column: 'intellectual_property_technology' },
  { id: 7, name: 'Governance & Disclosures Risks', description: 'Corporate governance and risk disclosure', column: 'governance_disclosures_risks' },
  { id: 8, name: 'Appendix & Management RFI', description: 'Additional information and management requests', column: 'appendix_management_rfi' }
];

// Mock data for testing
const mockCompanies = [
  {
    company_id: 'demo_company_1',
    company_name: 'TechStart Innovation Inc.',
    created_at: new Date().toISOString(),
    status: 'completed'
  },
  {
    company_id: 'demo_company_2', 
    company_name: 'GreenEnergy Solutions LLC',
    created_at: new Date().toISOString(),
    status: 'in_progress'
  }
];

// Mock section content
const mockSectionContent = {
  1: `<h3>1. Introduction & Engagement Context</h3>
       <p>This comprehensive due diligence report provides an in-depth analysis of <strong>TechStart Innovation Inc.</strong>, a technology company specializing in artificial intelligence and machine learning solutions.</p>
       <h4>Engagement Scope</h4>
       <ul>
         <li>Financial performance analysis covering the last 3 fiscal years</li>
         <li>Market position and competitive landscape assessment</li>
         <li>Technology stack and intellectual property review</li>
         <li>Management team and organizational structure evaluation</li>
         <li>Legal and regulatory compliance review</li>
       </ul>
       <p>The analysis was conducted between ${new Date().toLocaleDateString()} and includes data through Q4 2024.</p>`,
       
  2: `<h3>2. Legal Disclaimers & Reliance Limitations</h3>
       <blockquote>
         <p><strong>Important Disclaimer:</strong> This report is prepared for informational purposes only and should not be construed as investment advice.</p>
       </blockquote>
       <h4>Reliance Limitations</h4>
       <ol>
         <li>The information contained herein is based on publicly available data and management representations</li>
         <li>No independent verification of all financial statements has been conducted</li>
         <li>Forward-looking statements are subject to inherent uncertainties</li>
         <li>This report does not constitute a recommendation to buy, sell, or hold any securities</li>
       </ol>
       <p>Recipients should conduct their own independent analysis and consult with professional advisors before making any investment decisions.</p>`,

  3: `<h3>3. Methodology & Source Validation</h3>
       <p>Our due diligence methodology follows industry best practices and incorporates multiple data sources to ensure comprehensive analysis.</p>
       <h4>Primary Data Sources</h4>
       <table>
         <thead>
           <tr><th>Source Type</th><th>Description</th><th>Reliability</th></tr>
         </thead>
         <tbody>
           <tr><td>Financial Statements</td><td>Audited financials for 2022-2024</td><td>High</td></tr>
           <tr><td>Management Interviews</td><td>Executive team discussions</td><td>Medium</td></tr>
           <tr><td>Market Research</td><td>Third-party industry reports</td><td>High</td></tr>
           <tr><td>Legal Documents</td><td>Corporate filings and contracts</td><td>High</td></tr>
         </tbody>
       </table>
       <h4>Analysis Framework</h4>
       <p>The analysis follows a structured approach covering financial, operational, strategic, and risk factors.</p>`,

  4: `<h3>4. Financial Trajectory & Revenue Quality</h3>
       <p>TechStart Innovation Inc. has demonstrated strong financial performance with consistent revenue growth over the evaluation period.</p>
       <h4>Revenue Analysis</h4>
       <ul>
         <li><strong>2024 Revenue:</strong> $12.5M (35% growth YoY)</li>
         <li><strong>2023 Revenue:</strong> $9.2M (28% growth YoY)</li>
         <li><strong>2022 Revenue:</strong> $7.2M</li>
       </ul>
       <h4>Revenue Quality Indicators</h4>
       <p>The company's revenue demonstrates high quality characteristics:</p>
       <ol>
         <li>Recurring revenue represents 78% of total revenue</li>
         <li>Customer retention rate of 94%</li>
         <li>Average contract length of 24 months</li>
         <li>Diversified customer base with no single customer >15% of revenue</li>
       </ol>
       <h4>Profitability Trends</h4>
       <p>EBITDA margins have improved from 12% in 2022 to 18% in 2024, indicating operational efficiency gains.</p>`
};

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      companies: mockCompanies 
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
    
    const company = mockCompanies.find(c => c.company_id === companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Transform database columns to section format
    const sections = sectionDefinitions.map(def => {
      const content = mockSectionContent[def.id] || '';
      const status = content ? 'completed' : 'pending';
      
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        content: content,
        status: status,
        generated_at: content ? new Date().toISOString() : null,
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
    const company = mockCompanies[0]; // Use first company as default
    
    // Transform database columns to section format
    const sections = sectionDefinitions.map(def => {
      const content = mockSectionContent[def.id] || '';
      const status = content ? 'completed' : 'pending';
      
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        content: content,
        status: status,
        generated_at: content ? new Date().toISOString() : null,
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

// Generate content for a specific section
router.post('/generate', async (req, res) => {
  try {
    const { sectionId, companyId, userId } = req.body;

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

    // For mock, just return that generation was triggered
    res.json({
      success: true,
      workflowTriggered: false,
      message: `Mock generation for section ${sectionId}`,
      section: {
        id: sectionId,
        content: mockSectionContent[sectionId] || `<p>Generated content for ${sectionDef.name}</p>`,
        generated_at: new Date().toISOString()
      }
    });

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

    const newCompany = {
      company_id: `company_${Date.now()}`,
      company_name: companyName,
      created_at: new Date().toISOString(),
      status: 'in_progress'
    };

    mockCompanies.push(newCompany);

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

module.exports = router;
