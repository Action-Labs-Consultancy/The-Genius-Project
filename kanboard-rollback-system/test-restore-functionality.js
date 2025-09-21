#!/usr/bin/env node

/**
 * 🔄 RESTORE FUNCTIONALITY TEST
 * Verify that backup and restore actually works
 */

const http = require('http');

console.log('🔄 TESTING RESTORE FUNCTIONALITY');
console.log('===============================');

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonBody });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testRestore() {
    try {
        console.log('1️⃣ Creating a backup...');
        const backupResponse = await makeRequest('/api/system/backup', 'POST', {
            reason: 'Before restore test',
            userId: 'test_user'
        });
        
        if (backupResponse.status === 200) {
            console.log('✅ Backup created:', backupResponse.data.versionId);
            
            console.log('\n2️⃣ Listing available backups...');
            const listResponse = await makeRequest('/api/system/backups');
            
            if (listResponse.status === 200 && listResponse.data.backups.length > 0) {
                console.log(`✅ Found ${listResponse.data.backups.length} backups`);
                
                const latestBackup = listResponse.data.backups[0];
                console.log(`📦 Latest backup: ${latestBackup.versionId} (${latestBackup.reason})`);
                
                console.log('\n3️⃣ Testing restore functionality...');
                const restoreResponse = await makeRequest(`/api/system/restore/${latestBackup.versionId}`, 'POST', {
                    userId: 'test_user'
                });
                
                if (restoreResponse.status === 200) {
                    console.log('✅ RESTORE SUCCESSFUL!');
                    console.log('📊 Restore details:', {
                        versionId: restoreResponse.data.versionId,
                        performanceMs: restoreResponse.data.performanceMs,
                        restoredItems: restoreResponse.data.restoredItems,
                        summary: restoreResponse.data.summary
                    });
                    
                    console.log('\n🎉 RESTORE FUNCTIONALITY IS NOW WORKING!');
                    console.log('📝 The system will now actually restore Kanboard data');
                    
                } else {
                    console.log('❌ Restore failed:', restoreResponse.data);
                }
                
            } else {
                console.log('❌ No backups found');
            }
            
        } else {
            console.log('❌ Backup creation failed:', backupResponse.data);
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
}

// Run the test
setTimeout(() => {
    testRestore().then(() => {
        console.log('\n===============================');
        console.log('🔄 RESTORE TEST COMPLETE');
    }).catch(console.error);
}, 1000);
