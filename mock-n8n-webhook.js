const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mock n8n webhook endpoint
app.post('/webhook/due-diligence-upload', async (req, res) => {
  console.log('=== N8N WEBHOOK RECEIVED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const { requestId, companyInfo, uploadedFiles } = req.body;
  
  // Simulate processing
  console.log(`Processing ${uploadedFiles?.length || 0} files for ${companyInfo?.companyName || 'Unknown Company'}`);
  
  // Return success response immediately
  res.json({
    success: true,
    message: 'Due diligence generation started',
    requestId: requestId,
    companyId: companyInfo?.company_id,
    status: 'processing',
    estimatedTime: '5-10 minutes',
    webhook_received_at: new Date().toISOString()
  });
  
  // Simulate async processing and completion after 10 seconds
  setTimeout(async () => {
    try {
      console.log('🔄 Simulating report completion...');
      
      // Generate mock report sections
      const mockSections = {
        introduction_engagement_context: {
          content: `**Executive Summary**\n\nThis due diligence report provides a comprehensive analysis of ${companyInfo?.companyName || 'the target company'}, focusing on key business, financial, and strategic aspects. Our analysis is based on ${uploadedFiles?.length || 0} documents provided and covers critical areas including business model, financial performance, market position, and growth potential.\n\n**Key Findings:**\n• Strong market position in the ${companyInfo?.industry || 'technology'} sector\n• Robust business model with multiple revenue streams\n• Experienced management team with proven track record\n• Significant growth opportunities identified\n\n**Recommendation:** Proceed with detailed due diligence based on initial positive assessment.`
        },
        legal_disclaimers_reliance_limitations: {
          content: `**Legal Framework & Disclaimers**\n\nThis report is prepared for informational purposes only and should not be construed as investment advice. The analysis is based on information provided by the company and publicly available sources.\n\n**Key Limitations:**\n• Analysis limited to documents provided as of ${new Date().toLocaleDateString()}\n• No independent verification of financial statements performed\n• Market data based on publicly available information\n• Forward-looking statements subject to inherent uncertainties\n\n**Reliance Limitations:**\n• This report should be used in conjunction with other due diligence activities\n• Professional advice should be sought for investment decisions\n• Information accuracy depends on source reliability`
        },
        methodology_source_validation: {
          content: `**Due Diligence Methodology**\n\nOur analysis employs a comprehensive approach combining quantitative and qualitative assessment methods:\n\n**Document Analysis:**\n• Financial statements and management reports\n• Business plans and strategic documents\n• Legal and regulatory filings\n• ${uploadedFiles?.length || 0} documents processed using AI-powered extraction\n\n**Validation Process:**\n• Cross-reference multiple data sources\n• Industry benchmark comparisons\n• Management interview insights\n• Third-party market research integration\n\n**Quality Assurance:**\n• Multi-stage review process\n• Expert validation of key findings\n• Sensitivity analysis on critical assumptions`
        },
        financial_trajectory_revenue_quality: {
          content: `**Financial Performance Analysis**\n\nBased on available financial data, ${companyInfo?.companyName || 'the company'} demonstrates solid financial fundamentals:\n\n**Revenue Analysis:**\n• Consistent revenue growth trajectory\n• Diversified revenue streams reducing concentration risk\n• Strong customer retention metrics\n• Predictable recurring revenue components\n\n**Profitability Metrics:**\n• Improving gross margins over time\n• Controlled operating expense growth\n• Positive EBITDA trends\n• Efficient capital deployment\n\n**Quality Indicators:**\n• High-quality revenue with low customer concentration\n• Strong cash collection efficiency\n• Limited revenue recognition issues\n• Transparent financial reporting practices`
        }
      };
      
      // Send completion webhook to backend
      const completionData = {
        company_id: companyInfo?.company_id,
        company_name: companyInfo?.companyName,
        sections: mockSections,
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      
      console.log('📤 Sending completion webhook to backend...');
      await axios.post('http://localhost:10001/api/webhook/report-completed', completionData);
      console.log('✅ Report completion sent to backend successfully');
      
    } catch (error) {
      console.error('❌ Error sending completion webhook:', error.message);
    }
  }, 10000); // 10 second delay
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mock n8n Webhook Receiver',
    timestamp: new Date().toISOString()
  });
});

const PORT = 5678;
app.listen(PORT, () => {
  console.log('🤖 Mock n8n Webhook Receiver Started');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook/due-diligence-upload`);
  console.log('✅ CORS enabled for all origins');
  console.log('🔄 Will simulate report completion after 10 seconds');
});
