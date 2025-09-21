// Diagnostic script to understand the content mapping issues
const fs = require('fs');

const workflow = JSON.parse(fs.readFileSync('REader_FINAL_MCA.json', 'utf8'));

console.log('🔍 ANALYZING CONTENT GENERATION AND STORAGE WORKFLOW\n');

// Find all postgres nodes that perform upserts
const upsertNodes = workflow.nodes.filter(node => 
  node.type === 'n8n-nodes-base.postgres' && 
  node.parameters?.operation === 'upsert'
);

console.log(`Found ${upsertNodes.length} upsert nodes:\n`);

upsertNodes.forEach((node, index) => {
  console.log(`${index + 1}. Node: "${node.name}"`);
  console.log(`   Table: ${node.parameters.table}`);
  
  if (node.parameters.columns?.value) {
    const columns = Object.keys(node.parameters.columns.value);
    console.log(`   Columns being set: ${columns.join(', ')}`);
    
    // Check for specific section fields
    const sectionFields = columns.filter(col => 
      col.includes('introduction_engagement_context') ||
      col.includes('methodology_reliability_levels') || 
      col.includes('company_overview') ||
      col.includes('business_model_unit_economics') ||
      col.includes('products_technology')
    );
    
    if (sectionFields.length > 0) {
      console.log(`   ⚠️  Section fields: ${sectionFields.join(', ')}`);
      sectionFields.forEach(field => {
        const value = node.parameters.columns.value[field];
        console.log(`      ${field}: ${value}`);
      });
    }
  }
  console.log('');
});

// Find AI generation nodes
console.log('\n🤖 AI CONTENT GENERATION NODES:\n');

const aiNodes = workflow.nodes.filter(node => 
  node.type === 'n8n-nodes-base.httpRequest' &&
  node.parameters?.url?.includes('11434/api/generate')
);

aiNodes.forEach((node, index) => {
  console.log(`${index + 1}. Node: "${node.name}"`);
  if (node.parameters?.jsonBody?.prompt) {
    const prompt = node.parameters.jsonBody.prompt;
    if (typeof prompt === 'string' && prompt.includes('section')) {
      // Extract section type from prompt
      if (prompt.includes('Introduction & Engagement Context')) {
        console.log('   → Generates: Section 1 (Introduction & Engagement Context)');
      } else if (prompt.includes('Methodology & Reliability')) {
        console.log('   → Generates: Section 2 (Methodology & Reliability Levels)');
      } else if (prompt.includes('Company Overview')) {
        console.log('   → Generates: Section 3 (Company Overview & Business Profile)');
      } else {
        console.log('   → Generates: Unknown section type');
      }
    }
  }
  console.log('');
});

console.log('\n🔄 RECOMMENDATIONS:\n');
console.log('1. Check that each AI generation node saves to the correct database field');
console.log('2. Ensure Section 1 content saves to: introduction_engagement_context');
console.log('3. Ensure Section 2 content saves to: methodology_reliability_levels');
console.log('4. Ensure Section 3 content saves to: company_overview');
console.log('5. Fix the PDF generation logic to read from the correct fields');
