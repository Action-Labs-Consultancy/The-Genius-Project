const http = require('http');

async function testService(name, url, timeout = 5000) {
    return new Promise((resolve) => {
        const request = http.get(url, { timeout }, (res) => {
            console.log(`✅ ${name}: RUNNING (${res.statusCode})`);
            resolve(true);
        });
        
        request.on('error', (err) => {
            console.log(`❌ ${name}: DOWN (${err.message})`);
            resolve(false);
        });
        
        request.on('timeout', () => {
            console.log(`❌ ${name}: TIMEOUT`);
            request.destroy();
            resolve(false);
        });
    });
}

async function testPDFConverter() {
    return new Promise((resolve) => {
        const testData = JSON.stringify({
            content: '<h1>Test PDF</h1><p>This is a test document.</p>',
            type: 'html',
            filename: 'test.pdf'
        });
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/convert',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': testData.length
            },
            timeout: 10000
        };
        
        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ PDF Converter: TEST PASSED (PDF generated successfully)');
                resolve(true);
            } else {
                console.log(`❌ PDF Converter: TEST FAILED (Status: ${res.statusCode})`);
                resolve(false);
            }
        });
        
        req.on('error', (err) => {
            console.log(`❌ PDF Converter: TEST ERROR (${err.message})`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ PDF Converter: TEST TIMEOUT');
            req.destroy();
            resolve(false);
        });
        
        req.write(testData);
        req.end();
    });
}

async function runSystemCheck() {
    console.log('🧪 AI DUE DILIGENCE SYSTEM - COMPREHENSIVE TEST');
    console.log('===============================================');
    console.log('');
    
    console.log('1️⃣ Testing Basic Service Connectivity...');
    const n8nRunning = await testService('n8n', 'http://localhost:5678');
    const kanboardRunning = await testService('Kanboard', 'http://localhost:8000');
    const rollbackRunning = await testService('Rollback System', 'http://localhost:3001/api/health');
    const pdfRunning = await testService('PDF Converter', 'http://localhost:3000/health');
    const ollamaRunning = await testService('Ollama', 'http://localhost:11434/api/tags');
    
    console.log('');
    console.log('2️⃣ Testing PDF Conversion Functionality...');
    const pdfTest = await testPDFConverter();
    
    console.log('');
    console.log('===============================================');
    console.log('📊 SYSTEM STATUS SUMMARY');
    console.log('===============================================');
    
    const services = [
        { name: 'n8n Editor', status: n8nRunning, url: 'http://localhost:5678' },
        { name: 'Kanboard', status: kanboardRunning, url: 'http://localhost:8000' },
        { name: 'Rollback System', status: rollbackRunning, url: 'http://localhost:3001' },
        { name: 'PDF Converter', status: pdfRunning, url: 'http://localhost:3000' },
        { name: 'Ollama AI', status: ollamaRunning, url: 'http://localhost:11434' },
        { name: 'PDF Generation', status: pdfTest, url: 'Service Test' }
    ];
    
    const runningServices = services.filter(s => s.status).length;
    const totalServices = services.length;
    
    services.forEach(service => {
        const icon = service.status ? '✅' : '❌';
        const status = service.status ? 'RUNNING' : 'DOWN';
        console.log(`${icon} ${service.name}: ${status}`);
    });
    
    console.log('');
    console.log(`🎯 System Health: ${runningServices}/${totalServices} services operational`);
    
    if (runningServices === totalServices) {
        console.log('🚀 ALL SYSTEMS GO! AI Due Diligence workflow is ready!');
        console.log('');
        console.log('📋 Access Points:');
        console.log('   • n8n Workflow Editor: http://localhost:5678');
        console.log('   • Kanboard Project Management: http://localhost:8000');
        console.log('   • Rollback Dashboard: http://localhost:3001');
        console.log('');
        console.log('🎯 To use the AI Due Diligence workflow:');
        console.log('   1. Open Kanboard and create a task');
        console.log('   2. Upload PDF documents and add company details');
        console.log('   3. The n8n workflow will automatically process the files');
        console.log('   4. A complete due diligence report will be generated');
        console.log('');
    } else {
        console.log('⚠️  Some services are not running. Check the startup script.');
        console.log('💡 Run: start-all-services.bat to start all services');
    }
}

runSystemCheck().catch(console.error);
