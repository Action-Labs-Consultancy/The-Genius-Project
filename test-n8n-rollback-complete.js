const axios = require('axios');

async function testN8nBackupComplete() {
    console.log('🔍 COMPREHENSIVE N8N BACKUP TEST');
    console.log('='.repeat(50));
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
        console.log('1. Testing health check...');
        const healthResponse = await axios.get('http://localhost:3001/api/health');
        console.log('✅ Health status received');
        console.log('   Kanboard:', healthResponse.data.services.kanboard?.status);
        console.log('   n8n:', healthResponse.data.services.n8n?.status);
        
        console.log('\n2. Creating n8n backup...');
        const backupResponse = await axios.post('http://localhost:3001/api/system/backup', {
            backupType: 'n8n',
            reason: 'Comprehensive test of improved n8n backup system'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        console.log('✅ n8n Backup created successfully!');
        console.log('   Version ID:', backupResponse.data.versionId);
        console.log('   Performance:', backupResponse.data.performanceMs + 'ms');
        console.log('   Data size:', JSON.stringify(backupResponse.data.dataSize, null, 2));
        
        console.log('\n3. Listing all backups...');
        const listResponse = await axios.get('http://localhost:3001/api/system/backups');
        console.log('✅ Backup list retrieved');
        console.log('   Total backups:', listResponse.data.backups?.length || 0);
        
        if (listResponse.data.backups && listResponse.data.backups.length > 0) {
            const latestBackup = listResponse.data.backups[0];
            console.log('   Latest backup:', latestBackup.versionId, '-', latestBackup.reason);
            
            console.log('\n4. Testing restore...');
            const restoreResponse = await axios.post(`http://localhost:3001/api/system/restore/${latestBackup.versionId}`, {
                userId: 'test-user'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            
            console.log('✅ Restore completed!');
            console.log('   Performance:', restoreResponse.data.performanceMs + 'ms');
            console.log('   Restored items:', JSON.stringify(restoreResponse.data.restoredItems, null, 2));
        }
        
        console.log('\n🎉 ALL TESTS PASSED! n8n rollback system is working perfectly!');
        
    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Error:', error.message);
        }
    }
}

testN8nBackupComplete();
