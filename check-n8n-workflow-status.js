const axios = require('axios');

async function checkN8nWorkflowStatus() {
    console.log('🔍 CHECKING N8N WORKFLOW STATUS');
    console.log('================================\n');
    
    const auth = Buffer.from('admin:GlassDoor2025!').toString('base64');
    const headers = {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Check workflows
        console.log('1. Checking existing workflows...');
        const workflowsResponse = await axios.get('http://localhost:5678/rest/workflows', { headers });
        
        console.log(`✅ n8n API accessible`);
        console.log(`📋 Total workflows: ${workflowsResponse.data.data?.length || 0}`);
        
        const workflows = workflowsResponse.data.data || [];
        
        if (workflows.length === 0) {
            console.log('❌ NO WORKFLOWS FOUND - This is the issue!');
            console.log('   The workflow needs to be imported into n8n\n');
            return;
        }
        
        // Look for our Due Diligence workflow
        const ddWorkflow = workflows.find(w => 
            w.name?.includes('Due Diligence') || 
            w.name?.includes('AI Due Diligence') ||
            w.name?.includes('MCA Pipeline')
        );
        
        if (ddWorkflow) {
            console.log(`✅ Due Diligence workflow found!`);
            console.log(`   ID: ${ddWorkflow.id}`);
            console.log(`   Name: "${ddWorkflow.name}"`);
            console.log(`   Active: ${ddWorkflow.active ? '✅ YES' : '❌ NO'}`);
            console.log(`   Created: ${ddWorkflow.createdAt}`);
            console.log(`   Updated: ${ddWorkflow.updatedAt}\n`);
            
            if (!ddWorkflow.active) {
                console.log('❌ ISSUE FOUND: Workflow exists but is NOT ACTIVE');
                console.log('   Solution: Activate the workflow in n8n interface\n');
            }
            
        } else {
            console.log('❌ ISSUE FOUND: Due Diligence workflow NOT FOUND');
            console.log('   Available workflows:');
            workflows.forEach((w, i) => {
                console.log(`   ${i + 1}. ID: ${w.id}, Name: "${w.name}", Active: ${w.active}`);
            });
            console.log('\n   Solution: Import AI_Due_Diligence_Workflow_Fixed.json\n');
        }
        
        // Check credentials
        console.log('2. Checking credentials...');
        try {
            const credentialsResponse = await axios.get('http://localhost:5678/rest/credentials', { headers });
            const credentials = credentialsResponse.data.data || [];
            
            console.log(`📋 Total credentials: ${credentials.length}`);
            
            const kanboardCred = credentials.find(c => 
                c.name === 'kanboard_auth' || 
                c.name?.includes('kanboard')
            );
            
            if (kanboardCred) {
                console.log(`✅ Kanboard credential found: "${kanboardCred.name}"`);
            } else {
                console.log('❌ ISSUE FOUND: kanboard_auth credential NOT FOUND');
                console.log('   Available credentials:');
                credentials.forEach((c, i) => {
                    console.log(`   ${i + 1}. Name: "${c.name}", Type: ${c.type}`);
                });
                console.log('\n   Solution: Create kanboard_auth credential (HTTP Basic Auth: admin/admin)\n');
            }
        } catch (credError) {
            console.log(`⚠️  Could not check credentials: ${credError.message}`);
        }
        
        // Test manual workflow execution if workflow exists and is active
        if (ddWorkflow && ddWorkflow.active) {
            console.log('3. Testing manual workflow execution...');
            try {
                const executeResponse = await axios.post(
                    `http://localhost:5678/rest/workflows/${ddWorkflow.id}/execute`,
                    { data: {} },
                    { headers }
                );
                
                console.log(`✅ Manual execution started`);
                console.log(`   Execution ID: ${executeResponse.data.data?.executionId}`);
                console.log('   Check n8n interface for execution status');
                
            } catch (execError) {
                console.log(`❌ Execution failed: ${execError.response?.data?.message || execError.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking n8n:', error.response?.data || error.message);
    }
}

checkN8nWorkflowStatus();
