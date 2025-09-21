#!/usr/bin/env python3
"""
Find remaining node references
"""

import json
import re

def find_node_refs(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"🔍 Checking {filename} for remaining references...")
    
    for node in workflow.get('nodes', []):
        node_name = node.get('name', 'Unknown')
        node_str = json.dumps(node)
        
        if '$node[' in node_str:
            print(f"  📍 Found reference in: {node_name}")
            
            # Find the specific references
            matches = re.findall(r'\$node\[[^\]]+\]', node_str)
            for match in set(matches):
                print(f"    - {match}")

find_node_refs('DD_Section_01_Introduction.json')
