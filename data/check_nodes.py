import json

with open('dd_sections_correct.json', encoding='utf-8') as f:
    data = json.load(f)

print('Checking node structure...')
nodes = data.get('nodes', [])
print(f'Total nodes: {len(nodes)}')

issues_found = False

for i, node in enumerate(nodes):
    required_props = ['id', 'name', 'type', 'position']
    missing_props = [prop for prop in required_props if prop not in node]
    if missing_props:
        print(f'Node {i}: {node.get("name", "unnamed")} - Missing: {missing_props}')
        issues_found = True
    
    # Check for None values in critical properties
    for prop in ['id', 'name', 'type']:
        if node.get(prop) is None:
            print(f'Node {i}: {node.get("name", "unnamed")} - {prop} is None')
            issues_found = True
            
    # Check for empty strings
    for prop in ['id', 'name', 'type']:
        if node.get(prop) == "":
            print(f'Node {i}: {node.get("name", "unnamed")} - {prop} is empty string')
            issues_found = True

if not issues_found:
    print('All nodes have required properties')
else:
    print('Issues found in node structure')
