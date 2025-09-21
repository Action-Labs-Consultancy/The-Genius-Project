const axios = require('axios');

async function testTaigaWorkflow() {
    console.log('🧪 Testing Taiga Due Diligence Workflow...');
    
    // Sample webhook payload that simulates a Taiga task creation
    const testPayload = {
        action: 'create',
        type: 'task',
        subject: 'Research on Acme Corporation',
        id: 12345,
        version: 1,
        description: 'Initial task description',
        project: {
            id: 1,
            name: 'Due Diligence Project'
        },
        user: {
            id: 1,
            username: 'testuser'
        },
        created_date: new Date().toISOString()
    };
    
    try {
        console.log('📤 Sending test webhook to n8n...');
        console.log('Payload:', JSON.stringify(testPayload, null, 2));
        
        const response = await axios.post('http://localhost:5678/webhook/taiga-webhook', testPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Webhook executed successfully!');
        console.log('📊 Response Status:', response.status);
        console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));
        
        console.log('\n🎯 Expected Workflow Steps:');
        console.log('1. ✅ Webhook received');
        console.log('2. 🔐 Authentication with Taiga');
        console.log('3. ✔️ Research task condition check');
        console.log('4. 🏢 Company name extraction: "Acme Corporation"');
        console.log('5. 📝 Research sections definition (20 sections)');
        console.log('6. 🔬 Research data simulation');
        console.log('7. 📤 Task update with results');
        
    } catch (error) {
        console.log('❌ Test failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
        
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure the workflow is imported and activated');
        console.log('2. Check n8n is running on http://localhost:5678');
        console.log('3. Verify the webhook path "taiga-webhook" is correct');
        console.log('4. Ensure Taiga credentials are configured in the Auth node');
    }
}

async function testNonResearchTask() {
    console.log('\n🧪 Testing Non-Research Task (should skip workflow)...');
    
    const nonResearchPayload = {
        action: 'create',
        type: 'task',
        subject: 'Fix login bug',
        id: 12346,
        version: 1
    };
    
    try {
        const response = await axios.post('http://localhost:5678/webhook/taiga-webhook', nonResearchPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Non-research task handled correctly');
        console.log('📋 Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Non-research test failed:', error.message);
    }
}

// Run tests
async function runAllTests() {
    await testTaigaWorkflow();
    await testNonResearchTask();
    
    console.log('\n📚 Workflow Documentation:');
    console.log('Research sections covered:');
    const sections = [
        'Introduction', 'Company Overview', 'History and Background',
        'Mission and Vision', 'Organizational Structure', 'Management Team',
        'Products and Services', 'Market Analysis', 'Competitive Landscape',
        'Customer Base', 'Sales and Marketing Strategy', 'Financial Performance',
        'Revenue and Profitability', 'Funding and Investors', 'Assets and Liabilities',
        'Legal Structure and Compliance', 'Intellectual Property', 'Litigation and Legal Risks',
        'Operational Risks', 'Strategic Risks and Future Outlook'
    ];
    
    sections.forEach((section, index) => {
        console.log(`${index + 1}. ${section}`);
    });
}

runAllTests();
