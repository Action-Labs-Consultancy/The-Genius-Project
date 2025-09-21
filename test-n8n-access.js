const axios = require('axios');

async function testN8nAccess() {
    console.log('🔍 TESTING N8N ACCESS METHODS');
    console.log('==============================\n');
    
    const testUrls = [
        { name: 'No Auth', headers: {} },
        { name: 'Basic Auth (admin:GlassDoor2025!)', headers: { 'Authorization': `Basic ${Buffer.from('admin:GlassDoor2025!').toString('base64')}` } },
        { name: 'Basic Auth (admin:admin)', headers: { 'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}` } }
    ];
    
    for (const test of testUrls) {
        console.log(`Testing: ${test.name}`);
        try {
            const response = await axios.get('http://localhost:5678/rest/workflows', { 
                headers: test.headers,
                timeout: 5000
            });
            
            console.log(`✅ SUCCESS - Status: ${response.status}`);
            console.log(`📋 Workflows found: ${response.data.data?.length || 0}`);
            
            if (response.data.data?.length > 0) {
                console.log('   Workflows:');
                response.data.data.forEach((w, i) => {
                    console.log(`   ${i + 1}. "${w.name}" (ID: ${w.id}, Active: ${w.active})`);
                });
            }
            
            // If successful, also check credentials
            try {
                const credResponse = await axios.get('http://localhost:5678/rest/credentials', { 
                    headers: test.headers,
                    timeout: 5000 
                });
                console.log(`📋 Credentials found: ${credResponse.data.data?.length || 0}`);
                
                if (credResponse.data.data?.length > 0) {
                    console.log('   Credentials:');
                    credResponse.data.data.forEach((c, i) => {
                        console.log(`   ${i + 1}. "${c.name}" (Type: ${c.type})`);
                    });
                }
            } catch (credError) {
                console.log(`   Could not check credentials: ${credError.response?.status || credError.message}`);
            }
            
            console.log('');
            break; // Stop testing if we found working auth
            
        } catch (error) {
            console.log(`❌ FAILED - ${error.response?.status || error.message}`);
            console.log('');
        }
    }
    
    // Test the main page to see if n8n is properly configured
    console.log('Testing main n8n page...');
    try {
        const mainResponse = await axios.get('http://localhost:5678', { timeout: 5000 });
        console.log(`✅ Main page accessible - Status: ${mainResponse.status}`);
        
        // Check if it's the setup page or main interface
        const content = mainResponse.data;
        if (content.includes('setup') || content.includes('Setup')) {
            console.log('⚠️  n8n appears to be in setup mode - needs initial configuration');
        } else if (content.includes('workflow') || content.includes('Workflow')) {
            console.log('✅ n8n appears to be properly configured');
        }
        
    } catch (mainError) {
        console.log(`❌ Main page error: ${mainError.message}`);
    }
}

testN8nAccess();
