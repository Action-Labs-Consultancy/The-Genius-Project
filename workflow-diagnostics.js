const fs = require('fs');

try {
    const workflow = JSON.parse(fs.readFileSync('DD_Section_01_SIMPLE_WORKING.json', 'utf8'));
    
    console.log('🔍 N8N Workflow Diagnostics\n');
    
    // Basic structure
    console.log('📊 Basic Structure:');
    console.log(`✅ Nodes: ${workflow.nodes.length}`);
    console.log(`✅ Connections: ${workflow.connections ? Object.keys(workflow.connections).length : 0}`);
    console.log(`✅ Name: ${workflow.name || 'Unnamed'}\n`);
    
    // Check for missing required fields
    console.log('🔧 Node Analysis:');
    let issuesFound = 0;
    
    workflow.nodes.forEach((node, index) => {
        const issues = [];
        
        // Check required fields
        if (!node.id) issues.push('Missing ID');
        if (!node.name) issues.push('Missing name');
        if (!node.type) issues.push('Missing type');
        if (!node.position || !Array.isArray(node.position)) issues.push('Invalid position');
        
        // Check for empty parameters that might cause issues
        if (node.parameters) {
            // Check for empty credential references
            if (node.credentials) {
                Object.keys(node.credentials).forEach(credType => {
                    const cred = node.credentials[credType];
                    if (!cred.id || cred.id === '') {
                        issues.push(`Empty credential ID for ${credType}`);
                    }
                });
            }
            
            // Check Google Sheets specific issues
            if (node.type === 'n8n-nodes-base.googleSheets') {
                if (node.parameters.operation === 'create') {
                    if (!node.parameters.title) {
                        issues.push('Google Sheets: Missing title');
                    }
                }
                if (node.parameters.operation === 'appendOrUpdate') {
                    if (!node.parameters.documentId) {
                        issues.push('Google Sheets: Missing documentId');
                    }
                    if (!node.parameters.sheetName) {
                        issues.push('Google Sheets: Missing sheetName');
                    }
                }
            }
            
            // Check PostgreSQL issues
            if (node.type === 'n8n-nodes-base.postgres') {
                if (!node.parameters.query && !node.parameters.operation) {
                    issues.push('PostgreSQL: Missing query or operation');
                }
            }
            
            // Check Function node issues
            if (node.type === 'n8n-nodes-base.function') {
                if (!node.parameters.functionCode) {
                    issues.push('Function: Missing functionCode');
                }
            }
        }
        
        if (issues.length > 0) {
            console.log(`❌ Node ${index + 1}: "${node.name}" (${node.type})`);
            issues.forEach(issue => console.log(`   - ${issue}`));
            issuesFound += issues.length;
        }
    });
    
    if (issuesFound === 0) {
        console.log('✅ All nodes appear to be properly configured\n');
    } else {
        console.log(`\n⚠️  Found ${issuesFound} potential issues\n`);
    }
    
    // Check connections
    console.log('🔗 Connection Analysis:');
    if (workflow.connections) {
        let connectionIssues = 0;
        
        Object.keys(workflow.connections).forEach(nodeId => {
            const nodeConnections = workflow.connections[nodeId];
            
            Object.keys(nodeConnections).forEach(outputType => {
                const outputs = nodeConnections[outputType];
                
                outputs.forEach((connections, outputIndex) => {
                    connections.forEach(connection => {
                        // Check if target node exists
                        const targetNode = workflow.nodes.find(n => n.id === connection.node);
                        if (!targetNode) {
                            console.log(`❌ Connection to non-existent node: ${connection.node}`);
                            connectionIssues++;
                        }
                    });
                });
            });
        });
        
        if (connectionIssues === 0) {
            console.log('✅ All connections appear valid');
        } else {
            console.log(`❌ Found ${connectionIssues} connection issues`);
        }
    }
    
    console.log('\n🎯 Summary:');
    if (issuesFound === 0) {
        console.log('✅ Workflow appears to be properly configured for execution');
        console.log('💡 If you\'re still experiencing issues, check:');
        console.log('   - Credential configurations in n8n');
        console.log('   - Database connectivity');
        console.log('   - Google API permissions');
        console.log('   - Node version compatibility');
    } else {
        console.log('❌ Workflow has configuration issues that need to be resolved');
        console.log('🔧 Fix the issues listed above before attempting execution');
    }
    
} catch (error) {
    console.log('❌ Error analyzing workflow:', error.message);
}
