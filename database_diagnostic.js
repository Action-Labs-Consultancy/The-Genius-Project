// Database Diagnostic Script
// This will help us understand what's happening with the database

const { Client } = require('pg');

async function diagnoseDatabaseIssues() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'n8n_db',
        user: 'n8n_user',
        password: 'n8n_secure_password_2024'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // 1. Check if the complete_dd_reports table exists and its structure
        console.log('\n=== TABLE STRUCTURE CHECK ===');
        const tableStructure = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'complete_dd_reports' 
            ORDER BY ordinal_position;
        `);
        
        if (tableStructure.rows.length === 0) {
            console.log('❌ complete_dd_reports table does not exist!');
            return;
        }
        
        console.log('Table columns:');
        tableStructure.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // 2. Check what data exists in the table
        console.log('\n=== DATA CHECK ===');
        const dataCheck = await client.query(`
            SELECT 
                company_id,
                company_name,
                CASE WHEN introduction_engagement_context IS NOT NULL THEN LENGTH(introduction_engagement_context) ELSE 0 END as section1_length,
                CASE WHEN legal_disclaimers_reliance_limitations IS NOT NULL THEN LENGTH(legal_disclaimers_reliance_limitations) ELSE 0 END as section2_length,
                CASE WHEN methodology_source_validation IS NOT NULL THEN LENGTH(methodology_source_validation) ELSE 0 END as section3_length,
                CASE WHEN financial_trajectory_revenue_quality IS NOT NULL THEN LENGTH(financial_trajectory_revenue_quality) ELSE 0 END as section4_length,
                CASE WHEN partnerships_ecosystem_alliances IS NOT NULL THEN LENGTH(partnerships_ecosystem_alliances) ELSE 0 END as section5_length,
                CASE WHEN intellectual_property_technology IS NOT NULL THEN LENGTH(intellectual_property_technology) ELSE 0 END as section6_length,
                CASE WHEN governance_disclosures_risks IS NOT NULL THEN LENGTH(governance_disclosures_risks) ELSE 0 END as section7_length,
                CASE WHEN appendix_management_rfi IS NOT NULL THEN LENGTH(appendix_management_rfi) ELSE 0 END as section8_length,
                sections_completed,
                status,
                created_at,
                updated_at
            FROM complete_dd_reports 
            ORDER BY created_at DESC;
        `);

        if (dataCheck.rows.length === 0) {
            console.log('❌ No data found in complete_dd_reports table!');
        } else {
            console.log(`Found ${dataCheck.rows.length} record(s):`);
            dataCheck.rows.forEach((row, index) => {
                console.log(`\nRecord ${index + 1}:`);
                console.log(`  Company: ${row.company_name}`);
                console.log(`  Company ID: ${row.company_id}`);
                console.log(`  Section 1 length: ${row.section1_length}`);
                console.log(`  Section 2 length: ${row.section2_length}`);
                console.log(`  Section 3 length: ${row.section3_length}`);
                console.log(`  Section 4 length: ${row.section4_length}`);
                console.log(`  Section 5 length: ${row.section5_length}`);
                console.log(`  Section 6 length: ${row.section6_length}`);
                console.log(`  Section 7 length: ${row.section7_length}`);
                console.log(`  Section 8 length: ${row.section8_length}`);
                console.log(`  Sections completed: ${row.sections_completed}`);
                console.log(`  Status: ${row.status}`);
                console.log(`  Created: ${row.created_at}`);
                console.log(`  Updated: ${row.updated_at}`);
            });
        }

        // 3. Check for any data in the old due_diligence_reports table
        console.log('\n=== OLD TABLE CHECK ===');
        try {
            const oldTableCheck = await client.query(`
                SELECT COUNT(*) as count FROM due_diligence_reports;
            `);
            console.log(`Old due_diligence_reports table has ${oldTableCheck.rows[0].count} records`);
        } catch (err) {
            console.log('Old due_diligence_reports table does not exist (this is normal)');
        }

        // 4. Check company_data table
        console.log('\n=== COMPANY DATA CHECK ===');
        const companyDataCheck = await client.query(`
            SELECT 
                company_id,
                company_name,
                LENGTH(content) as content_length,
                processed_at
            FROM company_data 
            ORDER BY processed_at DESC 
            LIMIT 5;
        `);

        if (companyDataCheck.rows.length === 0) {
            console.log('❌ No company data found!');
        } else {
            console.log(`Found ${companyDataCheck.rows.length} company data record(s):`);
            companyDataCheck.rows.forEach((row, index) => {
                console.log(`  ${index + 1}. ${row.company_name} (${row.company_id}) - ${row.content_length} chars - ${row.processed_at}`);
            });
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
    }
}

// Run the diagnostic
diagnoseDatabaseIssues().catch(console.error);
