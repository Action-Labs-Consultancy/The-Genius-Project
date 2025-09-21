const axios = require('axios');

async function testN8nAuth() {
    const n8nUrl = 'http://localhost:5679';
    
    console.log('Testing n8n authentication methods...');
    
    // Test 1: Direct API access
    try {
        console.log('\n1. Testing direct API access...');
        const response = await axios.get(`${n8nUrl}/rest/workflows`);
        console.log('✅ Direct access worked:', response.status);
        console.log('Response:', response.data);
        return;
    } catch (error) {
        console.log('❌ Direct access failed:', error.response?.status, error.response?.statusText);
    }
    
    // Test 2: Basic auth
    try {
        console.log('\n2. Testing basic auth...');
        const response = await axios.get(`${n8nUrl}/rest/workflows`, {
            auth: {
                username: 'admin',
                password: 'GlassDoor2025!'
            }
        });
        console.log('✅ Basic auth worked:', response.status);
        console.log('Response:', response.data);
        return;
    } catch (error) {
        console.log('❌ Basic auth failed:', error.response?.status, error.response?.statusText);
        console.log('Response data:', error.response?.data);
    }
    
    // Test 3: Login endpoint
    try {
        console.log('\n3. Testing login endpoint...');
        const loginResponse = await axios.post(`${n8nUrl}/rest/login`, {
            emailOrLdapLoginId: 'admin@example.com',
            password: 'GlassDoor2025!'
        }, {
            withCredentials: true
        });
        console.log('✅ Login successful:', loginResponse.status);
        console.log('Login response:', loginResponse.data);
        console.log('Set-Cookie headers:', loginResponse.headers['set-cookie']);
        
        // Now try with cookies
        const cookies = loginResponse.headers['set-cookie'];
        if (cookies) {
            const cookieHeader = cookies.join('; ');
            const apiResponse = await axios.get(`${n8nUrl}/rest/workflows`, {
                headers: {
                    'Cookie': cookieHeader
                }
            });
            console.log('✅ Cookie-based access worked:', apiResponse.status);
            console.log('Workflows:', apiResponse.data);
        }
    } catch (error) {
        console.log('❌ Login failed:', error.response?.status, error.response?.statusText);
        console.log('Response data:', error.response?.data);
    }
    
    // Test 4: Check if it's a browser-based auth
    try {
        console.log('\n4. Testing browser endpoint...');
        const response = await axios.get(`${n8nUrl}/`, {
            maxRedirects: 0,
            validateStatus: () => true
        });
        console.log('Browser endpoint status:', response.status);
        console.log('Headers:', response.headers);
    } catch (error) {
        console.log('❌ Browser test failed:', error.message);
    }
}

testN8nAuth().catch(console.error);
