#!/usr/bin/env python3

import requests
import sys
import os

# Add backend to path
sys.path.insert(0, '/Users/rabab/the-genius-project/backend')

from marketing_lab_routes import RealMarketingAgent

# Test the exact same flow as the frontend
def test_generation():
    print("=== Testing Marketing Content Generation ===")
    
    # Create a test agent
    test_agent_data = {
        '_id': 'test-id-123',
        'agent_name': 'Content Creator',
        'role_description': 'Creative Content Generator',
        'system_prompt': 'You are a creative content generator for marketing campaigns.',
        'status': 'active',
        'brain_id': 'test-brain-123',
        'temperature': 0.7
    }
    
    agent = RealMarketingAgent(test_agent_data)
    
    # Test task data (same as frontend)
    task_data = {
        "campaign_name": "Test Campaign",
        "description": "Test description for debugging",
        "target_audience": "developers",
        "platform": "LinkedIn",
        "tone": "professional",
        "funnel_stage": "Awareness",
        "content_type": "Social Media Post",
        "time_option": "1 Month"
    }
    
    print(f"Agent: {agent.name}")
    print(f"Role: {agent.role}")
    print(f"Task data: {task_data}")
    print()
    
    # Test the direct generate_with_llama method first
    print("=== Testing direct Llama generation ===")
    simple_prompt = "Write a short LinkedIn post about AI tools for developers."
    content = agent.generate_with_llama(simple_prompt, max_tokens=120, timeout=8, max_retries=2)
    print(f"Direct generation result: {repr(content)}")
    print()
    
    # Test the full process_task_fast method
    print("=== Testing full process_task_fast ===")
    result = agent.process_task_fast(task_data)
    print(f"Full result: {result}")
    print()
    
    if result.get('content'):
        print("SUCCESS! Content was generated:")
        print(result['content'])
    else:
        print("FAILED! No content generated")
        print(f"Status: {result.get('status')}")
        print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    test_generation()
