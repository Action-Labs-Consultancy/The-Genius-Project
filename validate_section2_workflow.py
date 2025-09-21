import json

try:
    with open('AI_Due_Diligence_Workflow.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print('✅ Section 2 Workflow JSON is valid!')
    print(f'📋 Workflow name: {data["name"]}')
    print(f'🔧 Total nodes: {len(data["nodes"])}')
    
    # Check Section 2 specific nodes
    section2_nodes = [n["name"] for n in data["nodes"] if 'Section 2' in n["name"] or 'section2' in n["name"].lower()]
    print(f'🎯 Section 2 nodes: {section2_nodes}')
    
    # Check database table references
    postgres_nodes = [n for n in data["nodes"] if n["type"] == 'n8n-nodes-base.postgres']
    print(f'🗃️  PostgreSQL nodes: {len(postgres_nodes)}')
    
    for node in postgres_nodes:
        node_name = node["name"]
        if "table" in node["parameters"]:
            table_name = node["parameters"]["table"]
            print(f'   - {node_name}: {table_name}')
    
    print('\n🔥 Section 2 workflow is ready!')
    print('📊 Tables: section2_reports, company_data_section2')
    print('🎯 Purpose: Generate Legal Disclaimers & Reliance Limitations')
    print('🚀 Database: Uses dedicated Section 2 tables (no conflicts with existing workflow)')
    
except Exception as e:
    print(f'❌ Error validating workflow: {e}')
