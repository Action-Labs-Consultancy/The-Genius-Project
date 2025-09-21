const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5678;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mock n8n server running' });
});

// Due diligence webhook endpoint
app.post('/webhook/due-diligence-upload', async (req, res) => {
    try {
        console.log('🎯 Received due diligence upload webhook');
        console.log('📊 Company ID:', req.body.companyId);
        console.log('🏢 Company Name:', req.body.companyName);
        console.log('📁 Files:', req.body.files?.length || 0);
        
        // Simulate processing delay
        console.log('⚙️ Processing due diligence report...');
        
        // Send immediate response to prevent timeout
        res.status(200).json({
            message: 'Due diligence process started',
            companyId: req.body.companyId,
            status: 'processing'
        });
        
        // Simulate the workflow process
        setTimeout(async () => {
            try {
                console.log('✅ Simulating completion - sending to website...');
                
                // Generate mock report
                const mockReport = {
                    companyId: req.body.companyId,
                    companyName: req.body.companyName,
                    executiveSummary: "Based on our comprehensive analysis, " + req.body.companyName + " demonstrates strong financial fundamentals and operational capabilities. The company shows positive growth trends across key performance indicators.",
                    sections: {
                        "Executive Summary": "Comprehensive analysis reveals strong market position and growth potential.",
                        "Financial Analysis": "Revenue growth of 15% year-over-year with improving profit margins. Strong balance sheet with manageable debt levels.",
                        "Market Position": "Leading position in target market with competitive advantages in technology and customer relationships.",
                        "Risk Assessment": "Low to moderate risk profile with identified mitigation strategies for key operational risks.",
                        "Management Team": "Experienced leadership team with proven track record in industry. Strong governance practices in place.",
                        "Legal & Compliance": "No significant legal issues identified. Compliance frameworks appropriate for business scale and industry.",
                        "Technology Infrastructure": "Modern, scalable technology stack with appropriate cybersecurity measures and data protection protocols.",
                        "Growth Prospects": "Strong potential for expansion in current markets and opportunities for geographic diversification."
                    },
                    generatedAt: new Date().toISOString(),
                    status: 'completed'
                };
                
                // Send completion webhook to our API
                const axios = require('axios');
                await axios.post('http://localhost:10002/api/webhook/report-completed', mockReport, {
                    headers: { 'Content-Type': 'application/json' }
                });
                
                console.log('🚀 Report completion sent to website successfully');
                
            } catch (error) {
                console.error('❌ Error sending completion webhook:', error.message);
            }
        }, 5000); // 5 second delay to simulate processing
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Catch all other webhook endpoints
app.all('/webhook/*', (req, res) => {
    console.log(`📥 Received webhook: ${req.method} ${req.path}`);
    res.json({ message: 'Webhook received', path: req.path });
});

// Root endpoint for basic connectivity
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Mock n8n server root endpoint' });
});

app.listen(PORT, () => {
    console.log(`🎭 Mock n8n server running on port ${PORT}`);
    console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook/due-diligence-upload`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
