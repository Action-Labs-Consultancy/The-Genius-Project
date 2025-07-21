#!/usr/bin/env python3
"""
Test script for the RAG Web API with chat storage
"""

import requests
import json
import time
from rich.console import Console

console = Console()
BASE_URL = "http://localhost:8001"

def test_api():
    """Test the chat storage API endpoints"""
    console.print("[bold]🧪 Testing RAG Web API[/bold]")
    
    try:
        # 1. Test health check
        console.print("\n1. Testing health check...")
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            console.print("[green]✓ Health check passed[/green]")
        else:
            console.print("[red]❌ Health check failed[/red]")
            return
        
        # 2. Test sending a chat message
        console.print("\n2. Testing chat message...")
        chat_response = requests.post(f"{BASE_URL}/chat", json={
            "message": "Hello, can you tell me about the documents?",
            "mode": "auto"
        })
        if chat_response.status_code == 200:
            data = chat_response.json()
            console.print(f"[green]✓ Chat response received[/green]")
            console.print(f"Response: {data['response'][:100]}...")
            console.print(f"Sources: {data['sources']}")
        else:
            console.print(f"[red]❌ Chat failed: {chat_response.status_code}[/red]")
            return
        
        # 3. Test getting conversations
        console.print("\n3. Testing conversations list...")
        time.sleep(2)  # Give it time to save
        conversations_response = requests.get(f"{BASE_URL}/api/conversations")
        if conversations_response.status_code == 200:
            conversations = conversations_response.json()
            console.print(f"[green]✓ Found {len(conversations)} conversations[/green]")
            
            if conversations:
                # Test getting a specific conversation
                conv_id = conversations[0]['id']
                console.print(f"\n4. Testing conversation details for: {conv_id}")
                
                detail_response = requests.get(f"{BASE_URL}/api/conversations/{conv_id}")
                if detail_response.status_code == 200:
                    details = detail_response.json()
                    console.print(f"[green]✓ Conversation details: {details['title']}[/green]")
                    console.print(f"Messages: {len(details['messages'])}")
                else:
                    console.print("[red]❌ Failed to get conversation details[/red]")
        else:
            console.print(f"[red]❌ Failed to get conversations: {conversations_response.status_code}[/red]")
        
        # 4. Test creating a new conversation
        console.print("\n5. Testing new conversation creation...")
        new_conv_response = requests.post(f"{BASE_URL}/api/conversations", json={
            "title": "Test Conversation from API"
        })
        if new_conv_response.status_code == 200:
            new_conv = new_conv_response.json()
            console.print(f"[green]✓ Created new conversation: {new_conv['title']}[/green]")
        else:
            console.print(f"[red]❌ Failed to create conversation: {new_conv_response.status_code}[/red]")
        
        console.print("\n[green]🎉 API tests completed successfully![/green]")
        
    except requests.exceptions.ConnectionError:
        console.print("[red]❌ Cannot connect to server. Make sure it's running on port 8001[/red]")
    except Exception as e:
        console.print(f"[red]❌ Test failed: {e}[/red]")

if __name__ == "__main__":
    test_api()
