const axios = require('axios');

async function testN8nWorkflow() {
    console.log('🧪 TESTING N8N WORKFLOW EXECUTION');
    console.log('==================================\n');
    
    const n8nAuth = {
        username: 'admin',
        password: 'GlassDoor2025!'
    };
    
    try {
        // Test 1: Check n8n connection
        console.log('1. Testing n8n connection...');
        const healthCheck = await axios.get('http://localhost:5678/rest/workflows', {
            auth: n8nAuth
        });
        console.log(`✅ n8n API Status: ${healthCheck.status}`);
        console.log(`📋 Workflows found: ${healthCheck.data.length}`);
        
        // Test 2: Look for our workflow
        console.log('\n2. Looking for AI Due Diligence workflow...');
        const aiWorkflow = healthCheck.data.find(wf => 
            wf.name.includes('AI Due Diligence') || wf.name.includes('MCA Pipeline')
        );
        
        if (aiWorkflow) {
            console.log(`✅ Found workflow: "${aiWorkflow.name}"`);
            console.log(`   - ID: ${aiWorkflow.id}`);
            console.log(`   - Active: ${aiWorkflow.active}`);
            console.log(`   - Created: ${aiWorkflow.createdAt}`);
            
            // Test 3: Get workflow details
            console.log('\n3. Getting workflow details...');
            const workflowDetails = await axios.get(`http://localhost:5678/rest/workflows/${aiWorkflow.id}`, {
                auth: n8nAuth
            });
            
            const nodes = workflowDetails.data.nodes;
            console.log(`📊 Workflow has ${nodes.length} nodes:`);
            
            // Check for our key nodes
            const keyNodes = ['Task Monitor', 'Get Kanboard Tasks', 'Split Tasks', 'Filter Due Diligence Tasks'];
            keyNodes.forEach(nodeName => {
                const node = nodes.find(n => n.name === nodeName);
                console.log(`   - ${nodeName}: ${node ? '✅ Found' : '❌ Missing'}`);
            });
            
            // Test 4: Check workflow executions
            console.log('\n4. Checking recent workflow executions...');
            try {
                const executions = await axios.get(`http://localhost:5678/rest/executions?workflowId=${aiWorkflow.id}&limit=5`, {
                    auth: n8nAuth
                });
                
                console.log(`📈 Recent executions: ${executions.data.data.length}`);
                
                if (executions.data.data.length > 0) {
                    const lastExecution = executions.data.data[0];
                    console.log(`   Last execution:`);
                    console.log(`   - ID: ${lastExecution.id}`);
                    console.log(`   - Status: ${lastExecution.finished ? '✅ Finished' : '🔄 Running'}`);
                    console.log(`   - Mode: ${lastExecution.mode}`);
                    console.log(`   - Started: ${lastExecution.startedAt}`);
                    
                    // Get execution details
                    const execDetails = await axios.get(`http://localhost:5678/rest/executions/${lastExecution.id}`, {
                        auth: n8nAuth
                    });
                    
                    console.log(`\n   Execution data analysis:`);
                    const execData = execDetails.data.data;
                    
                    if (execData && execData.resultData) {
                        const runData = execData.resultData.runData;
                        Object.keys(runData).forEach(nodeName => {
                            const nodeData = runData[nodeName];
                            if (nodeData && nodeData[0]) {
                                const data = nodeData[0].data;
                                console.log(`   - ${nodeName}: ${data && data.main && data.main[0] ? data.main[0].length : 0} items`);
                            }
                        });
                    }
                }
            } catch (execError) {
                console.log(`⚠️  Could not get executions: ${execError.message}`);
            }
            
            // Test 5: Try to trigger workflow manually
            console.log('\n5. Attempting manual workflow trigger...');
            try {
                const triggerResult = await axios.post(`http://localhost:5678/rest/workflows/${aiWorkflow.id}/activate`, {}, {
                    auth: n8nAuth
                });
                console.log(`✅ Workflow activation status: ${triggerResult.status}`);
            } catch (triggerError) {
                console.log(`⚠️  Trigger error: ${triggerError.message}`);
            }
            
        } else {
            console.log('❌ AI Due Diligence workflow not found in n8n');
            console.log('   Available workflows:');
            healthCheck.data.forEach(wf => {
                console.log(`   - "${wf.name}" (ID: ${wf.id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testN8nWorkflow();
