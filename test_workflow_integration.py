#!/usr/bin/env python3
"""
Test script to verify workflow integration between main and Section 1 workflows
"""
import json
import sys
import os

def check_workflow_structure():
    """Check that both workflows have the correct structure for integration"""
    
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    
    # Load both workflows
    try:
        with open(os.path.join(data_dir, 'dd_sections.json'), 'r', encoding='utf-8') as f:
            section1_workflow = json.load(f)
        print("✓ Section 1 workflow loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load Section 1 workflow: {e}")
        return False
    
    try:
        with open(os.path.join(data_dir, 'dd_reports.json'), 'r', encoding='utf-8') as f:
            main_workflow = json.load(f)
        print("✓ Main workflow loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load main workflow: {e}")
        return False
    
    # Check Section 1 workflow structure
    print("\n=== Section 1 Workflow Checks ===")
    
    # Check for webhook trigger
    has_webhook = False
    for node in section1_workflow.get('nodes', []):
        if node.get('type') == 'n8n-nodes-base.webhook':
            has_webhook = True
            print("✓ Has webhook trigger")
            break
    if not has_webhook:
        print("✗ Missing webhook trigger")
    
    # Check for HTTP Request to Ollama
    has_ollama_http = False
    for node in section1_workflow.get('nodes', []):
        if node.get('type') == 'n8n-nodes-base.httpRequest':
            params = node.get('parameters', {})
            url = str(params.get('url', '')).lower()
            if 'localhost:11434' in url or 'ollama' in url:
                has_ollama_http = True
                print("✓ Has HTTP request to Ollama")
                break
    if not has_ollama_http:
        print("✗ Missing HTTP request to Ollama")
    
    # Check Main workflow structure
    print("\n=== Main Workflow Checks ===")
    
    # Check for Call n8n Workflow Tool
    has_workflow_tool = False
    correct_workflow_id = False
    for node in main_workflow.get('nodes', []):
        if node.get('name') == 'Call n8n Workflow Tool':
            has_workflow_tool = True
            print("✓ Has 'Call n8n Workflow Tool'")
            
            # Check workflow ID
            params = node.get('parameters', {})
            workflow_id = params.get('workflowId')
            if workflow_id == 'G5YYk9XK2tStRIU9':
                correct_workflow_id = True
                print("✓ Correct workflow ID (G5YYk9XK2tStRIU9)")
            else:
                print(f"✗ Wrong workflow ID: {workflow_id}")
            break
    
    if not has_workflow_tool:
        print("✗ Missing 'Call n8n Workflow Tool'")
    
    # Check for proper data mapping
    has_data_mapping = False
    for node in main_workflow.get('nodes', []):
        if node.get('name') == 'MAIN':
            agent_prompt = node.get('parameters', {}).get('text', '')
            if 'company_name, company_id, and content' in agent_prompt:
                has_data_mapping = True
                print("✓ MAIN agent has proper data mapping instructions")
            break
    
    if not has_data_mapping:
        print("✗ MAIN agent missing data mapping instructions")
    
    # Check workflow connections
    print("\n=== Connection Checks ===")
    
    connections = main_workflow.get('connections', {})
    
    # Check Save Company Data -> MAIN
    save_to_main = False
    if 'Save Company Data' in connections:
        main_connections = connections['Save Company Data'].get('main', [])
        for connection_group in main_connections:
            for connection in connection_group:
                if connection.get('node') == 'MAIN':
                    save_to_main = True
                    print("✓ Save Company Data → MAIN")
                    break
    
    if not save_to_main:
        print("✗ Missing connection: Save Company Data → MAIN")
    
    # Check MAIN -> Retrieve Complete Report Data
    main_to_retrieve = False
    if 'MAIN' in connections:
        main_connections = connections['MAIN'].get('main', [])
        for connection_group in main_connections:
            for connection in connection_group:
                if connection.get('node') == 'Retrieve Complete Report Data':
                    main_to_retrieve = True
                    print("✓ MAIN → Retrieve Complete Report Data")
                    break
    
    if not main_to_retrieve:
        print("✗ Missing connection: MAIN → Retrieve Complete Report Data")
    
    # Check Call n8n Workflow Tool -> MAIN (AI tool connection)
    workflow_tool_to_main = False
    if 'Call n8n Workflow Tool' in connections:
        ai_tool_connections = connections['Call n8n Workflow Tool'].get('ai_tool', [])
        for connection_group in ai_tool_connections:
            for connection in connection_group:
                if connection.get('node') == 'MAIN':
                    workflow_tool_to_main = True
                    print("✓ Call n8n Workflow Tool → MAIN (AI tool)")
                    break
    
    if not workflow_tool_to_main:
        print("✗ Missing AI tool connection: Call n8n Workflow Tool → MAIN")
    
    print("\n=== Summary ===")
    all_checks = [
        has_webhook, has_ollama_http, has_workflow_tool, correct_workflow_id,
        has_data_mapping, save_to_main, main_to_retrieve, workflow_tool_to_main
    ]
    
    passed = sum(all_checks)
    total = len(all_checks)
    
    print(f"Checks passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All workflow integration checks PASSED! Workflows are ready.")
        return True
    else:
        print("⚠️  Some checks failed. Please review the issues above.")
        return False

if __name__ == "__main__":
    success = check_workflow_structure()
    sys.exit(0 if success else 1)
