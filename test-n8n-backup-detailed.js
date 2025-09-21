const axios = require('axios');

async function testN8nBackupDetailed() {
    console.log('🔍 DETAILED N8N BACKUP TEST');
    console.log('='.repeat(50));
    
    try {
        // Test health check first
        console.log('1. Testing health check...');
        const healthResponse = await axios.get('http://localhost:3001/api/health');
        console.log('✅ Health status:', JSON.stringify(healthResponse.data, null, 2));
        
        // Test n8n backup
        console.log('\n2. Testing n8n backup...');
        const backupResponse = await axios.post('http://localhost:3001/api/system/backup', {
            backupType: 'n8n',
            reason: 'Detailed test of n8n backup functionality'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        console.log('✅ Backup successful!');
        console.log('Response:', JSON.stringify(backupResponse.data, null, 2));
        
        // List backups to verify
        console.log('\n3. Listing backups...');
        const listResponse = await axios.get('http://localhost:3001/api/system/backups');
        console.log('✅ Backup list:', JSON.stringify(listResponse.data, null, 2));
        
        // Test restore
        if (backupResponse.data.versionId) {
            console.log(`\n4. Testing restore of backup ${backupResponse.data.versionId}...`);
            const restoreResponse = await axios.post(`http://localhost:3001/api/system/restore/${backupResponse.data.versionId}`, {
                userId: 'test'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            
            console.log('✅ Restore successful!');
            console.log('Response:', JSON.stringify(restoreResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testN8nBackupDetailed();
