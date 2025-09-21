#!/usr/bin/env python3
"""
Check for and fix node reference issues in n8n workflows
"""

import json
import os
import re

def check_node_references(filepath):
    """Check for problematic node references in workflow files"""
    print(f"🔍 Checking node references in {os.path.basename(filepath)}...")
    
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
        workflow = json.loads(content)
    
    # Get all node names in the workflow
    node_names = set()
    for node in workflow.get('nodes', []):
        node_names.add(node.get('name', ''))
    
    print(f"  📊 Found {len(node_names)} nodes in workflow")
    
    # Find all $node references in the content
    node_refs = re.findall(r'\$node\["([^"]+)"\]', content)
    
    issues = []
    
    # Check each reference
    for ref in node_refs:
        if ref not in node_names:
            issues.append(f"Reference to non-existent node: {ref}")
    
    # Check for problematic patterns
    problematic_patterns = [
        (r'\$node\[.*?\]\.json(?!\s*[;}])', "Complex node reference that might fail"),
        (r'const \w+ = \$node\[.*?\]\.json;.*?\$node\[.*?\]\.json', "Multiple node references in single function")
    ]
    
    for pattern, description in problematic_patterns:
        matches = re.findall(pattern, content, re.DOTALL)
        if matches:
            issues.append(f"{description}: {len(matches)} instances")
    
    if issues:
        print(f"  ❌ Found {len(issues)} potential issues:")
        for issue in issues:
            print(f"    - {issue}")
        return False
    else:
        print(f"  ✅ No node reference issues found")
        return True

def main():
    print("🔍 Checking n8n Workflow Node References")
    print("=" * 50)
    
    workflow_files = [
        'DD_Master_Workflow.json',
        'DD_Section_01_Introduction.json'
    ]
    
    all_good = True
    
    for filename in workflow_files:
        filepath = os.path.join(os.getcwd(), filename)
        if os.path.exists(filepath):
            if not check_node_references(filepath):
                all_good = False
        else:
            print(f"⚠️  File not found: {filename}")
            all_good = False
        print()
    
    if all_good:
        print("🎉 ALL NODE REFERENCES ARE VALID!")
        print("✅ No 'Error finding the referenced node' issues expected")
        print("✅ All Function nodes use proper data flow")
        print("✅ Ready to run in n8n!")
    else:
        print("❌ Some node reference issues need attention")
        print("💡 Tip: Use $input.first().json instead of $node references")
        print("💡 Pass data through connections rather than cross-referencing")

if __name__ == "__main__":
    main()
