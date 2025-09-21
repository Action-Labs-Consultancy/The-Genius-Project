const axios = require('axios');

async function testRollbackSystemProperly() {
    console.log('🧪 COMPREHENSIVE ROLLBACK SYSTEM TEST');
    console.log('='.repeat(60));
    
    try {
        // Step 1: Create a backup of current state
        console.log('1. Creating initial backup...');
        const backupResponse = await axios.post('http://localhost:3001/api/system/backup', {
            backupType: 'kanboard',
            reason: 'Test backup before creating new task'
        });
        
        const backupId = backupResponse.data.versionId;
        console.log(`✅ Backup created: ${backupId}`);
        console.log(`   Kanboard tasks in backup: ${backupResponse.data.dataSize.kanboard.totalTasks}`);
        
        // Step 2: Create a new task in Kanboard
        console.log('\n2. Creating a new test task...');
        const newTaskResponse = await axios.post('http://localhost:8000/jsonrpc.php', {
            jsonrpc: '2.0',
            method: 'createTask',
            id: 1,
            params: {
                project_id: 1,
                title: 'TEST TASK - SHOULD BE DELETED ON ROLLBACK',
                description: 'This task was created after the backup and should disappear when we rollback',
                color_id: 'red'
            }
        }, {
            auth: { username: 'admin', password: 'admin' }
        });
        
        const newTaskId = newTaskResponse.data.result;
        console.log(`✅ Created test task: ID ${newTaskId}`);
        
        // Step 3: Verify the task exists
        console.log('\n3. Verifying test task exists...');
        const tasksResponse = await axios.post('http://localhost:8000/jsonrpc.php', {
            jsonrpc: '2.0',
            method: 'getAllTasks',
            id: 1,
            params: { project_id: 1, status_id: 1 }
        }, {
            auth: { username: 'admin', password: 'admin' }
        });
        
        const currentTasks = tasksResponse.data.result || [];
        const testTaskExists = currentTasks.some(task => task.id == newTaskId);
        console.log(`✅ Task verification: ${testTaskExists ? 'EXISTS' : 'NOT FOUND'}`);
        console.log(`   Current total tasks: ${currentTasks.length}`);
        
        // Step 4: Restore the backup
        console.log(`\n4. Restoring backup ${backupId}...`);
        const restoreResponse = await axios.post(`http://localhost:3001/api/system/restore/${backupId}`, {
            userId: 'test-user'
        });
        
        console.log('✅ Restore completed!');
        console.log('   Restore details:', JSON.stringify(restoreResponse.data.restoredItems.kanboard, null, 2));
        
        // Step 5: Verify the task was deleted
        console.log('\n5. Verifying test task was deleted...');
        const tasksAfterRestore = await axios.post('http://localhost:8000/jsonrpc.php', {
            jsonrpc: '2.0',
            method: 'getAllTasks',
            id: 1,
            params: { project_id: 1, status_id: 1 }
        }, {
            auth: { username: 'admin', password: 'admin' }
        });
        
        const tasksAfter = tasksAfterRestore.data.result || [];
        const testTaskStillExists = tasksAfter.some(task => task.id == newTaskId);
        console.log(`✅ Task after restore: ${testTaskStillExists ? 'STILL EXISTS (❌ ROLLBACK FAILED)' : 'DELETED (✅ ROLLBACK WORKED)'}`);
        console.log(`   Tasks after restore: ${tasksAfter.length}`);
        
        // Step 6: Final result
        console.log('\n6. FINAL RESULT:');
        if (!testTaskStillExists) {
            console.log('🎉 ROLLBACK SYSTEM WORKS PERFECTLY!');
            console.log('   ✅ Task was properly deleted during rollback');
            console.log('   ✅ System state restored to backup point');
        } else {
            console.log('❌ ROLLBACK SYSTEM FAILED!');
            console.log('   ❌ Task still exists after rollback');
            console.log('   ❌ System state not properly restored');
        }
        
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

testRollbackSystemProperly();
