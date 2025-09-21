const axios = require('axios');

async function testFixedWorkflow() {
    console.log('🔍 TESTING FIXED WORKFLOW - IF NODE FILTER');
    console.log('==========================================\n');
    
    try {
        // Step 1: Get tasks
        console.log('1. Getting Kanboard tasks...');
        const response = await axios.post('http://localhost:8000/jsonrpc.php', {
            jsonrpc: "2.0",
            method: "getAllTasks", 
            id: 1,
            params: { project_id: 1 }
        }, {
            auth: { username: 'admin', password: 'admin' },
            headers: { 'Content-Type': 'application/json' }
        });

        const tasks = response.data.result;
        console.log(`✅ Retrieved ${tasks.length} tasks\n`);

        // Step 2: Simulate Split Tasks
        console.log('2. Simulating Split Tasks node...');
        console.log('   Each task processed individually:\n');

        let processedTasks = 0;

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            console.log(`   Task ${i + 1}: "${task.title}"`);
            
            // Step 3: Simulate IF node filter
            const titleLower = task.title.toLowerCase();
            const isDueDiligence = titleLower.startsWith("due diligence:");
            
            console.log(`   Filter result: ${isDueDiligence ? '✅ PASS (Due Diligence)' : '❌ SKIP (Not Due Diligence)'}`);
            
            if (isDueDiligence) {
                processedTasks++;
                console.log(`   → Would proceed to Get Task Files for task ID ${task.id}`);
                
                // Simulate getting files
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
                    console.log(`   → Found ${files.length} files`);
                    console.log(`   → Would proceed to AI processing (24 sections)`);
                } catch (error) {
                    console.log(`   → Error getting files: ${error.message}`);
                }
            }
            console.log('');
        }

        console.log(`🎉 WORKFLOW TEST COMPLETE`);
        console.log(`===========================`);
        console.log(`✅ Total tasks: ${tasks.length}`);
        console.log(`✅ Due Diligence tasks: ${processedTasks}`);
        console.log(`✅ Workflow would process ${processedTasks} tasks through full AI pipeline`);
        console.log(`✅ Each task would generate 24 AI-analyzed sections`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testFixedWorkflow();
