const fs = require('fs');

try {
    const workflow = JSON.parse(fs.readFileSync('DD_Section_01_SIMPLE_WORKING.json', 'utf8'));
    
    console.log('🔧 Fixing broken connections...\n');
    
    // Create a map of node names to IDs
    const nodeMap = {};
    workflow.nodes.forEach(node => {
        nodeMap[node.name] = node.id;
    });
    
    console.log('📋 Available nodes:');
    Object.keys(nodeMap).sort().forEach(name => {
        console.log(`   "${name}" -> ${nodeMap[name]}`);
    });
    
    console.log('\n🔍 Checking connections...');
    
    let fixedConnections = 0;
    let brokenConnections = 0;
    
    if (workflow.connections) {
        Object.keys(workflow.connections).forEach(sourceNodeId => {
            const nodeConnections = workflow.connections[sourceNodeId];
            
            Object.keys(nodeConnections).forEach(outputType => {
                const outputs = nodeConnections[outputType];
                
                outputs.forEach((connections, outputIndex) => {
                    connections.forEach((connection, connectionIndex) => {
                        // Check if this connection points to a node name instead of ID
                        if (!workflow.nodes.find(n => n.id === connection.node)) {
                            // Try to find the node by name
                            const targetNodeId = nodeMap[connection.node];
                            if (targetNodeId) {
                                console.log(`✅ Fixed: "${connection.node}" -> ${targetNodeId}`);
                                workflow.connections[sourceNodeId][outputType][outputIndex][connectionIndex].node = targetNodeId;
                                fixedConnections++;
                            } else {
                                console.log(`❌ Cannot fix: "${connection.node}" (node not found)`);
                                brokenConnections++;
                            }
                        }
                    });
                });
            });
        });
    }
    
    console.log(`\n📊 Results:`);
    console.log(`✅ Fixed connections: ${fixedConnections}`);
    console.log(`❌ Still broken: ${brokenConnections}`);
    
    if (fixedConnections > 0) {
        // Save the fixed workflow
        const backupName = 'DD_Section_01_SIMPLE_WORKING_backup.json';
        fs.writeFileSync(backupName, fs.readFileSync('DD_Section_01_SIMPLE_WORKING.json', 'utf8'));
        console.log(`\n💾 Created backup: ${backupName}`);
        
        fs.writeFileSync('DD_Section_01_SIMPLE_WORKING.json', JSON.stringify(workflow, null, 2));
        console.log('✅ Fixed workflow saved!');
        
        console.log('\n🎯 Next steps:');
        console.log('1. Import the fixed workflow into n8n');
        console.log('2. Verify all connections are working');
        console.log('3. Test workflow execution');
    } else {
        console.log('\n💡 No fixes applied - connections may need manual review');
    }
    
} catch (error) {
    console.log('❌ Error fixing workflow:', error.message);
}
