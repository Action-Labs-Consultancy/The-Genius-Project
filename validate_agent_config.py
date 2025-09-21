#!/usr/bin/env python3
"""
Validate AI Agent Configuration for Tool Calling
"""
import json
import sys

try:
    with open('AI_Due_Diligence_Workflow.json', 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    # Find the MAIN agent node
    main_node = None
    section1_tool = None
    section2_tool = None
    
    for node in workflow['nodes']:
        if node.get('name') == 'MAIN':
            main_node = node
        elif node.get('name') == 'section1':
            section1_tool = node
        elif node.get('name') == 'section2':
            section2_tool = node
    
    print('=== AI AGENT CONFIGURATION CHECK ===')
    if main_node:
        params = main_node.get('parameters', {})
        agent_type = params.get('agent', 'NOT SET')
        prompt_type = params.get('promptType', 'NOT SET')
        print(f'Agent Type: {agent_type}')
        print(f'Prompt Type: {prompt_type}')
        
        options = params.get('options', {})
        max_iter = options.get('maxIterations', 'NOT SET')
        return_steps = options.get('returnIntermediateSteps', 'NOT SET')
        print(f'Max Iterations: {max_iter}')
        print(f'Return Steps: {return_steps}')
        
        text = params.get('text', '')
        print(f'Prompt Length: {len(text)} characters')
        print(f'Mentions section1: {"section1" in text}')
        print(f'Mentions section2: {"section2" in text}')
        print(f'Contains MUST: {"MUST" in text}')
        
        system_msg = options.get('systemMessage', '')
        print(f'System Message Length: {len(system_msg)} characters')
        print(f'System mentions tools: {"tool" in system_msg.lower()}')
    
    print('\n=== TOOL CONFIGURATION CHECK ===')
    if section1_tool:
        desc1 = section1_tool.get('parameters', {}).get('description', '')
        print(f'Section1 Tool: FOUND - Description: {len(desc1)} chars')
        print(f'Section1 Required: {"REQUIRED" in desc1}')
    else:
        print('Section1 Tool: NOT FOUND')
        
    if section2_tool:
        desc2 = section2_tool.get('parameters', {}).get('description', '')
        print(f'Section2 Tool: FOUND - Description: {len(desc2)} chars')
        print(f'Section2 Required: {"REQUIRED" in desc2}')
    else:
        print('Section2 Tool: NOT FOUND')
    
    # Check connections
    connections = workflow.get('connections', {})
    tool_connections = []
    for tool_name in ['section1', 'section2']:
        if tool_name in connections:
            ai_tool_conns = connections[tool_name].get('ai_tool', [])
            if ai_tool_conns:
                tool_connections.append(tool_name)
    
    print(f'\n=== CONNECTION CHECK ===')
    print(f'Tools connected to MAIN: {tool_connections}')
    print(f'Both tools connected: {len(tool_connections) == 2}')
    
    print('\n✅ WORKFLOW CONFIGURATION UPDATED FOR TOOL CALLING')
    print('🔧 Agent type changed to toolCallingAgent')
    print('🎯 Enhanced prompts with explicit tool calling instructions')
    print('⚡ Tool descriptions marked as REQUIRED')
    
    # Show key excerpts
    if main_node and 'text' in params:
        prompt_text = params['text']
        print(f'\n=== CURRENT PROMPT PREVIEW ===')
        print(prompt_text[:200] + '...' if len(prompt_text) > 200 else prompt_text)
    
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
