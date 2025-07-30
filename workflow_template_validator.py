#!/usr/bin/env python3
"""
Workflow Template Validator - Identify and fix template errors
"""
import requests
import json

def validate_templates():
    """Validate current workflow templates and identify errors"""
    print("🔍 VALIDATING WORKFLOW TEMPLATES")
    print("=" * 50)
    
    try:
        # Get templates from API
        response = requests.get('http://localhost:10000/api/workflow-templates')
        if response.status_code != 200:
            print(f"❌ Failed to get templates: {response.status_code}")
            return []
        
        templates = response.json()
        print(f"✅ Found {len(templates)} templates")
        
        errors = []
        
        for template in templates:
            template_name = template.get('name', 'Unknown')
            print(f"\n📋 Validating: {template_name}")
            
            nodes = template.get('nodes', [])
            edges = template.get('edges', [])
            
            print(f"   📊 {len(nodes)} nodes, {len(edges)} edges")
            
            # Validate nodes
            node_errors = []
            node_types = set()
            
            for i, node in enumerate(nodes):
                node_id = node.get('id', f'node-{i}')
                node_type = node.get('data', {}).get('nodeType', 'unknown')
                config = node.get('data', {}).get('config', {})
                
                node_types.add(node_type)
                
                # Check for HTML-encoded operators
                if node_type == 'ifCondition':
                    operator = config.get('operator', '')
                    if '&gt;' in operator or '&lt;' in operator or '&amp;' in operator:
                        node_errors.append(f"   ❌ {node_id}: HTML-encoded operator '{operator}'")
                
                # Check for missing required fields
                if node_type == 'brain':
                    if not config.get('brainId') or 'brain-123' in config.get('brainId', ''):
                        node_errors.append(f"   ❌ {node_id}: Fake/missing brain ID")
                        
                elif node_type == 'agent':
                    if not config.get('agentId') or 'agent-789' in config.get('agentId', ''):
                        node_errors.append(f"   ❌ {node_id}: Fake/missing agent ID")
                        
                elif node_type == 'httpRequest':
                    url = config.get('url', '')
                    if 'api.payment-processor.com' in url or 'test-key-123' in str(config):
                        node_errors.append(f"   ❌ {node_id}: Fake/unrealistic HTTP endpoint")
                        
                elif node_type == 'email':
                    to_email = config.get('to', '')
                    if not to_email or 'security@company.com' in to_email:
                        node_errors.append(f"   ❌ {node_id}: Fake/missing email address")
                        
                elif node_type == 'slack':
                    channel = config.get('channel', '')
                    if not channel or 'security-alerts' in channel:
                        node_errors.append(f"   ❌ {node_id}: Fake/missing Slack channel")
                
                # Check for missing required fields
                if node_type == 'setVariable':
                    if not config.get('variableName') or not config.get('value'):
                        node_errors.append(f"   ❌ {node_id}: Missing variable name or value")
                        
                elif node_type == 'database':
                    if not config.get('operation') or not config.get('collection'):
                        node_errors.append(f"   ❌ {node_id}: Missing database operation or collection")
                        
                elif node_type == 'math':
                    if not config.get('operation') or not config.get('leftOperand'):
                        node_errors.append(f"   ❌ {node_id}: Missing math operation or operand")
            
            # Validate edges
            edge_errors = []
            node_ids = {node.get('id') for node in nodes}
            
            for edge in edges:
                source = edge.get('source')
                target = edge.get('target')
                
                if source not in node_ids:
                    edge_errors.append(f"   ❌ Edge references non-existent source: {source}")
                if target not in node_ids:
                    edge_errors.append(f"   ❌ Edge references non-existent target: {target}")
            
            # Report results
            total_errors = len(node_errors) + len(edge_errors)
            
            if total_errors == 0:
                print(f"   ✅ Template is valid")
            else:
                print(f"   ❌ Found {total_errors} errors:")
                for error in node_errors + edge_errors:
                    print(error)
                
                errors.append({
                    'template': template_name,
                    'errors': node_errors + edge_errors,
                    'total_errors': total_errors
                })
            
            print(f"   📋 Node types used: {sorted(node_types)}")
        
        # Summary
        print(f"\n📊 VALIDATION SUMMARY")
        print(f"   Total templates: {len(templates)}")
        print(f"   Templates with errors: {len(errors)}")
        
        if errors:
            print(f"\n❌ TEMPLATES TO DELETE/FIX:")
            for error_info in errors:
                print(f"   - {error_info['template']}: {error_info['total_errors']} errors")
        
        return errors
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return []

if __name__ == "__main__":
    validate_templates()
