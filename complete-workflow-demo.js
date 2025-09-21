const axios = require('axios');

console.log('🎯 TAIGA + N8N INTEGRATION DEMO');
console.log('================================');
console.log('This script demonstrates the complete workflow integration');
console.log('');

async function fullWorkflowDemo() {
    try {
        // PART 1: Set up Taiga project and task
        console.log('📋 PART 1: TAIGA PROJECT SETUP');
        console.log('------------------------------');
        
        console.log('🔐 Authenticating with Taiga...');
        const authResponse = await axios.post('http://localhost:9000/api/v1/auth', {
            type: 'normal',
            username: 'admin',
            password: 'admin123'
        });
        
        const token = authResponse.data.auth_token;
        console.log('✅ Authenticated with Taiga');
        console.log(`   Token: ${token.substring(0, 30)}...`);
        
        console.log('\\n📊 Creating demonstration project...');
        const projectResponse = await axios.post('http://localhost:9000/api/v1/projects', {
            name: 'AI Due Diligence Research Demo',
            description: 'Demonstration of automated research workflow integration between Taiga PM and n8n',
            creation_template: 1,
            is_private: false
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const project = projectResponse.data;
        console.log('✅ Demo project created');
        console.log(`   Project ID: ${project.id}`);
        console.log(`   Project Name: ${project.name}`);
        console.log(`   URL: http://localhost:9000/project/${project.slug}`);
        
        // PART 2: Create research tasks
        console.log('\\n📝 PART 2: CREATING RESEARCH TASKS');
        console.log('----------------------------------');
        
        const companies = ['Tesla Inc.', 'Apple Inc.', 'Microsoft Corporation'];
        const tasks = [];
        
        for (const company of companies) {
            console.log(`\\n📋 Creating research task for ${company}...`);
            
            const taskResponse = await axios.post('http://localhost:9000/api/v1/tasks', {
                project: project.id,
                subject: `Research on ${company}`,
                description: `Comprehensive due diligence research task for ${company}. This task will be automatically processed by the n8n workflow to generate detailed research reports.`,
                status: project.task_statuses[0].id,
                milestone: null,
                assigned_to: null
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const task = taskResponse.data;
            tasks.push(task);
            
            console.log(`✅ Task created for ${company}`);
            console.log(`   Task ID: ${task.id}`);
            console.log(`   Subject: ${task.subject}`);
            console.log(`   Status: ${task.status_extra_info.name}`);
        }
        
        // PART 3: Simulate webhook calls
        console.log('\\n🔄 PART 3: WEBHOOK SIMULATION');
        console.log('-----------------------------');
        console.log('NOTE: This simulates what Taiga would send to n8n when tasks are created');
        
        for (const task of tasks) {
            console.log(`\\n📤 Simulating webhook for: ${task.subject}`);
            
            const webhookPayload = {
                action: 'create',
                type: 'task',
                subject: task.subject,
                id: task.id,
                version: task.version,
                description: task.description,
                project: {
                    id: project.id,
                    name: project.name
                },
                user: {
                    id: 1,
                    username: 'admin'
                },
                created_date: new Date().toISOString()
            };
            
            console.log('   Webhook payload generated:');
            console.log(`   - Action: ${webhookPayload.action}`);
            console.log(`   - Type: ${webhookPayload.type}`);
            console.log(`   - Subject: ${webhookPayload.subject}`);
            console.log(`   - Task ID: ${webhookPayload.id}`);
            
            // Try to call the n8n webhook
            try {
                const webhookResponse = await axios.post('http://localhost:5678/webhook/taiga-webhook', webhookPayload, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                
                console.log('✅ n8n webhook executed successfully!');
                console.log(`   Status: ${webhookResponse.status}`);
                console.log('   Response data:');
                console.log(JSON.stringify(webhookResponse.data, null, 4));
                
                // Wait a moment for processing
                console.log('   ⏳ Waiting for workflow processing...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if task was updated
                const updatedTaskResponse = await axios.get(`http://localhost:9000/api/v1/tasks/${task.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const updatedTask = updatedTaskResponse.data;
                if (updatedTask.description !== task.description) {
                    console.log('✅ Task updated with research results!');
                    console.log(`   Original description length: ${task.description.length} chars`);
                    console.log(`   Updated description length: ${updatedTask.description.length} chars`);
                    console.log('   First 200 characters of updated description:');
                    console.log(`   "${updatedTask.description.substring(0, 200)}..."`);
                } else {
                    console.log('⏳ Task not yet updated (workflow may need time or manual activation)');
                }
                
            } catch (webhookError) {
                console.log('❌ n8n webhook call failed');
                console.log(`   Error: ${webhookError.message}`);
                if (webhookError.response) {
                    console.log(`   Status: ${webhookError.response.status}`);
                    console.log(`   Response: ${JSON.stringify(webhookError.response.data, null, 2)}`);
                }
                console.log('   💡 This is expected if the workflow is not activated yet');
            }
        }
        
        // PART 4: Results summary
        console.log('\\n📊 PART 4: RESULTS SUMMARY');
        console.log('----------------------------');
        
        console.log('✅ Taiga setup completed successfully:');
        console.log(`   - Project created: "${project.name}" (ID: ${project.id})`);
        console.log(`   - ${tasks.length} research tasks created`);
        console.log(`   - All tasks follow the pattern: "Research on [Company Name]"`);
        
        console.log('\\n🔧 To complete the integration:');
        console.log('1. 🌐 Go to http://localhost:5678');
        console.log('2. 🔍 Find "Taiga Due Diligence Research Automation" workflow');
        console.log('3. ✏️  Edit the "Auth" node:');
        console.log('   - Change "yourusername" to "admin"');
        console.log('   - Change "yourpassword" to "admin123"');
        console.log('4. ▶️  Click "Activate" to turn on the workflow');
        console.log('5. 🧪 Create a new task with subject "Research on [Any Company]"');
        
        console.log('\\n🎯 Expected results after activation:');
        console.log('- Task descriptions will be automatically updated');
        console.log('- 20 research sections will be generated');
        console.log('- Completion rates and evidence tracking included');
        console.log('- Full due diligence reports appended to tasks');
        
        console.log('\\n🔗 Useful URLs:');
        console.log(`- Taiga project: http://localhost:9000/project/${project.slug}`);
        console.log('- n8n workflows: http://localhost:5678/workflows');
        console.log('- n8n executions: http://localhost:5678/executions');
        
        return { project, tasks, token };
        
    } catch (error) {
        console.log('\\n❌ Demo failed:');
        console.log(`Error: ${error.message}`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

// Run the demo
fullWorkflowDemo().then(() => {
    console.log('\\n🎉 Demo completed! Check the URLs above to see the results.');
}).catch(console.error);
