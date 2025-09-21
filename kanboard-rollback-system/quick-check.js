#!/usr/bin/env node

/**
 * 🏢 ENTERPRISE ENDPOINT VALIDATION
 * Quick check of server functionality
 */

const http = require('http');

console.log('🔍 Quick Enterprise System Check');
console.log('================================');

async function checkEndpoint(path, description) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET',
            timeout: 3000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ ${description}: OK (${res.statusCode})`);
            resolve(true);
        });

        req.on('error', (error) => {
            console.log(`❌ ${description}: FAILED (${error.code})`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`⏰ ${description}: TIMEOUT`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

async function quickCheck() {
    const results = await Promise.all([
        checkEndpoint('/health', 'Health Check'),
        checkEndpoint('/', 'Dashboard'),
        checkEndpoint('/api/system/backups', 'Backup API')
    ]);
    
    const passed = results.filter(r => r).length;
    console.log('================================');
    console.log(`Results: ${passed}/3 endpoints working`);
    
    if (passed === 3) {
        console.log('🎉 System is fully operational!');
    }
}

quickCheck().catch(console.error);
