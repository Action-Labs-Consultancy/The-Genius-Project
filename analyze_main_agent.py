#!/usr/bin/env python3
"""
Critical analysis of why MAIN agent isn't calling tools
"""
import json

def analyze_main_agent():
    """Analyze MAIN agent configuration for tool calling issues"""
    
    with open('AI_Due_Diligence_Workflow.json', 'r') as f:
        workflow = json.load(f)

    # Find MAIN agent node
    main_node = None
    for node in workflow['nodes']:
        if node['name'] == 'MAIN':
            main_node = node
            break

    print('🔍 CRITICAL ANALYSIS OF MAIN AGENT')
    print('=' * 50)
    
    if not main_node:
        print('❌ MAIN node not found!')
        return
    
    print('Agent parameters:')
    params = main_node['parameters']
    for key, value in params.items():
        print(f'  {key}: {value}')

    print('\n🔧 CHECKING CRITICAL REQUIREMENTS:')
    
    # Check 1: Agent type
    agent_type = params.get('agent')
    if agent_type == 'toolCallingAgent':
        print('✅ Agent type: toolCallingAgent (CORRECT)')
    else:
        print(f'❌ Agent type: {agent_type} (SHOULD BE toolCallingAgent)')
    
    # Check 2: Node type
    node_type = main_node.get('type')
    if node_type == '@n8n/n8n-nodes-langchain.agent':
        print('✅ Node type: @n8n/n8n-nodes-langchain.agent (CORRECT)')
    else:
        print(f'❌ Node type: {node_type} (INCORRECT)')
    
    print('\n🔌 CHECKING CONNECTIONS:')
    connections = workflow['connections']
    
    # Check tools connected to MAIN
    tools_connected = []
    for node_name, conn_types in connections.items():
        if 'ai_tool' in conn_types:
            for target_list in conn_types['ai_tool']:
                for target in target_list:
                    if target['node'] == 'MAIN':
                        tools_connected.append(node_name)
    
    print(f'Tools connected: {tools_connected}')
    if len(tools_connected) == 2:
        print('✅ Both tools connected to MAIN')
    else:
        print(f'❌ Only {len(tools_connected)} tools connected (NEED 2)')
    
    # Check model connected to MAIN
    model_connected = None
    for node_name, conn_types in connections.items():
        if 'ai_languageModel' in conn_types:
            for target_list in conn_types['ai_languageModel']:
                for target in target_list:
                    if target['node'] == 'MAIN':
                        model_connected = node_name
    
    if model_connected:
        print(f'✅ Model connected: {model_connected}')
    else:
        print('❌ NO MODEL CONNECTED TO MAIN!')
    
    print('\n🤖 CHECKING MODEL CAPABILITIES:')
    # Find model node
    model_node = None
    for node in workflow['nodes']:
        if node['name'] == model_connected:
            model_node = node
            break
    
    if model_node:
        model_name = model_node['parameters'].get('model', 'unknown')
        node_type = model_node.get('type', 'unknown')
        print(f'Model: {model_name}')
        print(f'Model type: {node_type}')
        
        if 'mistral' in model_name.lower():
            print('⚠️ CRITICAL ISSUE: Mistral has LIMITED tool calling support!')
            print('   This is likely why tools are not being called.')
        
        if node_type == '@n8n/n8n-nodes-langchain.lmChatOllama':
            print('🔧 POTENTIAL FIX: Try different Ollama model or update Mistral')
    
    print('\n💡 RECOMMENDATIONS:')
    if 'mistral' in model_name.lower():
        print('1. Try: ollama pull mistral-nemo (newer version with better tool support)')
        print('2. Try: ollama pull llama3.1 (has tool calling capabilities)')
        print('3. Update Mistral to latest version')
        print('4. Check if Mistral model supports function calling in your Ollama version')
    
    return main_node, model_node

if __name__ == "__main__":
    analyze_main_agent()
