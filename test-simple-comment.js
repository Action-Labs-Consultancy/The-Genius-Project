// Test simplified final comment posting
const http = require('http');

async function testSimpleComment() {
    console.log('🧪 Testing Simple Comment Post...\n');
    
    const auth = Buffer.from('admin:admin').toString('base64');
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/jsonrpc.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        }
    };
    
    // Simple short comment first
    const simpleComment = `🎉 MCA WORKFLOW COMPLETED\n\nCompany: mirriad\nSection: Business Model & Unit Economics\nCompleted: ${new Date().toISOString()}`;
    
    const body = JSON.stringify({
        jsonrpc: "2.0",
        method: "createComment", 
        id: 1,
        params: {
            task_id: 1,
            content: simpleComment
        }
    });
    
    console.log('📤 Posting simple comment...');
    console.log('Comment length:', simpleComment.length, 'characters');
    
    try {
        const response = await makeRequest(options, body);
        
        if (response.result) {
            console.log('✅ SUCCESS! Comment posted');
            console.log(`📝 Comment ID: ${response.result}`);
        } else {
            console.log('❌ FAILED:', JSON.stringify(response, null, 2));
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

testSimpleComment().catch(console.error);
