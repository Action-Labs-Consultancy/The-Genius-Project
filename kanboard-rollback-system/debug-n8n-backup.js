const axios = require('axios');

async function debugN8nBackup() {
    const n8nUrl = 'http://localhost:5678';
    
    console.log('🔍 Debugging n8n Backup Process');
    console.log('='.repeat(40));
    
    try {
        // Step 1: Test authentication
        console.log('\n1. Testing n8n authentication...');
        const loginResponse = await axios.post(`${n8nUrl}/rest/login`, {
            emailOrLdapLoginId: 'admin@example.com',
            password: 'GlassDoor2025!'
        });
        
        if (loginResponse.status === 200) {
            console.log('✅ Login successful');
            const cookies = loginResponse.headers['set-cookie'];
            const cookieHeader = cookies ? cookies.join('; ') : '';
            console.log('🍪 Got cookies:', cookieHeader ? 'Yes' : 'No');
            
            // Step 2: Test workflow retrieval
            console.log('\n2. Testing workflow retrieval...');
            const workflowsResponse = await axios.get(`${n8nUrl}/rest/workflows`, {
                headers: {
                    'Cookie': cookieHeader
                }
            });
            
            console.log('✅ Workflows retrieved:', workflowsResponse.status);
            console.log('📊 Workflow data structure:', {
                type: typeof workflowsResponse.data,
                hasData: !!workflowsResponse.data?.data,
                directArray: Array.isArray(workflowsResponse.data),
                keys: Object.keys(workflowsResponse.data || {})
            });
            
            if (workflowsResponse.data?.data) {
                console.log('📋 Workflows found:', workflowsResponse.data.data.length);
                workflowsResponse.data.data.forEach((wf, i) => {
                    console.log(`   ${i+1}. ${wf.name} (ID: ${wf.id})`);
                });
            } else if (Array.isArray(workflowsResponse.data)) {
                console.log('📋 Workflows found (direct array):', workflowsResponse.data.length);
                workflowsResponse.data.forEach((wf, i) => {
                    console.log(`   ${i+1}. ${wf.name} (ID: ${wf.id})`);
                });
            } else {
                console.log('📋 Raw response:', JSON.stringify(workflowsResponse.data, null, 2));
            }
            
            // Step 3: Test credentials retrieval
            console.log('\n3. Testing credentials retrieval...');
            const credentialsResponse = await axios.get(`${n8nUrl}/rest/credentials`, {
                headers: {
                    'Cookie': cookieHeader
                }
            });
            
            console.log('✅ Credentials retrieved:', credentialsResponse.status);
            console.log('🔑 Credentials data structure:', {
                type: typeof credentialsResponse.data,
                hasData: !!credentialsResponse.data?.data,
                directArray: Array.isArray(credentialsResponse.data),
                keys: Object.keys(credentialsResponse.data || {})
            });
            
            if (credentialsResponse.data?.data) {
                console.log('🔑 Credentials found:', credentialsResponse.data.data.length);
            } else if (Array.isArray(credentialsResponse.data)) {
                console.log('🔑 Credentials found (direct array):', credentialsResponse.data.length);
            }
            
            // Step 4: Test settings retrieval
            console.log('\n4. Testing settings retrieval...');
            try {
                const settingsResponse = await axios.get(`${n8nUrl}/rest/settings`, {
                    headers: {
                        'Cookie': cookieHeader
                    }
                });
                console.log('✅ Settings retrieved:', settingsResponse.status);
                console.log('⚙️ Settings keys:', Object.keys(settingsResponse.data || {}));
            } catch (settingsError) {
                console.log('⚠️ Settings endpoint failed:', settingsError.response?.status);
            }
            
        } else {
            console.log('❌ Login failed:', loginResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

debugN8nBackup().catch(console.error);
