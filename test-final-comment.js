// Direct test of final comment posting to Kanboard
const http = require('http');

async function testFinalComment() {
    console.log('🧪 Testing Final Comment Posting...\n');
    
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
    
    // Create a test comment exactly like the workflow would
    const finalComment = `🎉 **DUE DILIGENCE SECTION COMPLETED**

📄 **Company:** mirriad
📝 **Section:** Business Model & Unit Economics
**Generated:** ${new Date().toISOString()}
**Quality Score:** 8/10
**Website:** https://www.mirriadplc.com/

---

## Business Model & Unit Economics

### Value Proposition
Mirriad is a technology company that specializes in native advertising solutions for premium video content...

### Revenue Streams
- Technology licensing fees
- Platform subscription fees
- Performance-based revenue sharing

### Key Metrics
- Insufficient evidence in KB for specific unit economics
- Revenue growth trending positive based on public filings

---

## Quality Assurance

**Checker Validation:** ✅ Approved (Score: 8/10)
**Approver Review:** ✅ Approved
**Knowledge Base Sources:** 5 chunks
**FinBERT Analysis:** ✅ Available
**Website Data:** ✅ Available

⏰ **Completed:** ${new Date().toISOString()}`;

    const body = JSON.stringify({
        jsonrpc: "2.0",
        method: "createComment",
        id: 1,
        params: {
            task_id: 1,
            content: finalComment
        }
    });
    
    try {
        console.log('📤 Posting final comment to task ID 1...');
        const response = await makeRequest(options, body);
        
        if (response.result) {
            console.log('✅ SUCCESS! Final comment posted');
            console.log(`📝 Comment ID: ${response.result}`);
            
            // Now verify it shows up
            console.log('\n🔍 Verifying comment appears...');
            const checkBody = JSON.stringify({
                jsonrpc: "2.0",
                method: "getAllComments",
                id: 1,
                params: { task_id: 1 }
            });
            
            const checkResponse = await makeRequest(options, checkBody);
            console.log(`💬 Total comments found: ${checkResponse.result.length}`);
            
            const finalCommentFound = checkResponse.result.find(c => 
                c.comment.includes('DUE DILIGENCE SECTION COMPLETED')
            );
            
            if (finalCommentFound) {
                console.log('🎉 FINAL COMMENT FOUND IN KANBOARD!');
                console.log(`📅 Posted at: ${new Date(finalCommentFound.date_creation * 1000).toLocaleString()}`);
            } else {
                console.log('❌ Final comment NOT found in Kanboard');
            }
            
        } else if (response.error) {
            console.log('❌ FAILED to post comment');
            console.log(`Error: ${JSON.stringify(response.error, null, 2)}`);
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

testFinalComment().catch(console.error);
