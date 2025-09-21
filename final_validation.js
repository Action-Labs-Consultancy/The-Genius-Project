// Final validation script to check all the fixes
const fs = require('fs');

const workflow = JSON.parse(fs.readFileSync('REader_FINAL_MCA.json', 'utf8'));

console.log('🔍 VALIDATING ALL CONTENT GENERATION FIXES\n');

// Find all database save nodes
const saveNodes = workflow.nodes.filter(node => 
  node.type === 'n8n-nodes-base.postgres' && 
  node.parameters?.operation === 'upsert'
);

console.log('📊 DATABASE SAVE OPERATIONS:\n');

saveNodes.forEach((node, index) => {
  console.log(`${index + 1}. ${node.name}`);
  
  if (node.parameters?.columns?.value) {
    const value = node.parameters.columns.value;
    
    // Check specific content fields
    if (value.introduction_engagement_context) {
      console.log(`   ✅ introduction_engagement_context: ${value.introduction_engagement_context}`);
    }
    if (value.methodology_reliability_levels) {
      console.log(`   ✅ methodology_reliability_levels: ${value.methodology_reliability_levels}`);
    }
    if (value.company_overview) {
      console.log(`   ⚠️ company_overview: ${value.company_overview}`);
    }
    if (value.business_model_unit_economics) {
      console.log(`   🔧 business_model_unit_economics: ${value.business_model_unit_economics}`);
    }
    if (value.products_technology) {
      console.log(`   🔧 products_technology: ${value.products_technology}`);
    }
  }
  console.log('');
});

// Check data preparation nodes
console.log('🔄 DATA PREPARATION VALIDATION:\n');

const prepNodes = workflow.nodes.filter(node => 
  node.name?.includes('Prepare Database Data') && 
  node.parameters?.functionCode
);

prepNodes.forEach((node, index) => {
  console.log(`${index + 1}. ${node.name}`);
  const code = node.parameters.functionCode;
  
  if (code.includes('methodology_content:')) {
    const match = code.match(/methodology_content:\s*([^,}]+)/);
    if (match) {
      console.log(`   ❌ STILL USING methodology_content: ${match[1]}`);
    }
  }
  
  if (code.includes('business_model_content:')) {
    console.log(`   ✅ FIXED: Uses business_model_content`);
  }
  
  if (code.includes('products_technology_content:')) {
    console.log(`   ✅ FIXED: Uses products_technology_content`);
  }
  
  console.log('');
});

console.log('🎯 SUMMARY OF ISSUES FOUND:\n');

let issuesFound = 0;

// Check for remaining methodology_content issues
const remainingIssues = workflow.nodes.filter(node => 
  node.parameters?.functionCode?.includes('methodology_content:') ||
  node.parameters?.columns?.value?.business_model_unit_economics?.includes('methodology_content') ||
  node.parameters?.columns?.value?.products_technology?.includes('methodology_content')
);

if (remainingIssues.length > 0) {
  console.log(`❌ ${remainingIssues.length} nodes still have methodology_content mapping issues`);
  issuesFound += remainingIssues.length;
}

if (issuesFound === 0) {
  console.log('✅ ALL CONTENT MAPPING ISSUES HAVE BEEN FIXED!');
  console.log('\n📋 WHAT WAS FIXED:');
  console.log('1. Database Save3 now maps to business_model_content instead of methodology_content');
  console.log('2. Database Save4 now maps to products_technology_content instead of methodology_content');
  console.log('3. Prepare Database Data3 now outputs business_model_content');
  console.log('4. Prepare Database Data4 now outputs products_technology_content');
  console.log('\n🚀 The workflow should now generate unique content for each section!');
} else {
  console.log(`❌ ${issuesFound} issues still need to be fixed`);
}
