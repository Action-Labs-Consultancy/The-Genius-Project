const axios = require('axios');

async function testDueDiligenceFilter() {
    console.log('🔍 TESTING DUE DILIGENCE FILTER LOGIC');
    console.log('=====================================\n');
    
    try {
        // Get tasks from Kanboard
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
        console.log(`📋 Total tasks: ${tasks.length}\n`);

        // Test each task against the filter
        console.log('🧪 Testing filter conditions:\n');
        
        tasks.forEach((task, index) => {
            const titleLower = task.title.toLowerCase();
            const filterText = "due diligence:";
            const matches = titleLower.startsWith(filterText);
            
            console.log(`Task ${index + 1}:`);
            console.log(`  ID: ${task.id}`);
            console.log(`  Title: "${task.title}"`);
            console.log(`  Title (lower): "${titleLower}"`);
            console.log(`  Filter text: "${filterText}"`);
            console.log(`  Starts with: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
            console.log('');
        });

        // Count matches
        const matchingTasks = tasks.filter(task => 
            task.title.toLowerCase().startsWith("due diligence:")
        );
        
        console.log(`🎯 Summary: ${matchingTasks.length} tasks match the filter`);
        console.log('\nMatching tasks:');
        matchingTasks.forEach(task => {
            console.log(`  - ID ${task.id}: "${task.title}"`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDueDiligenceFilter();
