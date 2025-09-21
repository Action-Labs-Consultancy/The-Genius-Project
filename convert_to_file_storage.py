#!/usr/bin/env python3
"""
Convert workflows to use file-based storage instead of database
This uses n8n's built-in file handling capabilities
"""

import json
import os

def update_workflow_for_file_storage(filepath):
    """Update a workflow file to use file storage instead of database"""
    print(f"📝 Updating {os.path.basename(filepath)} to use file storage...")
    
    # Read the workflow file
    with open(filepath, 'r', encoding='utf-8') as file:
        workflow = json.load(file)
    
    # Track changes made
    changes_made = []
    
    # Update all nodes in the workflow
    for node in workflow.get('nodes', []):
        node_name = node.get('name', 'Unknown')
        node_type = node.get('type', '')
        
        # Check if this is a database node (SQLite, PostgreSQL, etc.)
        if any(db_type in node_type.lower() for db_type in ['sqlite', 'postgres', 'mysql', 'database']):
            print(f"  🔄 Converting database node: {node_name}")
            
            # Convert to HTTP Request node for file operations
            node['type'] = 'n8n-nodes-base.function'
            node['typeVersion'] = 1
            
            # Remove database-specific credentials
            if 'credentials' in node:
                node['credentials'] = {}
            
            # Convert database operations to file operations
            if 'parameters' in node:
                old_params = node['parameters']
                operation = old_params.get('operation', 'unknown')
                
                if 'insert' in operation.lower():
                    # Convert INSERT to file append
                    node['parameters'] = {
                        'functionCode': '''// Save data to JSON file (replaces database INSERT)
const data = $input.first().json;
const fs = require('fs');
const path = require('path');

// Define file path based on operation
const filePath = path.join(process.cwd(), 'data', 'dd_sections.json');

// Ensure data directory exists
const dataDir = path.dirname(filePath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Read existing data or create empty array
let existingData = [];
if (fs.existsSync(filePath)) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
    } catch (error) {
        console.log('Creating new data file...');
        existingData = [];
    }
}

// Add new record with timestamp
const newRecord = {
    ...data,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

existingData.push(newRecord);

// Save back to file
fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

console.log(`✅ Saved record to ${filePath}`);
console.log(`📊 Total records: ${existingData.length}`);

return { json: newRecord };'''
                    }
                    changes_made.append(f"Converted {node_name} INSERT to file storage")
                
                elif 'select' in operation.lower() or 'fetch' in node_name.lower():
                    # Convert SELECT to file read
                    node['parameters'] = {
                        'functionCode': '''// Read data from JSON file (replaces database SELECT)
const fs = require('fs');
const path = require('path');

// Get query parameters from input
const inputData = $input.first().json;
const companyId = inputData.company_id;
const sectionNumber = inputData.section_number;

const filePath = path.join(process.cwd(), 'data', 'dd_sections.json');

// Read existing data
let allData = [];
if (fs.existsSync(filePath)) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        allData = JSON.parse(fileContent);
    } catch (error) {
        console.log('No data file found, returning empty results');
        return { json: [] };
    }
} else {
    console.log('Data file does not exist, returning empty results');
    return { json: [] };
}

// Filter data based on query (simulate WHERE clause)
let filteredData = allData;

if (companyId) {
    filteredData = filteredData.filter(record => record.company_id === companyId);
}

if (sectionNumber !== undefined) {
    filteredData = filteredData.filter(record => 
        record.section_number && record.section_number < sectionNumber
    );
}

// Filter for approved status if this is for previous sections
if (inputData.section_number) {
    filteredData = filteredData.filter(record => record.status === 'approved');
}

console.log(`📊 Found ${filteredData.length} matching records`);

// Return results in array format to match database behavior
return filteredData.map(record => ({ json: record }));'''
                    }
                    changes_made.append(f"Converted {node_name} SELECT to file storage")
                
                else:
                    # Generic file operation
                    node['parameters'] = {
                        'functionCode': '''// Generic file storage operation
const data = $input.first().json;
const fs = require('fs');
const path = require('path');

// Save data to file
const filePath = path.join(process.cwd(), 'data', 'dd_data.json');
const dataDir = path.dirname(filePath);

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Read existing data
let existingData = [];
if (fs.existsSync(filePath)) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
    } catch (error) {
        existingData = [];
    }
}

// Add/update record
const record = {
    ...data,
    timestamp: new Date().toISOString()
};

existingData.push(record);

// Save back to file
fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

console.log('✅ Data saved to file storage');
return { json: record };'''
                    }
                    changes_made.append(f"Converted {node_name} to generic file storage")
    
    # Write the updated workflow back
    with open(filepath, 'w', encoding='utf-8') as file:
        json.dump(workflow, file, indent=2)
    
    print(f"  ✅ Updated {os.path.basename(filepath)}")
    for change in changes_made:
        print(f"    - {change}")
    
    return len(changes_made)

def main():
    print("🔄 Converting workflows to use file-based storage")
    print("=" * 60)
    
    # List of workflow files to update
    workflow_files = [
        'DD_Master_Workflow.json',
        'DD_Section_01_Introduction.json'
    ]
    
    total_changes = 0
    
    for filename in workflow_files:
        filepath = os.path.join(os.getcwd(), filename)
        if os.path.exists(filepath):
            changes = update_workflow_for_file_storage(filepath)
            total_changes += changes
        else:
            print(f"⚠️  File not found: {filename}")
    
    print()
    print(f"✅ Conversion complete! Made {total_changes} changes total.")
    print()
    print("🎯 Benefits of file-based storage:")
    print("  ✅ No database setup required")
    print("  ✅ No credentials needed") 
    print("  ✅ Works with any n8n installation")
    print("  ✅ Data stored in project directory")
    print("  ✅ Easy to backup and migrate")
    print()
    print("📁 Data will be stored in:")
    print(f"   {os.path.join(os.getcwd(), 'data')}")
    print()
    print("🚀 Your workflows are now ready to run!")

if __name__ == "__main__":
    main()
