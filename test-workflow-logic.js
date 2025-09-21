const axios = require('axios');

async function testWorkflowLogic() {
    console.log('🧪 TESTING WORKFLOW LOGIC STEP BY STEP');
    console.log('======================================\n');
    
    try {
        // Step 1: Get Kanboard Tasks (simulating n8n "Get Kanboard Tasks" node)
        console.log('Step 1: Get Kanboard Tasks');
        console.log('---------------------------');
        const kanboardResponse = await axios.post('http://localhost:8000/jsonrpc.php', {
            jsonrpc: "2.0",
            method: "getAllTasks",
            id: 1,
            params: { project_id: 1 }
        }, {
            auth: { username: 'admin', password: 'admin' },
            headers: { 'Content-Type': 'application/json' }
        });
        
        const allTasks = kanboardResponse.data.result;
        console.log(`✅ Retrieved ${allTasks.length} tasks from Kanboard`);
        
        // Step 2: Filter New Tasks (simulating n8n "Filter New Tasks" node)
        console.log('\nStep 2: Filter New Tasks');
        console.log('-------------------------');
        const hasTasksFilter = allTasks && allTasks.length > 0;
        console.log(`Filter condition (result not empty): ${hasTasksFilter ? '✅ PASS' : '❌ FAIL'}`);
        
        if (!hasTasksFilter) {
            console.log('❌ WORKFLOW STOPS HERE: No tasks found');
            return;
        }
        
        // Step 3: Split Tasks (simulating n8n "Split Tasks" node)
        console.log('\nStep 3: Split Tasks');
        console.log('-------------------');
        console.log('Splitting tasks into individual items...');
        
        let processedTasks = 0;
        let dueDiligenceTasks = 0;
        
        for (let i = 0; i < allTasks.length; i++) {
            const task = allTasks[i];
            processedTasks++;
            
            console.log(`\n  Processing Task ${i + 1}:`);
            console.log(`    ID: ${task.id}`);
            console.log(`    Title: "${task.title}"`);
            
            // Step 4: Filter Due Diligence Tasks (simulating n8n "Filter Due Diligence Tasks" node)
            const isDueDiligence = task.title.toLowerCase().startsWith('due diligence:');
            console.log(`    Due Diligence Filter: ${isDueDiligence ? '✅ MATCH' : '❌ NO MATCH'}`);
            
            if (isDueDiligence) {
                dueDiligenceTasks++;
                console.log(`    → Would continue to "Get Task Files"`);
                
                // Step 5: Get Task Files (simulating n8n "Get Task Files" node)
                try {
                    const filesResponse = await axios.post('http://localhost:8000/jsonrpc.php', {
                        jsonrpc: "2.0",
                        method: "getTaskFiles",
                        id: 1,
                        params: { task_id: task.id }
                    }, {
                        auth: { username: 'admin', password: 'admin' },
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const files = filesResponse.data.result;
                    console.log(`    Files found: ${files ? files.length : 0}`);
                    
                    if (files && files.length > 0) {
                        console.log(`    → Would continue to "Filter Tasks with Files" → "Split Files" → AI processing`);
                    } else {
                        console.log(`    → Would continue to "Prepare Data (No Files)" → AI processing`);
                    }
                    
                } catch (fileError) {
                    console.log(`    ⚠️ Error getting files: ${fileError.message}`);
                    console.log(`    → Would continue to "Prepare Data (No Files)" → AI processing`);
                }
            } else {
                console.log(`    → SKIPPED (not Due Diligence task)`);
            }
        }
        
        // Summary
        console.log('\n🏁 WORKFLOW ANALYSIS SUMMARY');
        console.log('=============================');
        console.log(`Total tasks processed: ${processedTasks}`);
        console.log(`Due Diligence tasks found: ${dueDiligenceTasks}`);
        console.log(`Workflow would ${dueDiligenceTasks > 0 ? '✅ CONTINUE' : '❌ STOP'} past Split Tasks`);
        
        if (dueDiligenceTasks === 0) {
            console.log('\n❌ PROBLEM IDENTIFIED:');
            console.log('   No tasks match the Due Diligence filter');
            console.log('   Check that task titles start with "Due Diligence:"');
        } else {
            console.log('\n✅ WORKFLOW SHOULD WORK:');
            console.log(`   ${dueDiligenceTasks} Due Diligence tasks would trigger AI processing`);
            console.log('   Each task would go through the Maker-Checker-Approver pipeline');
        }
        
    } catch (error) {
        console.error('❌ Error in workflow logic test:', error.message);
    }
}

testWorkflowLogic();
