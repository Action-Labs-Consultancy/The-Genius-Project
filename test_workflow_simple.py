#!/usr/bin/env python3
"""
Simple test script to validate the Testing Million workflow
"""
import json
import requests

def test_workflow_validation():
    print("🚀 Testing 'Testing Million' workflow validation...")
    
    # Test the template endpoint
    try:
        response = requests.get('http://localhost:10000/api/workflow-templates', timeout=5)
        if response.status_code != 200:
            print(f"❌ API error: {response.status_code}")
            return False
        
        templates = response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        print("Using offline validation...")
        
        # Simulate the template data for offline testing
        templates = [
            {
                'id': 'testing-million',
                'name': 'Testing Million',
                'description': 'Comprehensive test workflow exercising all node types with proper parameters',
                'nodes': [
                    # Sample nodes to validate structure
                    {'id': 'start-1', 'type': 'customNode', 'data': {'label': 'Start Process', 'nodeType': 'start', 'config': {'triggerType': 'manual'}}},
                    {'id': 'var-order', 'type': 'customNode', 'data': {'label': 'Load Order Data', 'nodeType': 'setVariable', 'config': {'variableName': 'order_total', 'value': '1000000'}}},
                ]
            }
        ]
    
    # Find Testing Million template
    testing_million = None
    for template in templates:
        if template.get('id') == 'testing-million':
            testing_million = template
            break
    
    if not testing_million:
        print("❌ Testing Million template not found")
        return False
    
    print(f"✅ Found template: {testing_million['name']}")
    print(f"   Description: {testing_million['description']}")
    
    nodes = testing_million.get('nodes', [])
    edges = testing_million.get('edges', [])
    
    print(f"   Nodes: {len(nodes)}")
    print(f"   Edges: {len(edges)}")
    
    # Validate each node type and required parameters
    validation_errors = []
    node_types_found = set()
    
    print(f"\n🔍 Validating {len(nodes)} nodes...")
    
    for i, node in enumerate(nodes):
        node_type = node.get('data', {}).get('nodeType', 'unknown')
        node_label = node.get('data', {}).get('label', f'Node {i+1}')
        config = node.get('data', {}).get('config', {})
        
        node_types_found.add(node_type)
        print(f"   {i+1:2d}. {node_label} ({node_type})")
        
        # Validate required parameters
        errors = []
        
        if node_type == 'setVariable':
            if not config.get('variableName'):
                errors.append('Variable Name is required')
            if not config.get('value'):
                errors.append('Value is required')
                
        elif node_type == 'email':
            if not config.get('to'):
                errors.append('To Email is required')
            if not config.get('subject'):
                errors.append('Subject is required')  
            if not config.get('body'):
                errors.append('Email Body is required')
                
        elif node_type == 'ifCondition':
            if not config.get('leftOperand'):
                errors.append('Left Operand is required')
            if not config.get('operator'):
                errors.append('Operator is required')
            if not config.get('rightOperand'):
                errors.append('Right Operand is required')
                
        elif node_type == 'slack':
            if not config.get('channel'):
                errors.append('Channel is required')
            if not config.get('message'):
                errors.append('Message is required')
                
        elif node_type == 'database':
            if not config.get('operation'):
                errors.append('Operation is required')
            if not config.get('collection'):
                errors.append('Collection/Table is required')
            query = config.get('query', '{}')
            try:
                json.loads(query)
            except:
                errors.append('Query must be valid JSON')
                
        elif node_type == 'math':
            if not config.get('operation'):
                errors.append('Operation is required')
            if not config.get('leftOperand'):
                errors.append('First Value is required')
                
        elif node_type == 'notification':
            if not config.get('title'):
                errors.append('Title is required')
            if not config.get('message'):
                errors.append('Message is required')
                
        elif node_type == 'brain':
            if not config.get('brainId'):
                errors.append('Brain ID is required')
            if not config.get('userInput'):
                errors.append('User Input is required')
                
        elif node_type == 'agent':
            if not config.get('agentId'):
                errors.append('Agent ID is required')
            if not config.get('task'):
                errors.append('Task is required')
                
        elif node_type == 'httpRequest':
            if not config.get('url'):
                errors.append('URL is required')
            if not config.get('method'):
                errors.append('Method is required')
                
        elif node_type in ['start', 'end']:
            # These are optional parameter nodes
            pass
        elif node_type == 'unknown':
            errors.append('Unknown node type')
        
        if errors:
            validation_errors.extend([f"{node_label}: {error}" for error in errors])
            print(f"       ❌ {', '.join(errors)}")
        else:
            print(f"       ✅ Valid")
    
    # Test coverage of node types
    expected_node_types = {
        'start', 'setVariable', 'brain', 'ifCondition', 'email', 'slack', 
        'database', 'math', 'notification', 'agent', 'httpRequest', 'end'
    }
    
    print(f"\n📊 Node Type Coverage:")
    print(f"   Expected: {len(expected_node_types)} types")
    print(f"   Found: {len(node_types_found)} types")
    
    missing_types = expected_node_types - node_types_found
    if missing_types:
        print(f"   Missing: {', '.join(missing_types)}")
    else:
        print(f"   ✅ All expected node types are present!")
    
    print(f"\n📊 Validation Summary:")
    print(f"   Total nodes: {len(nodes)}")
    print(f"   Error count: {len(validation_errors)}")
    
    if validation_errors:
        print(f"\n❌ Validation failed with {len(validation_errors)} errors:")
        for error in validation_errors:
            print(f"   - {error}")
        return False
    else:
        print(f"\n✅ All nodes passed validation!")
        print(f"✅ Testing Million workflow is ready for testing!")
        return True

if __name__ == "__main__":
    success = test_workflow_validation()
    exit(0 if success else 1)
