const fs = require('fs');

// Read the workflow file
const workflowFile = 'REader_FINAL_MCA.json';
const workflow = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));

// Find the "Save ALL Data to Database" node
const saveNode = workflow.nodes.find(node => node.name === "Save ALL Data to Database");

if (!saveNode) {
  console.log('❌ ERROR: Could not find "Save ALL Data to Database" node');
  process.exit(1);
}

console.log('🔍 VALIDATING "Save ALL Data to Database" node configuration...\n');

// Check operation
if (saveNode.parameters.operation === 'upsert') {
  console.log('✅ Operation: upsert (CORRECT)');
} else {
  console.log(`❌ Operation: ${saveNode.parameters.operation || 'not set'} (INCORRECT - should be upsert)`);
}

// Check table
if (saveNode.parameters.table === 'company_data') {
  console.log('✅ Table: company_data (CORRECT)');
} else {
  console.log(`❌ Table: ${saveNode.parameters.table} (INCORRECT)`);
}

// Check matching columns
const matchingColumns = saveNode.parameters.columns?.matchingColumns;
if (matchingColumns && matchingColumns.includes('company_id')) {
  console.log('✅ Matching Columns: company_id (CORRECT)');
} else {
  console.log(`❌ Matching Columns: ${JSON.stringify(matchingColumns)} (INCORRECT - should include company_id)`);
}

// Check company_id mapping
const companyIdMapping = saveNode.parameters.columns?.value?.company_id;
if (companyIdMapping === '={{ $json.company_id }}') {
  console.log('✅ Company ID Mapping: {{ $json.company_id }} (CORRECT)');
} else {
  console.log(`❌ Company ID Mapping: ${companyIdMapping} (INCORRECT)`);
}

// Check schema configuration for company_id
const schema = saveNode.parameters.columns?.schema;
const companyIdSchema = schema?.find(field => field.id === 'company_id');
if (companyIdSchema && companyIdSchema.defaultMatch === true && companyIdSchema.removed === false) {
  console.log('✅ Company ID Schema: configured for matching (CORRECT)');
} else {
  console.log('❌ Company ID Schema: not properly configured for matching (INCORRECT)');
}

console.log('\n🎯 SUMMARY:');
if (saveNode.parameters.operation === 'upsert' && 
    matchingColumns?.includes('company_id') &&
    companyIdMapping === '={{ $json.company_id }}' &&
    companyIdSchema?.defaultMatch === true) {
  console.log('✅ ALL FIXES APPLIED CORRECTLY! The duplicate key error should be resolved.');
  console.log('💡 The node will now use UPSERT instead of INSERT, matching on company_id');
} else {
  console.log('❌ Some fixes are missing or incorrect. Please review the configuration.');
}
