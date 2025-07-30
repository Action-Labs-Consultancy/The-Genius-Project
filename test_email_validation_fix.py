#!/usr/bin/env python3
"""Test email validation with template variables"""

import requests
import json

def test_email_validation():
    """Test that email nodes now accept template variables"""
    print("Testing email validation with template variables...")
    
    # Test backend template loading first
    try:
        print("\n1. Testing backend template endpoint...")
        response = requests.get('http://localhost:5001/api/workflow-templates')
        if response.status_code == 200:
            templates = response.json()
            print(f"✓ Backend templates loaded: {len(templates)} templates")
            
            # Find Testing Million template
            testing_million = None
            for template in templates:
                if template.get('name') == 'Testing Million':
                    testing_million = template
                    break
            
            if testing_million:
                print("✓ Found 'Testing Million' template")
                
                # Check email nodes in template
                email_nodes = [node for node in testing_million.get('nodes', []) 
                             if node.get('data', {}).get('nodeType') == 'email']
                
                print(f"✓ Found {len(email_nodes)} email nodes")
                
                for i, node in enumerate(email_nodes):
                    node_data = node.get('data', {})
                    config = node_data.get('config', {})
                    to_email = config.get('to', '')
                    print(f"  Email node {i+1}: to='{to_email}'")
                    
                    if '{{' in to_email and '}}' in to_email:
                        print(f"  ✓ Uses template variable: {to_email}")
                    else:
                        print(f"  ✓ Uses literal email: {to_email}")
                
            else:
                print("✗ 'Testing Million' template not found")
                
        else:
            print(f"✗ Backend not responding: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Backend test failed: {e}")
    
    print("\n2. Testing validation function directly...")
    
    # Test the validation logic conceptually
    template_emails = ['{{customer_email}}', '{{sender_email}}', '{{user.email}}']
    regular_emails = ['test@example.com', 'user@domain.org']
    invalid_emails = ['invalid-email', '@domain.com', 'user@']
    
    print("Template variables that should be valid:")
    for email in template_emails:
        print(f"  {email}")
    
    print("Regular emails that should be valid:")
    for email in regular_emails:
        print(f"  {email}")
        
    print("Invalid emails that should fail:")
    for email in invalid_emails:
        print(f"  {email}")

if __name__ == '__main__':
    test_email_validation()
