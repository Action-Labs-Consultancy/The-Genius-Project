const fs = require('fs');
const axios = require('axios');

async function importTaigaWorkflow() {
    try {
        // Read the workflow JSON file
        const workflowJson = JSON.parse(fs.readFileSync('./taiga-due-diligence-workflow.json', 'utf8'));
        
        console.log('📋 Importing Taiga Due Diligence Research Workflow...');
        
        // Import workflow to n8n
        const response = await axios.post('http://localhost:5678/api/v1/workflows', workflowJson, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 201 || response.status === 200) {
            console.log('✅ Workflow imported successfully!');
            console.log(`📊 Workflow ID: ${response.data.id}`);
            console.log(`🔗 Webhook URL: http://localhost:5678/webhook/taiga-webhook`);
            
            console.log('\n📝 Setup Instructions:');
            console.log('1. Update the Auth node with your Taiga credentials:');
            console.log('   - Username: Replace "yourusername" with your Taiga username');
            console.log('   - Password: Replace "yourpassword" with your Taiga password');
            console.log('2. Configure Taiga webhook to send POST requests to:');
            console.log('   http://localhost:5678/webhook/taiga-webhook');
            console.log('3. Activate the workflow in n8n interface');
            console.log('4. Test by creating a task in Taiga with subject: "Research on [Company Name]"');
            
            console.log('\n🎯 Workflow Features:');
            console.log('- Automatically detects research tasks in Taiga');
            console.log('- Generates comprehensive due diligence reports');
            console.log('- Updates task description with research results');
            console.log('- Covers 20 key research sections');
            console.log('- Includes completion tracking and evidence references');
            
        } else {
            console.log('❌ Failed to import workflow');
            console.log('Response:', response.data);
        }
        
    } catch (error) {
        console.log('❌ Error importing workflow:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
        
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure n8n is running on http://localhost:5678');
        console.log('2. Check if the workflow JSON is valid');
        console.log('3. Verify n8n API is accessible');
    }
}

// Run the import
importTaigaWorkflow();
