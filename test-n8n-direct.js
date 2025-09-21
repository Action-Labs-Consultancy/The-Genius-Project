const axios = require('axios');

async function testN8nDirectly() {
    console.log('🔍 TESTING N8N DIRECTLY');
    console.log('='.repeat(50));
    
    const n8nUrl = 'http://localhost:5678';
    
    try {
        // Test if n8n is reachable
        console.log('1. Testing n8n accessibility...');
        const testResponse = await axios.get(`${n8nUrl}/rest/login`, {
            timeout: 5000
        });
        console.log('✅ n8n is reachable');
        console.log('Response status:', testResponse.status);
        
        // Try to login
        console.log('\n2. Testing n8n login...');
        const loginResponse = await axios.post(`${n8nUrl}/rest/login`, {
            emailOrLdapLoginId: 'admin@example.com',
            password: 'GlassDoor2025!'
        }, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Login successful!');
        console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
        
        // Extract cookies
        const cookies = loginResponse.headers['set-cookie'];
        console.log('Cookies:', cookies);
        
        if (cookies) {
            const cookieHeader = cookies.join('; ');
            
            // Test workflows endpoint with auth
            console.log('\n3. Testing workflows endpoint...');
            const workflowsResponse = await axios.get(`${n8nUrl}/rest/workflows`, {
                headers: {
                    'Cookie': cookieHeader
                },
                timeout: 5000
            });
            
            console.log('✅ Workflows retrieved!');
            console.log('Workflows count:', workflowsResponse.data?.data?.length || 0);
            
            // Test credentials endpoint with auth
            console.log('\n4. Testing credentials endpoint...');
            const credentialsResponse = await axios.get(`${n8nUrl}/rest/credentials`, {
                headers: {
                    'Cookie': cookieHeader
                },
                timeout: 5000
            });
            
            console.log('✅ Credentials retrieved!');
            console.log('Credentials count:', credentialsResponse.data?.data?.length || 0);
        }
        
    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testN8nDirectly();
