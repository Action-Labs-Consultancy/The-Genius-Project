const axios = require('axios');

async function testCompleteRollback() {
    const rollbackUrl = 'http://localhost:3001';
    
    console.log('🧪 Testing Complete Rollback System');
    console.log('='.repeat(50));
    
    try {
        // Test 1: Health Check
        console.log('\n1. Testing system health...');
        const healthResponse = await axios.get(`${rollbackUrl}/api/health`);
        console.log('✅ Health check:', healthResponse.data);
        
        if (healthResponse.data.services.kanboard.status !== 'connected') {
            console.log('⚠️ Kanboard not connected');
        }
        
        if (healthResponse.data.services.n8n.status !== 'connected') {
            console.log('⚠️ n8n not connected, testing authentication...');
        }
        
        // Test 2: Create n8n backup
        console.log('\n2. Creating n8n backup...');
        const backupResponse = await axios.post(`${rollbackUrl}/api/system/backup`, {
            reason: 'Complete rollback test',
            backupType: 'n8n',
            userId: 'admin'
        });
        
        if (backupResponse.data.success) {
            console.log('✅ n8n backup created:', backupResponse.data.versionId);
            console.log('Backup data size:', backupResponse.data.dataSize);
            
            // Test 3: List backups
            console.log('\n3. Listing backups...');
            const listResponse = await axios.get(`${rollbackUrl}/api/system/backups`);
            console.log('✅ Backup list retrieved:', listResponse.data.backups.length, 'backups');
            
            // Test 4: Test restore
            console.log('\n4. Testing restore...');
            const restoreResponse = await axios.post(`${rollbackUrl}/api/system/restore/${backupResponse.data.versionId}`, {
                userId: 'admin'
            });
            
            if (restoreResponse.data.success) {
                console.log('✅ Restore successful:', restoreResponse.data.summary);
                console.log('Restored items:', restoreResponse.data.restoredItems);
            } else {
                console.log('❌ Restore failed:', restoreResponse.data.error);
            }
            
        } else {
            console.log('❌ n8n backup failed:', backupResponse.data.error);
        }
        
        // Test 5: Create full system backup
        console.log('\n5. Creating full system backup...');
        const fullBackupResponse = await axios.post(`${rollbackUrl}/api/system/backup`, {
            reason: 'Full system test',
            backupType: 'full',
            userId: 'admin'
        });
        
        if (fullBackupResponse.data.success) {
            console.log('✅ Full system backup created:', fullBackupResponse.data.versionId);
            console.log('Performance:', fullBackupResponse.data.performanceMs + 'ms');
        } else {
            console.log('❌ Full backup failed:', fullBackupResponse.data.error);
        }
        
        console.log('\n🎉 Complete rollback system test finished!');
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testCompleteRollback().catch(console.error);
