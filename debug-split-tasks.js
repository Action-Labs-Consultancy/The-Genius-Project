const axios = require('axios');

async function debugSplitTasks() {
    console.log('🔍 DEBUGGING SPLIT TASKS ISSUE');
    console.log('================================\n');
    
    try {
        // Test 1: Get Kanboard tasks directly
        console.log('1. Testing Kanboard API directly...');
        const kanboardResponse = await axios.post('http://localhost:8000/jsonrpc.php', {
            jsonrpc: "2.0",
            method: "getAllTasks",
            id: 1,
            params: { project_id: 1 }
        }, {
            auth: { username: 'admin', password: 'admin' },
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`✅ Kanboard Response Status: ${kanboardResponse.status}`);
        const tasks = kanboardResponse.data.result;
        console.log(`📋 Total tasks found: ${tasks.length}`);
        
        // Test 2: Filter Due Diligence tasks
        console.log('\n2. Filtering Due Diligence tasks...');
        const dueDiligenceTasks = tasks.filter(task => 
            task.title.toLowerCase().startsWith('due diligence:')
        );
        console.log(`🎯 Due Diligence tasks found: ${dueDiligenceTasks.length}`);
        
        dueDiligenceTasks.forEach((task, index) => {
            console.log(`   ${index + 1}. ID: ${task.id}, Title: "${task.title}"`);
        });
        
        // Test 3: Test splitInBatches logic simulation
        console.log('\n3. Testing Split Tasks logic...');
        console.log('Tasks structure for splitInBatches:');
        console.log('- Field to split: "result"');
        console.log(`- Data type: ${typeof tasks}`);
        console.log(`- Is array: ${Array.isArray(tasks)}`);
        console.log(`- First task structure:`, tasks[0] ? Object.keys(tasks[0]) : 'No tasks');
        
        // Test 4: Simulate what n8n splitInBatches would do
        if (tasks && tasks.length > 0) {
            console.log('\n4. Simulating n8n splitInBatches behavior...');
            tasks.forEach((task, index) => {
                console.log(`   Batch ${index + 1}:`);
                console.log(`     - Task ID: ${task.id}`);
                console.log(`     - Title: "${task.title}"`);
                console.log(`     - Due Diligence filter: ${task.title.toLowerCase().startsWith('due diligence:') ? 'MATCH' : 'NO MATCH'}`);
            });
        }
        
        // Test 5: Check if any Due Diligence tasks would proceed
        console.log('\n5. Checking workflow continuation...');
        const wouldProceed = dueDiligenceTasks.length > 0;
        console.log(`Would workflow continue past Split Tasks? ${wouldProceed ? '✅ YES' : '❌ NO'}`);
        
        if (!wouldProceed) {
            console.log('\n❌ PROBLEM IDENTIFIED:');
            console.log('   - No Due Diligence tasks are passing the filter');
            console.log('   - Check task titles in Kanboard');
            console.log('   - Verify filter condition is correct');
        } else {
            console.log('\n✅ Split Tasks should work correctly');
            console.log('   - Due Diligence tasks are available');
            console.log('   - Filter condition matches');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

debugSplitTasks();
