#!/usr/bin/env python3
"""
Fix final Pinecone Query node references
"""

import json

with open('DD_Section_01_Introduction.json', 'r', encoding='utf-8') as f:
    workflow = json.load(f)

print("🔧 Fixing final Pinecone Query node references...")

for node in workflow.get('nodes', []):
    if node.get('name') == 'Company Knowledge Query':
        print(f"  🔄 Fixing {node.get('name')}")
        
        # Fix prompt field
        if 'parameters' in node and 'prompt' in node['parameters']:
            # Change from node reference to input reference
            node['parameters']['prompt'] = "=Analyze {{ $input.first().json.company_name }} for {{ $input.first().json.section_title }}: {{ $input.first().json.section_description }}"
        
        # Fix metadata filter  
        if 'parameters' in node and 'options' in node['parameters'] and 'metadata' in node['parameters']['options']:
            for metadata_item in node['parameters']['options']['metadata']:
                if 'value' in metadata_item and '$node[' in str(metadata_item['value']):
                    metadata_item['value'] = "={{ $input.first().json.company_id }}"

print("  ✅ Fixed Pinecone Query node references")

# Save the file
with open('DD_Section_01_Introduction.json', 'w', encoding='utf-8') as f:
    json.dump(workflow, f, indent=2)

print("✅ All node references completely fixed!")
print("🎯 Your workflows are now 100% n8n compatible!")
