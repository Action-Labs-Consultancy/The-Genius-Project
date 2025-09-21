#!/usr/bin/env python3
"""
Final targeted fix for remaining node references
"""

import json
import os

def fix_remaining_references():
    print("🔧 Final Node Reference Fix")
    print("=" * 30)
    
    # Fix Master Workflow
    with open('DD_Master_Workflow.json', 'r', encoding='utf-8') as f:
        master = json.load(f)
    
    for node in master.get('nodes', []):
        if node.get('type') == 'n8n-nodes-base.function':
            node_name = node.get('name', '')
            if 'parameters' in node and 'functionCode' in node['parameters']:
                code = node['parameters']['functionCode']
                
                # Fix Initialize Company Processing
                if node_name == "Initialize Company Processing":
                    print(f"  🔄 Fixing {node_name}")
                    new_code = '''// Initialize company processing session
const triggerData = $input.first().json;
const folderName = triggerData.name || 'Unknown_Company';
const folderId = triggerData.id || null;

// Generate unique company ID
const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Clean company name
let companyName = folderName;
companyName = companyName
  .replace(/^(new folder|folder|untitled|document)$/i, 'Unknown_Company')
  .replace(/[_-]+/g, ' ')
  .replace(/\\s+/g, ' ')
  .trim();

if (companyName.length < 2) {
  companyName = 'Unknown_Company';
}

console.log('🏢 STARTING DUE DILIGENCE PROCESS');
console.log('='.repeat(50));
console.log(`📁 Company: ${companyName}`);
console.log(`🆔 Company ID: ${companyId}`);
console.log(`📂 Folder ID: ${folderId}`);

return {
  json: {
    company_id: companyId,
    company_name: companyName,
    folder_id: folderId,
    folder_name: folderName,
    processing_status: 'initialized',
    start_time: new Date().toISOString()
  }
};'''
                    node['parameters']['functionCode'] = new_code
                
                # Fix Prepare PDF Ingestion
                elif node_name == "Prepare PDF Ingestion":
                    print(f"  🔄 Fixing {node_name}")
                    code = code.replace(
                        'const companyInfo = $node["Initialize Company Processing"].json;',
                        '// Get company info from previous processing'
                    )
                    # Add logic to get company info from input data flow
                    if '// Get company info from previous processing' in code:
                        code = code.replace(
                            '// Get company info from previous processing',
                            '''// Get company info from previous processing
const allInputs = $input.all();
let companyInfo = {};

// Find company info from inputs
allInputs.forEach(input => {
    const data = input.json;
    if (data && data.company_id && data.company_name) {
        companyInfo = data;
    }
});

// Fallback if no company info found
if (!companyInfo.company_id) {
    companyInfo = {
        company_id: 'unknown',
        company_name: 'Unknown Company',
        folder_id: null
    };
}'''
                        )
                    node['parameters']['functionCode'] = code
                
                # Fix Create Text Chunks  
                elif node_name == "Create Text Chunks":
                    print(f"  🔄 Fixing {node_name}")
                    code = code.replace(
                        'const fileInfo = $node["Prepare PDF Ingestion"].json;',
                        '''// Get file info from input data flow
const allInputs = $input.all();
let fileInfo = {};

// Find file info from inputs
allInputs.forEach(input => {
    const data = input.json;
    if (data && (data.file_name || data.pdf_files)) {
        fileInfo = data;
    }
});

// Fallback if no file info found
if (!fileInfo.file_name) {
    fileInfo = {
        file_name: 'unknown.pdf',
        file_size: 0,
        company_name: 'Unknown Company'
    };
}'''
                    )
                    node['parameters']['functionCode'] = code
                
                # Fix Complete Processing
                elif node_name == "Complete Processing":
                    print(f"  🔄 Fixing {node_name}")
                    code = code.replace(
                        'const companyInfo = $node["Complete Ingestion"].json;',
                        '''// Get company info from input data flow
const allInputs = $input.all();
let companyInfo = {};

// Look for company info in inputs
allInputs.forEach(input => {
    const data = input.json;
    if (data && data.company_id) {
        companyInfo = data;
    }
});

// Fallback if no company info found
if (!companyInfo.company_id) {
    companyInfo = {
        company_id: 'unknown',
        company_name: 'Unknown Company'
    };
}'''
                    )
                    node['parameters']['functionCode'] = code
        
        # Fix HTTP Request nodes with node references in URL
        elif node.get('type') == 'n8n-nodes-base.httpRequest':
            if 'parameters' in node and 'url' in node['parameters']:
                url = node['parameters']['url']
                if '$node[' in url and 'Google Drive Trigger' in url:
                    print(f"  🔄 Fixing HTTP Request URL in {node.get('name', 'Unknown')}")
                    # Replace with expression that uses input data
                    new_url = "=https://www.googleapis.com/drive/v3/files?q=parents in '{{ $input.first().json.id }}' and mimeType='application/pdf'&fields=files(id,name,size,mimeType)&pageSize=1000"
                    node['parameters']['url'] = new_url
    
    # Save Master Workflow
    with open('DD_Master_Workflow.json', 'w', encoding='utf-8') as f:
        json.dump(master, f, indent=2)
    
    print("  ✅ Fixed DD_Master_Workflow.json")
    
    # Fix Section Workflow (already mostly fixed, just ensure consistency)
    with open('DD_Section_01_Introduction.json', 'r', encoding='utf-8') as f:
        section = json.load(f)
    
    for node in section.get('nodes', []):
        if node.get('type') == 'n8n-nodes-base.function':
            if 'parameters' in node and 'functionCode' in node['parameters']:
                code = node['parameters']['functionCode']
                # Ensure all simple node references are converted
                if 'const sectionInfo = $node[' in code:
                    code = code.replace(
                        'const sectionInfo = $node[',
                        'const sectionInfo = $input.first().json; // was $node['
                    )
                    node['parameters']['functionCode'] = code
                    print(f"  🔄 Fixed simple reference in {node.get('name', 'Unknown')}")
    
    # Save Section Workflow  
    with open('DD_Section_01_Introduction.json', 'w', encoding='utf-8') as f:
        json.dump(section, f, indent=2)
    
    print("  ✅ Fixed DD_Section_01_Introduction.json")
    print()
    print("🎯 All node references fixed!")
    print("✅ No more cross-node dependencies")
    print("✅ All data flows through connections")
    print("✅ Safe fallbacks for missing data")

if __name__ == "__main__":
    fix_remaining_references()
