const axios = require('axios');

async function testTaigaWebhook() {
    console.log('🧪 Testing Taiga Due Diligence Webhook...');
    
    // Sample research task payload
    const researchTaskPayload = {
        action: 'create',
        type: 'task',
        subject: 'Research on Tesla Inc.',
        id: 123,
        version: 1,
        description: 'Conduct comprehensive due diligence research',
        project: {
            id: 1,
            name: 'Investment Research Project'
        },
        user: {
            id: 1,
            username: 'researcher'
        },
        created_date: new Date().toISOString()
    };
    
    try {
        console.log('📤 Testing research task webhook...');
        const response = await axios.post('http://localhost:5678/webhook/taiga-webhook', researchTaskPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Research task webhook response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Research task test failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
    
    // Test non-research task
    console.log('\n🧪 Testing non-research task...');
    const nonResearchPayload = {
        action: 'create',
        type: 'task',
        subject: 'Fix login bug',
        id: 124,
        version: 1
    };
    
    try {
        const response = await axios.post('http://localhost:5678/webhook/taiga-webhook', nonResearchPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Non-research task response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Non-research task test failed:');
        console.log('Error:', error.message);
    }
    
    console.log('\n📋 Workflow Setup Instructions:');
    console.log('1. Go to http://localhost:5678 in your browser');
    console.log('2. Find the "Taiga Due Diligence Research Automation" workflow');
    console.log('3. Edit the "Auth" node and replace:');
    console.log('   - "yourusername" with your actual Taiga username');
    console.log('   - "yourpassword" with your actual Taiga password');
    console.log('4. Activate the workflow');
    console.log('5. Test with a task subject like: "Research on [Company Name]"');
    
    console.log('\n🎯 Expected Results:');
    console.log('- Company name extraction from task subject');
    console.log('- 20 comprehensive research sections generated');
    console.log('- Research results appended to task description');
    console.log('- Completion rate and evidence tracking');
}

testTaigaWebhook();
