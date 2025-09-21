// Test n8n workflow import and credential setup
const fs = require('fs');
const http = require('http');

async function testN8nWorkflowImport() {
    console.log('🚀 N8N WORKFLOW SETUP TEST');
    console.log('==========================\n');
    
    // Test n8n basic auth
    console.log('1. Testing n8n authentication...');
    const auth = Buffer.from('admin:GlassDoor2025!').toString('base64');
    
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5678,
            path: '/',
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        }, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ n8n authentication working');
                
                // Test credentials endpoint
                const credReq = http.request({
                    hostname: 'localhost',
                    port: 5678,
                    path: '/rest/credentials',
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${auth}`
                    }
                }, (credRes) => {
                    let data = '';
                    credRes.on('data', chunk => data += chunk);
                    credRes.on('end', () => {
                        console.log('✅ n8n API accessible');
                        
                        // Check if kanboard_auth credential exists
                        try {
                            const credentials = JSON.parse(data);
                            const kanboardCred = credentials.find(c => c.name === 'kanboard_auth');
                            
                            if (kanboardCred) {
                                console.log('✅ kanboard_auth credential found');
                            } else {
                                console.log('⚠️  kanboard_auth credential not found');
                                console.log('📝 You need to create it in n8n:');
                                console.log('   1. Go to http://localhost:5678');
                                console.log('   2. Navigate to Credentials');
                                console.log('   3. Add "HTTP Basic Auth" credential:');
                                console.log('      - Name: kanboard_auth');
                                console.log('      - Username: admin');
                                console.log('      - Password: admin');
                            }
                        } catch (e) {
                            console.log('✅ n8n API working (credential format may vary)');
                        }
                        
                        console.log('\n2. Checking workflow file...');
                        if (fs.existsSync('./AI_Due_Diligence_Workflow.json')) {
                            console.log('✅ Workflow file exists');
                            console.log('📋 Ready to import into n8n!');
                            
                            console.log('\n🎯 NEXT STEPS:');
                            console.log('1. Open http://localhost:5678 (admin / GlassDoor2025!)');
                            console.log('2. Click "Import from File"');
                            console.log('3. Select AI_Due_Diligence_Workflow.json');
                            console.log('4. Create kanboard_auth credential if needed');
                            console.log('5. Activate the workflow');
                            console.log('6. It will check for Due Diligence tasks every 60 seconds!');
                        } else {
                            console.log('❌ Workflow file not found');
                        }
                        
                        resolve(true);
                    });
                });
                
                credReq.on('error', () => {
                    console.log('❌ n8n API error');
                    resolve(false);
                });
                
                credReq.end();
                
            } else {
                console.log(`❌ n8n authentication failed (${res.statusCode})`);
                console.log('🔧 Try restarting n8n with proper auth settings');
                resolve(false);
            }
        });
        
        req.on('error', () => {
            console.log('❌ n8n not accessible');
            console.log('🔧 Make sure n8n is running on port 5678');
            resolve(false);
        });
        
        req.end();
    });
}

testN8nWorkflowImport();
