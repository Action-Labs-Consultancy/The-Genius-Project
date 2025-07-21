#!/usr/bin/env python3
"""
Test script to verify RAG system upgrades
"""

import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel

console = Console()

def test_ollama_connection():
    """Test if Ollama is running with the right models"""
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json()
            model_names = [m['name'] for m in models.get('models', [])]
            
            console.print("[green]✓ Ollama is running[/green]")
            console.print(f"Available models: {', '.join(model_names)}")
            
            if 'llama3:latest' in model_names or 'llama3' in model_names:
                console.print("[green]✓ Llama3 model is available[/green]")
                return True
            else:
                console.print("[red]❌ Llama3 model not found[/red]")
                console.print("Run: ollama pull llama3")
                return False
        else:
            console.print("[red]❌ Ollama server error[/red]")
            return False
    except Exception as e:
        console.print(f"[red]❌ Cannot connect to Ollama: {e}[/red]")
        console.print("Make sure Ollama is running: ollama serve")
        return False

def test_vector_store():
    """Test if vector store exists and has data"""
    db_path = Path("db")
    if not db_path.exists():
        console.print("[red]❌ Vector store not found[/red]")
        console.print("Run: python ingest.py")
        return False
    
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        from langchain_chroma import Chroma
        
        embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        
        vectorstore = Chroma(
            persist_directory=str(db_path),
            embedding_function=embeddings
        )
        
        collection = vectorstore._collection
        count = collection.count()
        
        if count > 0:
            console.print(f"[green]✓ Vector store loaded with {count} documents[/green]")
            return True
        else:
            console.print("[red]❌ Vector store is empty[/red]")
            return False
            
    except Exception as e:
        console.print(f"[red]❌ Error loading vector store: {e}[/red]")
        return False

def test_chatbot_initialization():
    """Test if the upgraded chatbot can be initialized"""
    try:
        from main import LocalRAGChatbot
        
        console.print("[dim]Initializing chatbot with Llama3...[/dim]")
        chatbot = LocalRAGChatbot(model="llama3")
        
        console.print("[green]✓ Chatbot initialized successfully[/green]")
        console.print(f"Model: {chatbot.llm.model}")
        console.print(f"Memory: {len(chatbot.conversation_history)} items")
        
        return True, chatbot
        
    except Exception as e:
        console.print(f"[red]❌ Failed to initialize chatbot: {e}[/red]")
        return False, None

def test_chat_functionality(chatbot):
    """Test basic chat functionality"""
    try:
        console.print("\n[dim]Testing chat functionality...[/dim]")
        
        # Test fast response
        response, docs = chatbot.chat("hello")
        console.print(f"Fast response test: {response[:50]}...")
        
        # Test memory
        response2, docs2 = chatbot.chat("what did I just say?")
        console.print(f"Memory test: {response2[:50]}...")
        
        if len(chatbot.conversation_history) >= 2:
            console.print("[green]✓ Conversation memory working[/green]")
        
        console.print("[green]✓ Chat functionality working[/green]")
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Chat functionality error: {e}[/red]")
        return False

def main():
    """Run all tests"""
    console.print(Panel.fit(
        "[bold blue]🧪 RAG System Upgrade Tests[/bold blue]\n"
        "Testing Llama3 integration, memory, and improved features",
        border_style="blue"
    ))
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Ollama connection
    console.print("\n[bold]1. Testing Ollama Connection[/bold]")
    if test_ollama_connection():
        tests_passed += 1
    
    # Test 2: Vector store
    console.print("\n[bold]2. Testing Vector Store[/bold]")
    if test_vector_store():
        tests_passed += 1
    
    # Test 3: Chatbot initialization
    console.print("\n[bold]3. Testing Chatbot Initialization[/bold]")
    success, chatbot = test_chatbot_initialization()
    if success:
        tests_passed += 1
    
    # Test 4: Chat functionality (only if initialization succeeded)
    if success and chatbot:
        console.print("\n[bold]4. Testing Chat Functionality[/bold]")
        if test_chat_functionality(chatbot):
            tests_passed += 1
    else:
        console.print("\n[bold]4. Testing Chat Functionality[/bold]")
        console.print("[red]❌ Skipped due to initialization failure[/red]")
    
    # Summary
    console.print(f"\n[bold]Test Results: {tests_passed}/{total_tests} passed[/bold]")
    
    if tests_passed == total_tests:
        console.print(Panel.fit(
            "[bold green]🎉 All tests passed![/bold green]\n"
            "Your RAG system is upgraded and ready to use.\n"
            "Run: python main.py",
            border_style="green"
        ))
    else:
        console.print(Panel.fit(
            f"[bold yellow]⚠️ {total_tests - tests_passed} test(s) failed[/bold yellow]\n"
            "Please fix the issues above before using the system.",
            border_style="yellow"
        ))

if __name__ == "__main__":
    main()
