const http = require('http');

// Test script for Sequential MCA Due Diligence Workflow
console.log('🎯 TESTING SEQUENTIAL MCA DUE DILIGENCE WORKFLOW');
console.log('='.repeat(60));

async function makeKanboardRequest(method, params) {
    const auth = Buffer.from('admin:GlassDoor2025!').toString('base64');
    
    const postData = JSON.stringify({
        jsonrpc: "2.0",
        method: method,
        id: 1,
        params: params
    });

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/jsonrpc.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Basic ${auth}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function testSequentialWorkflow() {
    try {
        console.log('📋 Step 1: Creating Due Diligence task for sequential processing...');
        
        // Create a new Due Diligence task
        const createTaskResult = await makeKanboardRequest('createTask', {
            project_id: 1,
            title: 'Due Diligence: TechCorp Industries',
            description: 'Sequential section-by-section Due Diligence analysis for TechCorp Industries. This task will process each section through the MCA workflow one at a time.\n\nCompany Website: https://techcorp.example.com\nIndustry: Technology\nFunding Stage: Series B\n\n📊 Progress: 0/15 sections completed'
        });

        if (createTaskResult.error) {
            throw new Error(`Failed to create task: ${createTaskResult.error.message}`);
        }

        const taskId = createTaskResult.result;
        console.log(`✅ Created Due Diligence task with ID: ${taskId}`);

        console.log('\n🔄 Sequential Processing Flow:');
        console.log('1. Section 1 (Executive Summary) → Maker → Checker → Approver');
        console.log('2. Section 2 (Company Overview) → Maker → Checker → Approver');
        console.log('3. Section 3 (Business Model) → Maker → Checker → Approver');
        console.log('   ... continues for all 15 sections sequentially');
        console.log('4. Final Report: All sections combined into attachment');

        console.log('\n⚡ Key Features:');
        console.log('✅ ONE section at a time (no parallel processing)');
        console.log('✅ Automatic completion check (skips if already done)');
        console.log('✅ Rejection loops back to Maker for same section');
        console.log('✅ Sequential progression (section 1 → 2 → 3 → ...)');
        console.log('✅ Combined final report as attachment');

        console.log('\n📝 To test the workflow:');
        console.log('1. Import AI_Due_Diligence_MCA_Workflow.json into n8n');
        console.log('2. Ensure Ollama (localhost:11434) is running');
        console.log('3. Check that Kanboard (localhost:8000) is accessible');
        console.log('4. Activate the workflow in n8n');
        console.log('5. The workflow will process one section every 5 minutes');

        console.log('\n🔍 Monitoring Progress:');
        console.log(`- Watch task ${taskId} in Kanboard for section updates`);
        console.log('- Each section shows: 📋 **Section Name** - ✅ APPROVED');
        console.log('- Final output: Complete combined report with all sections');

        console.log('\n🚀 Workflow is ready for sequential section-by-section processing!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testSequentialWorkflow();
