// Test different database connections to find the right one
const { Client } = require('pg');

async function testConnections() {
    const connections = [
        { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: 'postgres' },
        { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: '' },
        { host: 'localhost', port: 5432, database: 'n8n', user: 'postgres', password: 'postgres' },
        { host: 'localhost', port: 5432, database: 'n8n_db', user: 'postgres', password: 'postgres' },
        { host: 'localhost', port: 5432, database: 'n8n_db', user: 'n8n_user', password: 'n8n_secure_password_2024' },
        { host: 'localhost', port: 5432, database: 'postgres', user: 'n8n_user', password: 'n8n_secure_password_2024' }
    ];

    for (let i = 0; i < connections.length; i++) {
        const config = connections[i];
        console.log(`\n🔍 Testing connection ${i + 1}: ${config.user}@${config.database}`);
        
        const client = new Client(config);
        
        try {
            await client.connect();
            console.log(`✅ SUCCESS: Connected to ${config.database} as ${config.user}`);
            
            // List databases
            const databases = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
            console.log('   📋 Available databases:', databases.rows.map(row => row.datname).join(', '));
            
            // Check for complete_dd_reports table
            const tableCheck = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'complete_dd_reports'
            `);
            
            if (tableCheck.rows.length > 0) {
                console.log('   🎯 FOUND complete_dd_reports table!');
                
                // Check table structure
                const columns = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'complete_dd_reports'
                    ORDER BY ordinal_position
                `);
                console.log('   📊 Table columns:', columns.rows.map(row => `${row.column_name} (${row.data_type})`).join(', '));
                
                // Check row count
                const count = await client.query('SELECT COUNT(*) FROM complete_dd_reports');
                console.log(`   🔢 Total rows: ${count.rows[0].count}`);
                
                await client.end();
                return config; // Return successful config
            } else {
                console.log('   ❌ complete_dd_reports table not found');
            }
            
            await client.end();
        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}`);
        }
    }
    
    return null;
}

testConnections().then(result => {
    if (result) {
        console.log(`\n🎉 Use this configuration for the main diagnostic:`, result);
    } else {
        console.log('\n😞 No working configuration found');
    }
}).catch(console.error);
