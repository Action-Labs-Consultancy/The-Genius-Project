const axios = require('axios');

async function comprehensiveWorkflowDiagnostic() {
    console.log('🔍 COMPREHENSIVE WORKFLOW DIAGNOSTIC');
    console.log('=====================================\n');
    
    try {
        // Test 1: Kanboard API Response Structure
        console.log('1. Testing Kanboard API Response Structure...');
        const response = await axios.post('http://localhost:8000/jsonrpc.php', {
            jsonrpc: "2.0",
            method: "getAllTasks",
            id: 1,
            params: { project_id: 1 }
        }, {
            auth: { username: 'admin', password: 'admin' },
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`✅ Status: ${response.status}`);
        console.log(`📋 Response structure: ${JSON.stringify(Object.keys(response.data), null, 2)}`);
        console.log(`🎯 Result type: ${Array.isArray(response.data.result) ? 'Array' : typeof response.data.result}`);
        console.log(`📊 Task count: ${response.data.result?.length || 0}\n`);

        const tasks = response.data.result;
        
        // Test 2: Split Tasks Logic Simulation
        console.log('2. Testing Split Tasks Logic...');
        if (!Array.isArray(tasks)) {
            console.log('❌ CRITICAL ISSUE: tasks.result is not an array!');
            console.log(`   Type: ${typeof tasks}`);
            console.log(`   Value: ${JSON.stringify(tasks)}`);
            return;
        }
        
        console.log(`✅ Split Tasks input is valid array with ${tasks.length} items`);
        
        // Test 3: Simulate n8n splitInBatches behavior
        console.log('\n3. Simulating n8n splitInBatches Processing...');
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            console.log(`\n   📦 Batch ${i + 1}:`);
            console.log(`      Task ID: ${task.id}`);
            console.log(`      Title: "${task.title}"`);
            console.log(`      Has required fields: ${task.id && task.title ? '✅' : '❌'}`);
            
            // Test IF node condition
            const titleExists = task.title && typeof task.title === 'string';
            if (!titleExists) {
                console.log(`      ❌ ISSUE: Missing or invalid title field`);
                continue;
            }
            
            const titleLower = task.title.toLowerCase();
            const isDueDiligence = titleLower.startsWith("due diligence:");
            
            console.log(`      Title (lowercase): "${titleLower}"`);
            console.log(`      Filter match: ${isDueDiligence ? '✅ PASS' : '❌ SKIP'}`);
            
            if (isDueDiligence) {
                console.log(`      → Would continue to Get Task Files`);
                
                // Test the Get Task Files step
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
                    
                    console.log(`      → Files API response: ${filesResponse.status}`);
                    console.log(`      → Files found: ${filesResponse.data.result?.length || 0}`);
                } catch (fileError) {
                    console.log(`      → Files API error: ${fileError.message}`);
                }
            }
        }

        // Test 4: Check actual workflow file structure
        console.log('\n4. Analyzing Workflow JSON Structure...');
        const fs = require('fs');
        const workflowPath = 'c:\\Users\\PC\\The-Genius-Project\\AI_Due_Diligence_Workflow_Fixed.json';
        
        if (fs.existsSync(workflowPath)) {
            const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
            
            // Check Split Tasks node
            const splitTasksNode = workflowData.nodes.find(node => node.name === 'Split Tasks');
            if (splitTasksNode) {
                console.log(`✅ Split Tasks node found`);
                console.log(`   Type: ${splitTasksNode.type}`);
                console.log(`   Field to split: ${splitTasksNode.parameters.fieldToSplitOut}`);
            } else {
                console.log(`❌ Split Tasks node NOT FOUND`);
            }
            
            // Check Filter Due Diligence Tasks node
            const filterNode = workflowData.nodes.find(node => node.name === 'Filter Due Diligence Tasks');
            if (filterNode) {
                console.log(`✅ Filter Due Diligence Tasks node found`);
                console.log(`   Type: ${filterNode.type}`);
                console.log(`   Type Version: ${filterNode.typeVersion}`);
                
                if (filterNode.type === 'n8n-nodes-base.if') {
                    const condition = filterNode.parameters.conditions?.conditions?.[0];
                    if (condition) {
                        console.log(`   Left Value: ${condition.leftValue}`);
                        console.log(`   Right Value: ${condition.rightValue}`);
                        console.log(`   Operation: ${condition.operator?.operation}`);
                    }
                }
            } else {
                console.log(`❌ Filter Due Diligence Tasks node NOT FOUND`);
            }
            
            // Check connections
            const connections = workflowData.connections;
            const splitTasksConnections = connections['Split Tasks'];
            const filterConnections = connections['Filter Due Diligence Tasks'];
            
            console.log(`✅ Split Tasks connections: ${splitTasksConnections ? 'Found' : 'Missing'}`);
            console.log(`✅ Filter connections: ${filterConnections ? 'Found' : 'Missing'}`);
            
        } else {
            console.log(`❌ Workflow file not found at: ${workflowPath}`);
        }

        // Test 5: Summary and Diagnosis
        console.log('\n5. 🎯 DIAGNOSIS SUMMARY');
        console.log('========================');
        
        const dueDiligenceTasks = tasks.filter(task => 
            task.title && task.title.toLowerCase().startsWith("due diligence:")
        );
        
        console.log(`✅ Kanboard API: Working (${tasks.length} total tasks)`);
        console.log(`✅ Due Diligence tasks: ${dueDiligenceTasks.length} found`);
        console.log(`✅ Data structure: ${Array.isArray(tasks) ? 'Valid array' : 'Invalid'}`);
        
        if (dueDiligenceTasks.length > 0) {
            console.log('\n📋 Due Diligence tasks that should be processed:');
            dueDiligenceTasks.forEach((task, index) => {
                console.log(`   ${index + 1}. ID ${task.id}: "${task.title}"`);
            });
        }
        
        console.log('\n🔧 POTENTIAL ISSUES TO CHECK:');
        console.log('1. n8n workflow might not be active/enabled');
        console.log('2. Credential "kanboard_auth" might be missing in n8n');
        console.log('3. IF node might have wrong configuration');
        console.log('4. Workflow execution might be failing silently');

    } catch (error) {
        console.error('❌ DIAGNOSTIC ERROR:', error.message);
        console.error('Stack:', error.stack);
    }
}

comprehensiveWorkflowDiagnostic();
