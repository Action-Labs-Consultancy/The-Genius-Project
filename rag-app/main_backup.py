#!/usr/bin/env python3
"""
Local RAG Chatbot using Ollama, ChromaDB, and LangChain
Run this after ingesting documents with ingest.py
"""

import os
import sys
from pathlib import Path
from typing import List, Optional
import requests
import json
import hashlib
import time

# Simple in-memory cache
_response_cache = {}
_cache_timeout = 300  # 5 minutes

# Core imports
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain.schema import Document
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.prompt import Prompt

# Initialize rich console
console = Console()

class OllamaLLM:
    """Simple Ollama client for local LLM inference"""
    
    def __init__(self, model: str = "mistral", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.api_url = f"{base_url}/api/generate"
        
        # Check if Ollama is running
        self._check_ollama_connection()
    
    def _check_ollama_connection(self):
        """Check if Ollama is running and model is available"""
        try:
            # Test connection
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json()
                model_names = [m['name'] for m in models.get('models', [])]
                
                if self.model not in model_names and f"{self.model}:latest" not in model_names:
                    console.print(f"[red]❌ Model '{self.model}' not found![/red]")
                    console.print(f"Available models: {', '.join(model_names)}")
                    console.print(f"Run: [bold]ollama pull {self.model}[/bold]")
                    sys.exit(1)
                else:
                    console.print(f"[green]✓[/green] Connected to Ollama - Model: {self.model}")
            else:
                raise ConnectionError("Invalid response from Ollama")
                
        except Exception as e:
            console.print(f"[red]❌ Cannot connect to Ollama at {self.base_url}[/red]")
            console.print(f"Error: {e}")
            console.print("Make sure Ollama is running: [bold]ollama serve[/bold]")
            sys.exit(1)
    
    def generate(self, prompt: str, stream: bool = False) -> str:
        """Generate response from Ollama"""
        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": 0.1,
                "top_p": 0.7,
                "num_predict": 50,   # Very short responses for speed
                "num_ctx": 512,      # Very small context window
                "seed": 42,
                "repeat_penalty": 1.1,
                "top_k": 20,         # Further limit vocabulary
                "num_batch": 1,      # Process one token at a time for speed
                "num_gpu": 0,        # Force CPU for consistency
                "low_vram": True     # Optimize for low memory
            }
        }
        
        try:
            response = requests.post(
                self.api_url,
                json=data,
                timeout=60  # 60 second timeout for generation
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', 'No response generated')
            else:
                return f"Error: HTTP {response.status_code}"
                
        except Exception as e:
            return f"Error generating response: {e}"


class LocalRAGChatbot:
    """Local RAG Chatbot using ChromaDB and Ollama"""
    
    def __init__(self, persist_dir: str = "db", model: str = "mistral"):
        self.persist_dir = Path(persist_dir)
        
        # Initialize embeddings (same as used in ingestion)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        
        # Initialize Ollama LLM
        self.llm = OllamaLLM(model=model)
        
        # Load vector store
        self.vectorstore = self._load_vector_store()
        
        console.print(f"[green]✓[/green] RAG Chatbot initialized")
    
    def _load_vector_store(self) -> Chroma:
        """Load the persisted ChromaDB vector store"""
        if not self.persist_dir.exists():
            console.print(f"[red]❌ Vector store not found at {self.persist_dir}[/red]")
            console.print("Please run document ingestion first: [bold]python ingest.py[/bold]")
            sys.exit(1)
        
        try:
            vectorstore = Chroma(
                persist_directory=str(self.persist_dir),
                embedding_function=self.embeddings
            )
            
            # Test if vector store has data
            collection = vectorstore._collection
            count = collection.count()
            
            if count == 0:
                console.print(f"[red]❌ Vector store is empty![/red]")
                console.print("Please run document ingestion first: [bold]python ingest.py[/bold]")
                sys.exit(1)
            
            console.print(f"[green]✓[/green] Loaded vector store with {count} documents")
            return vectorstore
            
        except Exception as e:
            console.print(f"[red]❌ Error loading vector store: {e}[/red]")
            sys.exit(1)
    
    def retrieve_context(self, query: str, k: int = 1) -> List[Document]:  # Reduced from 2 to 1 for speed
        """Retrieve relevant documents for the query"""
        try:
            docs = self.vectorstore.similarity_search(query, k=k)
            return docs
        except Exception as e:
            console.print(f"[red]❌ Error retrieving documents: {e}[/red]")
            return []
    
    def create_prompt(self, query: str, context_docs: List[Document]) -> str:
        """Create prompt with context for the LLM"""
        if not context_docs:
            return f"""Answer the following question concisely:

Question: {query}

Answer:"""
        
        # Combine context from retrieved documents (limit length)
        context = "\n\n".join([doc.page_content[:200] for doc in context_docs])  # Very short context
        
        prompt = f"""Answer in 20 words or less based on this context:

{context}

Q: {query}
A:"""
        
        return prompt
    
    def chat(self, query: str) -> tuple[str, List[Document]]:
        """Process a chat query and return response with context"""
        # Check cache
        cache_key = hashlib.md5(query.encode()).hexdigest()
        cached_response = _response_cache.get(cache_key)
        
        if cached_response:
            timestamp, response, context_docs = cached_response
            if time.time() - timestamp < _cache_timeout:
                console.print("[dim]🔄 Using cached response...[/dim]")
                return response, context_docs
        
        # Simple fast responses for common questions
        _fast_responses = {
            "what is this about": "This is about customer service hours and procedures.",
            "hello": "Hello! I'm your RAG assistant. Ask me about your documents.",
            "hi": "Hi there! How can I help you with your documents today?",
            "help": "I can answer questions about your uploaded documents. Try asking about specific topics.",
            "what can you do": "I can search through your documents and answer questions about their content.",
        }

        def get_fast_response(query: str) -> Optional[str]:
            """Get a fast cached response for common queries"""
            query_lower = query.lower().strip()
            return _fast_responses.get(query_lower)

        # Check for fast response
        fast_response = get_fast_response(query)
        if fast_response:
            return fast_response, []
        
        # Retrieve relevant documents
        context_docs = self.retrieve_context(query)
        
        # Create prompt
        prompt = self.create_prompt(query, context_docs)
        
        # Generate response
        response = self.llm.generate(prompt)
        
        # Update cache
        _response_cache[cache_key] = (time.time(), response, context_docs)
        
        return response, context_docs
    
    def run_interactive(self):
        """Run interactive chat loop"""
        # Welcome message
        console.print(Panel.fit(
            "[bold blue]🤖 Local RAG Chatbot[/bold blue]\n"
            f"Model: {self.llm.model} | Vector Store: ChromaDB\n"
            "Type 'exit', 'quit', or 'q' to exit",
            border_style="blue"
        ))
        
        console.print("\n[dim]💡 Tips:[/dim]")
        console.print("[dim]• Ask questions about your uploaded documents[/dim]")
        console.print("[dim]• Type 'clear' to clear the screen[/dim]")
        console.print("[dim]• The system will show relevant context for each answer[/dim]")
        
        while True:
            console.print()
            
            # Get user input
            try:
                user_input = Prompt.ask("[bold green]You[/bold green]").strip()
            except KeyboardInterrupt:
                console.print("\n[yellow]Goodbye![/yellow]")
                break
            
            # Handle special commands
            if user_input.lower() in ['exit', 'quit', 'q']:
                console.print("[yellow]Goodbye![/yellow]")
                break
            elif user_input.lower() == 'clear':
                console.clear()
                continue
            elif not user_input:
                continue
            
            # Process query
            console.print("[dim]🔍 Searching knowledge base...[/dim]")
            
            try:
                response, context_docs = self.chat(user_input)
                
                # Display response
                console.print(f"\n[bold cyan]Assistant:[/bold cyan] {response}")
                
                # Show context sources (optional)
                if context_docs:
                    console.print(f"\n[dim]📚 Based on {len(context_docs)} relevant document(s)[/dim]")
                    
            except Exception as e:
                console.print(f"[red]❌ Error: {e}[/red]")


def main():
    """Main entry point"""
    console.print("[bold]🚀 Local RAG Chatbot[/bold]")
    
    # Check if vector store exists
    if not Path("db").exists():
        console.print("\n[yellow]⚠️  No vector database found![/yellow]")
        console.print("Please run document ingestion first:")
        console.print("[bold cyan]python ingest.py[/bold cyan]")
        return
    
    # Initialize and run chatbot
    try:
        chatbot = LocalRAGChatbot()
        chatbot.run_interactive()
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted by user[/yellow]")
    except Exception as e:
        console.print(f"[red]❌ Fatal error: {e}[/red]")


if __name__ == "__main__":
    main()

# TODO: Future Enhancements
# - Add FastAPI web interface: from fastapi import FastAPI
# - Add Streamlit UI: import streamlit as st
# - File upload functionality
# - Document metadata filtering
# - Chat history persistence
# - Multiple conversation threads
# - Advanced retrieval strategies (MMR, parent-child chunking)
# - Response caching
# - Multi-modal support (images, audio)
