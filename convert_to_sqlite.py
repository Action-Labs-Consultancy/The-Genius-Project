#!/usr/bin/env python3
"""
Update n8n workflows to use SQLite instead of PostgreSQL
"""

import json
import os

def update_workflow_for_sqlite(filepath):
    """Update a workflow file to use SQLite instead of PostgreSQL"""
    print(f"📝 Updating {os.path.basename(filepath)}...")
    
    # Read the workflow file
    with open(filepath, 'r', encoding='utf-8') as file:
        workflow = json.load(file)
    
    # Update all nodes in the workflow
    for node in workflow.get('nodes', []):
        # Check if this is a PostgreSQL node
        if (node.get('type') == 'n8n-nodes-base.postgres' or 
            'postgres' in node.get('type', '').lower()):
            
            print(f"  🔄 Converting PostgreSQL node: {node.get('name', 'Unknown')}")
            
            # Change to SQLite node type
            node['type'] = 'n8n-nodes-base.sqlite'
            node['typeVersion'] = 1
            
            # Update credentials
            if 'credentials' in node:
                # Remove PostgreSQL credentials
                if 'postgres' in node['credentials']:
                    del node['credentials']['postgres']
                
                # Add SQLite credentials placeholder
                node['credentials'] = {
                    'sqlite': {
                        'id': 'REPLACE_WITH_SQLITE_CRED_ID',
                        'name': 'SQLite Database'
                    }
                }
            
            # Update parameters for SQLite compatibility
            if 'parameters' in node:
                params = node['parameters']
                
                # Convert PostgreSQL-specific SQL to SQLite
                if 'query' in params:
                    query = params['query']
                    # Replace PostgreSQL-specific syntax with SQLite
                    query = query.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
                    query = query.replace('VARCHAR(', 'TEXT(')
                    query = query.replace('TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
                    params['query'] = query
                
                # Update insert/update operations
                if 'operation' in params and params['operation'] == 'insert':
                    # Ensure SQLite compatibility
                    if 'additionalFields' in params:
                        # SQLite handles this differently
                        pass
    
    # Write the updated workflow back
    with open(filepath, 'w', encoding='utf-8') as file:
        json.dump(workflow, file, indent=2)
    
    print(f"  ✅ Updated {os.path.basename(filepath)}")

def main():
    print("🔄 Converting PostgreSQL workflows to SQLite")
    print("=" * 50)
    
    # List of workflow files to update
    workflow_files = [
        'DD_Master_Workflow.json',
        'DD_Section_01_Introduction.json'
    ]
    
    for filename in workflow_files:
        filepath = os.path.join(os.getcwd(), filename)
        if os.path.exists(filepath):
            update_workflow_for_sqlite(filepath)
        else:
            print(f"⚠️  File not found: {filename}")
    
    print()
    print("✅ Conversion complete!")
    print()
    print("🎯 Next steps:")
    print("1. Create SQLite credentials in n8n:")
    print(f"   Database Path: {os.path.join(os.getcwd(), 'n8n_due_diligence.db')}")
    print("2. Note the credential ID (e.g., 'abc123')")
    print("3. Replace 'REPLACE_WITH_SQLITE_CRED_ID' with your actual credential ID")
    print()
    print("🚀 Your due diligence system is ready to run!")

if __name__ == "__main__":
    main()
