// Manual test of the MCA workflow logic
const https = require('https');
const http = require('http');

async function testWorkflow() {
    console.log('🚀 Testing MCA Workflow Logic...\n');
    
    // Step 1: Get Kanboard tasks
    console.log('📋 Step 1: Getting Kanboard tasks...');
    const auth = Buffer.from('admin:admin').toString('base64');
    const kanboardOptions = {
        hostname: 'localhost',
        port: 8000,
        path: '/jsonrpc.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        }
    };
    
    const kanboardBody = JSON.stringify({
        jsonrpc: "2.0",
        method: "getAllTasks",
        id: 1,
        params: {
            project_id: 1,
            status_id: 1
        }
    });
    
    try {
        const tasks = await makeRequest(kanboardOptions, kanboardBody);
        console.log(`✅ Found ${tasks.result.length} tasks`);
        
        // Step 2: Find DD task
        console.log('\n🔍 Step 2: Finding Due Diligence task...');
        const ddTask = tasks.result.find(task => 
            task.title.toLowerCase().includes('due diligence:') && 
            task.description.includes('http')
        );
        
        if (!ddTask) {
            console.log('❌ No valid Due Diligence task found');
            return;
        }
        
        console.log(`✅ Found DD task: ${ddTask.title}`);
        const companyName = ddTask.title.replace(/due diligence:\s*/i, '').trim();
        const websiteMatch = ddTask.description.match(/https?:\/\/[^\s]+/);
        const websiteUrl = websiteMatch ? websiteMatch[0] : null;
        
        console.log(`🏢 Company: ${companyName}`);
        console.log(`🌐 Website: ${websiteUrl}`);
        
        // Step 3: Test website fetch
        console.log('\n🌐 Step 3: Testing website fetch...');
        try {
            const websiteResponse = await fetch(websiteUrl);
            const websiteContent = await websiteResponse.text();
            console.log(`✅ Website fetched: ${websiteContent.length} characters`);
        } catch (error) {
            console.log(`⚠️ Website fetch failed: ${error.message}`);
        }
        
        // Step 4: Test FinBERT
        console.log('\n🤖 Step 4: Testing FinBERT analysis...');
        try {
            const finbertResponse = await fetch('http://localhost:5000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: ddTask.description + ' ' + companyName })
            });
            const finbertData = await finbertResponse.json();
            console.log(`✅ FinBERT analysis completed`);
        } catch (error) {
            console.log(`⚠️ FinBERT analysis failed: ${error.message}`);
        }
        
        // Step 5: Test Mistral
        console.log('\n🧠 Step 5: Testing Mistral AI...');
        try {
            const mistralResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mistral',
                    prompt: 'Hello, can you confirm you are working?',
                    stream: false
                })
            });
            const mistralData = await mistralResponse.json();
            console.log(`✅ Mistral AI responded`);
        } catch (error) {
            console.log(`⚠️ Mistral AI failed: ${error.message}`);
        }
        
        // Step 6: Test comment posting
        console.log('\n💬 Step 6: Testing comment posting...');
        const commentBody = JSON.stringify({
            jsonrpc: "2.0",
            method: "createComment",
            id: 1,
            params: {
                task_id: ddTask.id,
                content: `🧪 **TEST COMMENT**\n\nWorkflow test completed at ${new Date().toISOString()}\n\n✅ All systems operational!`
            }
        });
        
        try {
            const commentResponse = await makeRequest(kanboardOptions, commentBody);
            console.log(`✅ Test comment posted successfully!`);
            console.log(`📝 Comment ID: ${commentResponse.result}`);
        } catch (error) {
            console.log(`❌ Failed to post comment: ${error.message}`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Run the test
testWorkflow().catch(console.error);
