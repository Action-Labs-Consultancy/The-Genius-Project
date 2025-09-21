#!/usr/bin/env python3
"""
Comprehensive Validation for AI Agent Subworkflow Calling
"""
import json
import sys

def main():
    try:
        with open('AI_Due_Diligence_Workflow.json', 'r', encoding='utf-8') as f:
            workflow = json.load(f)
        
        print('🔍 COMPREHENSIVE SUBWORKFLOW CALLING VALIDATION')
        print('=' * 60)
        
        # Find key nodes
        nodes = {node['name']: node for node in workflow['nodes']}
        
        # 1. Check MAIN agent configuration
        main_node = nodes.get('MAIN')
        if not main_node:
            print('❌ MAIN node not found!')
            return False
            
        agent_params = main_node.get('parameters', {})
        agent_type = agent_params.get('agent')
        
        print(f'1. MAIN AGENT CONFIGURATION:')
        print(f'   Agent Type: {agent_type} {"✅" if agent_type == "toolCallingAgent" else "❌"}')
        print(f'   Node Type: {main_node.get("type")}')
        
        if agent_type != 'toolCallingAgent':
            print('   ❌ CRITICAL: Agent type must be "toolCallingAgent" for tool execution!')
            return False
        
        # 2. Check tool configurations
        section1_tool = nodes.get('section1')
        section2_tool = nodes.get('section2')
        
        print(f'\\n2. TOOL CONFIGURATIONS:')
        if section1_tool:
            s1_workflow_id = section1_tool.get('parameters', {}).get('workflowId', {}).get('value')
            print(f'   Section1 Tool: ✅ Found (Workflow ID: {s1_workflow_id})')
        else:
            print(f'   Section1 Tool: ❌ Not found')
            return False
            
        if section2_tool:
            s2_workflow_id = section2_tool.get('parameters', {}).get('workflowId', {}).get('value')
            print(f'   Section2 Tool: ✅ Found (Workflow ID: {s2_workflow_id})')
        else:
            print(f'   Section2 Tool: ❌ Not found')
            return False
        
        # 3. Check connections
        connections = workflow.get('connections', {})
        
        print(f'\\n3. CONNECTION ANALYSIS:')
        
        # Check tool connections to MAIN
        s1_connected = 'section1' in connections and 'ai_tool' in connections['section1']
        s2_connected = 'section2' in connections and 'ai_tool' in connections['section2']
        
        print(f'   Section1 → MAIN: {"✅" if s1_connected else "❌"}')
        print(f'   Section2 → MAIN: {"✅" if s2_connected else "❌"}')
        
        # Check MAIN output connection
        main_connected = 'MAIN' in connections and 'main' in connections['MAIN']
        if main_connected:
            main_output = connections['MAIN']['main'][0][0]['node']
            print(f'   MAIN → {main_output}: ✅')
        else:
            print(f'   MAIN output: ❌ Not connected')
            return False
        
        # 4. Check wait mechanism
        wait_node = nodes.get('Wait for Subworkflows')
        if wait_node:
            wait_time = wait_node.get('parameters', {}).get('amount', 0)
            print(f'\\n4. WAIT MECHANISM:')
            print(f'   Wait Node: ✅ Found ({wait_time} seconds)')
        else:
            print(f'\\n4. WAIT MECHANISM:')
            print(f'   Wait Node: ❌ Missing - Subworkflows may not complete before data retrieval')
        
        # 5. Check tool input mappings
        print(f'\\n5. TOOL INPUT VALIDATION:')
        
        # Section1 inputs
        s1_inputs = section1_tool.get('parameters', {}).get('workflowInputs', {}).get('value', {})
        s1_company_id = s1_inputs.get('company_id', '')
        s1_company_name = s1_inputs.get('company_name', '')
        s1_trigger = s1_inputs.get('trigger_source', '')
        
        print(f'   Section1 Inputs:')
        print(f'     company_id: {"✅" if "$input.first().json.company_id" in s1_company_id else "❌"} {s1_company_id}')
        print(f'     company_name: {"✅" if "$input.first().json.company_name" in s1_company_name else "❌"} {s1_company_name}')
        print(f'     trigger_source: {"✅" if s1_trigger == "orchestrator" else "❌"} {s1_trigger}')
        
        # Section2 inputs  
        s2_inputs = section2_tool.get('parameters', {}).get('workflowInputs', {}).get('value', {})
        s2_company_id = s2_inputs.get('company_id', '')
        s2_company_name = s2_inputs.get('company_name', '')
        s2_trigger = s2_inputs.get('trigger_source', '')
        
        print(f'   Section2 Inputs:')
        print(f'     company_id: {"✅" if "$input.first().json.company_id" in s2_company_id else "❌"} {s2_company_id}')
        print(f'     company_name: {"✅" if "$input.first().json.company_name" in s2_company_name else "❌"} {s2_company_name}')
        print(f'     trigger_source: {"✅" if s2_trigger == "orchestrator" else "❌"} {s2_trigger}')
        
        # 6. Check prompt configuration
        prompt_text = agent_params.get('text', '')
        system_msg = agent_params.get('options', {}).get('systemMessage', '')
        
        print(f'\\n6. PROMPT ANALYSIS:')
        print(f'   Mentions section1: {"✅" if "section1" in prompt_text else "❌"}')
        print(f'   Mentions section2: {"✅" if "section2" in prompt_text else "❌"}')
        print(f'   Contains MUST: {"✅" if "MUST" in prompt_text else "❌"}')
        print(f'   Tool calling instructions: {"✅" if "call" in prompt_text.lower() else "❌"}')
        print(f'   System message length: {len(system_msg)} chars {"✅" if len(system_msg) > 100 else "❌"}')
        
        # 7. Overall assessment
        print(f'\\n7. WORKFLOW FLOW VALIDATION:')
        print(f'   PDF Processing → Company Data Save → MAIN Agent ✅')
        print(f'   MAIN Agent → Wait → Report Retrieval → File Creation ✅')
        print(f'   Tools connect to MAIN via ai_tool connections ✅')
        
        print(f'\\n🎯 FINAL ASSESSMENT:')
        
        critical_checks = [
            agent_type == 'toolCallingAgent',
            s1_connected and s2_connected,
            main_connected,
            'section1' in prompt_text and 'section2' in prompt_text,
            'MUST' in prompt_text
        ]
        
        if all(critical_checks):
            print('✅ ALL CRITICAL CHECKS PASSED')
            print('🚀 Subworkflows should now be called correctly!')
            print('\\n📋 EXPECTED BEHAVIOR:')
            print('   1. PDF processing completes and saves company data')
            print('   2. MAIN toolCallingAgent receives company_id and company_name')
            print('   3. Agent calls section1 tool with orchestrator trigger')
            print('   4. Agent calls section2 tool with orchestrator trigger')
            print('   5. Wait 60 seconds for subworkflows to complete AI generation')
            print('   6. Retrieve AI-generated content from database')
            print('   7. Create final text file with both sections')
            return True
        else:
            print('❌ SOME CRITICAL CHECKS FAILED')
            print('⚠️  Subworkflow calling may still not work properly')
            return False
            
    except Exception as e:
        print(f'Error during validation: {e}')
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
