// Test Kanboard connection and Due Diligence task filtering
const http = require('http');

async function testKanboardConnection() {
    const auth = Buffer.from('admin:admin').toString('base64');
    
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            "jsonrpc": "2.0",
            "method": "getAllTasks",
            "id": 1,
            "params": {
                "project_id": 1
            }
        });

        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/jsonrpc.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Content-Length': postData.length
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ Kanboard Response:', JSON.stringify(response, null, 2));
                    
                    if (response.result && Array.isArray(response.result)) {
                        console.log(`📋 Found ${response.result.length} total tasks`);
                        
                        // Filter for Due Diligence tasks
                        const dueDiligenceTasks = response.result.filter(task => 
                            task.title && task.title.toLowerCase().startsWith('due diligence:')
                        );
                        
                        console.log(`🎯 Found ${dueDiligenceTasks.length} Due Diligence tasks:`);
                        dueDiligenceTasks.forEach(task => {
                            console.log(`   - ID: ${task.id}, Title: "${task.title}"`);
                            console.log(`   - Description: "${task.description || 'No description'}"`);
                        });
                        
                        resolve(dueDiligenceTasks);
                    } else {
                        console.log('❌ No tasks found or invalid response structure');
                        resolve([]);
                    }
                } catch (e) {
                    console.error('❌ Failed to parse Kanboard response:', e);
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            console.error('❌ Kanboard request failed:', e);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

async function testN8nCredentials() {
    console.log('\n🧪 Testing n8n credentials...');
    
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5678,
            path: '/rest/credentials',
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from('admin:GlassDoor2025!').toString('base64')
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('✅ n8n credentials endpoint accessible');
                console.log('📝 Response:', data);
                resolve(true);
            });
        });
        
        req.on('error', (e) => {
            console.error('❌ n8n credentials test failed:', e);
            resolve(false);
        });
        
        req.end();
    });
}

async function runTests() {
    console.log('🧪 KANBOARD & DUE DILIGENCE TASK TEST');
    console.log('=====================================\n');
    
    try {
        console.log('1. Testing Kanboard connection...');
        const tasks = await testKanboardConnection();
        
        console.log('\n2. Testing n8n connection...');
        await testN8nCredentials();
        
        if (tasks.length === 0) {
            console.log('\n⚠️  NO DUE DILIGENCE TASKS FOUND!');
            console.log('📝 To test the workflow:');
            console.log('   1. Go to http://localhost:8000');
            console.log('   2. Login with admin/admin');
            console.log('   3. Create a task titled: "Due Diligence: Test Company"');
            console.log('   4. Add description: "Company website: https://example.com"');
            console.log('   5. Upload some PDF files');
            console.log('   6. The workflow should trigger within 60 seconds');
        } else {
            console.log('\n✅ READY TO TEST WORKFLOW!');
            console.log('📄 Due Diligence tasks are available for processing');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTests();
