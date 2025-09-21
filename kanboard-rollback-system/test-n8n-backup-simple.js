// Simple n8n backup test
const https = require('https');
const http = require('http');

// Test if n8n is running
function testN8nConnection() {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5678,
            path: '/rest/login',
            method: 'GET'
        }, (res) => {
            console.log(`✅ n8n is running on port 5678 - Status: ${res.statusCode}`);
            resolve(true);
        });
        
        req.on('error', (err) => {
            console.log(`❌ n8n not responding: ${err.message}`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ n8n connection timeout');
            resolve(false);
        });
        
        req.end();
    });
}

// Test rollback server
function testRollbackServer() {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/health',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const health = JSON.parse(data);
                console.log(`✅ Rollback server running - n8n status: ${health.services.n8n.status}`);
                resolve(health);
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ Rollback server not responding: ${err.message}`);
            resolve(null);
        });
        
        req.end();
    });
}

// Test backup API
function testBackupAPI() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            backupType: 'n8n',
            description: 'Test backup for workflow capture verification'
        });
        
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/system/backup',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('📋 Backup Result:', JSON.stringify(result, null, 2));
                    resolve(result);
                } catch (e) {
                    console.log('❌ Invalid backup response:', data);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ Backup API error: ${err.message}`);
            resolve(null);
        });
        
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 TESTING N8N BACKUP FUNCTIONALITY');
    console.log('=====================================');
    
    console.log('\n1. Testing n8n connection...');
    const n8nRunning = await testN8nConnection();
    
    console.log('\n2. Testing rollback server...');
    const serverHealth = await testRollbackServer();
    
    if (n8nRunning && serverHealth) {
        console.log('\n3. Testing backup API...');
        const backupResult = await testBackupAPI();
        
        if (backupResult && backupResult.success) {
            console.log('\n✅ SUCCESS: n8n backup is working!');
            if (backupResult.backup && backupResult.backup.n8nData) {
                const workflows = backupResult.backup.n8nData.workflows || [];
                const credentials = backupResult.backup.n8nData.credentials || [];
                console.log(`📊 Captured: ${workflows.length} workflows, ${credentials.length} credentials`);
                
                if (workflows.length > 0) {
                    console.log('🎯 WORKFLOW ROLLBACK IS NOW WORKING!');
                    workflows.forEach(wf => {
                        console.log(`   - ${wf.name} (${wf.nodes?.length || 0} nodes)`);
                    });
                } else {
                    console.log('⚠️ No workflows captured - check n8n has workflows');
                }
            }
        } else {
            console.log('\n❌ FAILED: Backup not working');
        }
    } else {
        console.log('\n❌ Prerequisites not met - check n8n and rollback server are running');
    }
}

runTests().catch(console.error);
