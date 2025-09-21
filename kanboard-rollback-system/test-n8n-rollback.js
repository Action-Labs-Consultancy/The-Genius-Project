const axios = require('axios');

async function testN8nRollback() {
    const rollbackUrl = 'http://localhost:3001';
    
    console.log('🔧 Testing n8n Rollback System...');
    console.log('='.repeat(50));
    
    try {
        // Test 1: Create n8n backup
        console.log('\n1. Creating n8n backup...');
        const backupResponse = await axios.post(`${rollbackUrl}/api/system/backup`, {
            reason: 'Testing n8n rollback functionality',
            backupType: 'n8n',
            userId: 'admin'
        });
        
        if (backupResponse.data.success) {
            console.log('✅ n8n backup created successfully!');
            console.log('📋 Backup ID:', backupResponse.data.versionId);
            console.log('📊 Data size:', backupResponse.data.dataSize);
            
            const versionId = backupResponse.data.versionId;
            
            // Test 2: List backups
            console.log('\n2. Listing backups...');
            const listResponse = await axios.get(`${rollbackUrl}/api/system/backups`);
            console.log('✅ Found', listResponse.data.backups.length, 'backups');
            
            // Test 3: Restore the backup
            console.log('\n3. Testing n8n restore...');
            const restoreResponse = await axios.post(`${rollbackUrl}/api/system/restore/${versionId}`, {
                userId: 'admin'
            });
            
            if (restoreResponse.data.success) {
                console.log('✅ n8n restore completed successfully!');
                console.log('📋 Restore summary:', restoreResponse.data.summary);
                console.log('📊 Restored items:', restoreResponse.data.restoredItems);
            } else {
                console.log('❌ n8n restore failed:', restoreResponse.data.error);
            }
            
        } else {
            console.log('❌ n8n backup failed:', backupResponse.data.error);
        }
        
        // Test 4: Health check
        console.log('\n4. Checking system health...');
        const healthResponse = await axios.get(`${rollbackUrl}/api/health`);
        console.log('✅ System health:', healthResponse.data.status);
        console.log('🔧 n8n status:', healthResponse.data.services.n8n.status);
        console.log('🏢 Kanboard status:', healthResponse.data.services.kanboard.status);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 n8n Rollback Test Complete!');
}

testN8nRollback().catch(console.error);
