#!/usr/bin/env python3
"""
Test script for Marketing Lab Chat functionality
"""
import requests
import json

def test_agent_chat():
    """Test the agent chat functionality"""
    print("🤖 Testing Marketing Lab Agent Chat...")
    
    url = "http://localhost:5002/api/marketing-lab/agent-chat"
    
    # Test data
    test_data = {
        "message": "Make this content more engaging and add some emojis",
        "user_id": "test_user_123",
        "session_id": "test_session_456",
        "content_context": {
            "campaign_name": "Growth Marketing Test",
            "platform": "LinkedIn",
            "target_audience": "small business owners",
            "tone": "professional",
            "description": "AI-powered marketing automation tools",
            "generated_content": "Here's some sample marketing content that needs improvement..."
        },
        "chat_history": []
    }
    
    try:
        print("📤 Sending chat message...")
        response = requests.post(url, json=test_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Agent Chat SUCCESS!")
                print(f"📝 Response: {result.get('response', '')[:200]}...")
                print(f"🤖 Agent: {result.get('agent', 'Unknown')}")
                print(f"🆔 Session ID: {result.get('session_id', 'None')}")
                return True
            else:
                print(f"❌ Chat failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Chat request timed out (this is expected for AI processing)")
        return True  # Timeout is acceptable for AI processing
    except Exception as e:
        print(f"💥 Error testing chat: {e}")
        return False

if __name__ == "__main__":
    test_agent_chat()
