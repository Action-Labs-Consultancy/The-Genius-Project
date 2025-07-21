#!/usr/bin/env python3
"""
Ultra-Fast Local RAG Chatbot using Ollama, ChromaDB, and LangChain
Optimized for speed and intelligence with smart caching
"""

import os
import sys
import gc
from pathlib import Path
from typing import List, Optional
import requests
import json
import hashlib
import time
from datetime import datetime

# Import ultra-fast optimizations
try:
    from ultra_fast_config import (
        ULTRA_FAST_OLLAMA_OPTIONS, 
        ULTRA_FAST_RETRIEVAL, 
        ULTRA_FAST_PROMPTS,
        MEMORY_CONFIG
    )
    from ultra_fast_response import ultra_fast_system
    ULTRA_FAST_AVAILABLE = True
    print("🚀 Ultra-fast optimizations loaded!")
except ImportError:
    ULTRA_FAST_AVAILABLE = False
    print("⚠️ Ultra-fast optimizations not available")

# Import lightning-fast optimizations
try:
    from lightning_fast_config import (
        LIGHTNING_FAST_OLLAMA_OPTIONS,
        LIGHTNING_FAST_RETRIEVAL,
        LIGHTNING_FAST_PROMPTS
    )
    LIGHTNING_FAST_AVAILABLE = True
    print("⚡ Lightning-fast mode loaded!")
except ImportError:
    LIGHTNING_FAST_AVAILABLE = False
    print("⚠️ Lightning-fast mode not available")

# Legacy cache (kept for compatibility)
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
from rich.text import Text
from rich.prompt import Prompt

# Import advanced prompts
try:
    from advanced_prompts import AdvancedPromptTemplates, create_enhanced_prompt
    ADVANCED_PROMPTS_AVAILABLE = True
except ImportError:
    ADVANCED_PROMPTS_AVAILABLE = False
    console.print("[yellow]⚠️ Advanced prompts not available, using basic prompts[/yellow]")

# Import chat storage
try:
    from chat_storage import ChatStorage
    CHAT_STORAGE_AVAILABLE = True
except ImportError:
    CHAT_STORAGE_AVAILABLE = False
    console.print("[yellow]⚠️ Chat storage not available, using memory only[/yellow]")

# Initialize rich console
console = Console()

class OllamaLLM:
    """Simple Ollama client for local LLM inference"""
    
    def __init__(self, model: str = "llama3.2", base_url: str = "http://localhost:11434"):
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
    
    def generate(self, prompt: str, stream: bool = False, lightning_mode: bool = False) -> str:
        """Generate response from Ollama with ultra-fast optimizations"""
        start_time = time.time()
        
        # Use lightning-fast options if in lightning mode
        if lightning_mode and LIGHTNING_FAST_AVAILABLE:
            options = LIGHTNING_FAST_OLLAMA_OPTIONS
        elif ULTRA_FAST_AVAILABLE:
            options = ULTRA_FAST_OLLAMA_OPTIONS
        else:
            options = {
                "temperature": 0.3,      # Lower for faster responses
                "top_p": 0.7,           # More focused responses
                "num_predict": 256,      # Shorter responses for speed
                "num_ctx": 1024,        # Smaller context window for ultra-fast processing
                "seed": -1,             # Random seed for varied responses
                "repeat_penalty": 1.1,  # Less repetition
                "top_k": 15,            # Smaller vocabulary for speed
                "num_batch": 1024,      # Larger batch for efficiency
                "num_gpu": 1,           # Use GPU if available
                "low_vram": False,      # Don't restrict memory
                "num_thread": -1,       # Use all CPU threads
                "f16_kv": True,         # Use float16 for speed
                "use_mlock": True,      # Keep model in memory
                "mirostat": 2,          # Better response quality
                "mirostat_tau": 5.0,    # Target entropy
                "mirostat_eta": 0.1     # Learning rate
            }
        
        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": stream,
            "options": options
        }
        
        try:
            if stream:
                return self._generate_streaming(data)
            else:
                timeout = 15 if lightning_mode else 30  # Shorter timeout for lightning mode
                response = requests.post(
                    self.api_url,
                    json=data,
                    timeout=timeout
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get('response', 'No response generated')
                    
                    # Log response time if ultra-fast system is available
                    if ULTRA_FAST_AVAILABLE:
                        response_time = time.time() - start_time
                        ultra_fast_system.log_response_time(response_time)
                    
                    return response_text
                else:
                    return f"Error: HTTP {response.status_code}"
                
        except requests.exceptions.Timeout:
            return "Quick response: I can help with document questions and general conversation. Please try a more specific question."
        except Exception as e:
            return f"Connection issue. Please try again with a simpler question."
    
    def _generate_streaming(self, data: dict) -> str:
        """Generate streaming response"""
        try:
            response = requests.post(
                self.api_url,
                json=data,
                stream=True,
                timeout=60
            )
            
            if response.status_code != 200:
                return f"Error: HTTP {response.status_code}"
            
            full_response = ""
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode('utf-8'))
                        if 'response' in chunk:
                            chunk_text = chunk['response']
                            full_response += chunk_text
                            # For CLI, we can print incrementally
                            print(chunk_text, end='', flush=True)
                        if chunk.get('done', False):
                            break
                    except json.JSONDecodeError:
                        continue
            
            return full_response
            
        except Exception as e:
            return f"Streaming error: {e}"


class LocalRAGChatbot:
    """Local RAG Chatbot using ChromaDB and Ollama with conversation memory"""
    
    def __init__(self, persist_dir: str = "db", model: str = "llama3"):
        self.persist_dir = Path(persist_dir)
        self.conversation_history = []  # Memory for context
        self.max_history_length = 10   # Keep last 10 exchanges
        self.current_conversation_id = None  # Track current conversation
        
        # Initialize chat storage
        if CHAT_STORAGE_AVAILABLE:
            self.chat_storage = ChatStorage()
        else:
            self.chat_storage = None
        
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
    
    def get_fast_response(self, query: str) -> Optional[str]:
        """Get a fast cached response for common queries"""
        fast_responses = {
            # Greetings
            "hello": "Hello! I'm your intelligent RAG assistant. I can search through your documents or have general conversations. What would you like to know?",
            "hi": "Hi there! I'm here to help with document searches or general questions. How can I assist you today?",
            "hey": "Hey! Ready to help with your documents or any questions you have.",
            "good morning": "Good morning! How can I help you today?",
            "good afternoon": "Good afternoon! What can I do for you?",
            "good evening": "Good evening! How may I assist you?",
            
            # Help and capabilities
            "help": "I can: 1) Search through your uploaded documents for specific information, 2) Answer general questions, 3) Summarize document content, 4) Help with analysis and insights. What would you like to explore?",
            "what can you do": "I'm a smart RAG assistant that can search through your documents, answer questions about their content, provide summaries, and also handle general conversations. I'm designed to be helpful, accurate, and fast!",
            "how do you work": "I use advanced Retrieval-Augmented Generation (RAG) technology. When you ask about documents, I search through them using vector embeddings and provide accurate answers. For general questions, I use my language model capabilities.",
            
            # About the system
            "what is this about": "This is an intelligent document assistant powered by RAG technology. I can search through your uploaded documents and answer questions about their content with high accuracy.",
            "what is rag": "RAG stands for Retrieval-Augmented Generation. It combines document search with AI generation to provide accurate, context-aware answers based on your specific documents.",
            
            # General conversation starters
            "how are you": "I'm doing great and ready to help! I'm an AI assistant designed to be helpful with both document searches and general questions. What's on your mind?",
            "what's up": "I'm here and ready to assist! Whether you need help with documents or have general questions, I'm at your service.",
            "thanks": "You're welcome! Feel free to ask me anything about your documents or if you need any other assistance.",
            "thank you": "My pleasure! I'm always here to help with your documents or any questions you might have.",
            
            # Quick actions
            "clear": "Chat cleared! Ready for new questions.",
            "reset": "System reset! How can I help you?",
            
            # Common document questions - provide quick answers
            "business hours": "Based on your documents: Monday-Friday 9 AM - 6 PM, Saturday-Sunday Closed. (This is a quick response - ask for more details if needed)",
            "hours": "Business hours: Mon-Fri 9 AM - 6 PM, Weekends Closed. Need more specific information?",
            "when are you open": "We're open Monday through Friday, 9 AM to 6 PM. Closed on weekends.",
            "contact": "For detailed contact information, let me search through your documents. What specific contact details do you need?",
            "location": "The location appears to be in Manama, Bahrain based on your documents. Need the full address?",
            "password reset": "To reset your password: Go to the login page and click 'Forgot Password'. Need more detailed steps?",
            "support": "Support is available during business hours (9 AM - 6 PM, Mon-Fri). What kind of support do you need?",
        }
        query_lower = query.lower().strip()
        
        # Direct match first
        if query_lower in fast_responses:
            return fast_responses[query_lower]
        
        # Partial matches for flexibility
        for key, response in fast_responses.items():
            if key in query_lower or query_lower in key:
                return response
        
        return None
    
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
    
    def retrieve_context(self, query: str, k: int = None) -> List[Document]:
        """Retrieve relevant documents with ultra-fast optimization"""
        try:
            # Use ultra-fast settings if available
            if ULTRA_FAST_AVAILABLE:
                k = k or ULTRA_FAST_RETRIEVAL["k"]
                score_threshold = ULTRA_FAST_RETRIEVAL["score_threshold"]
                max_tokens = ULTRA_FAST_RETRIEVAL["max_tokens_per_doc"]
            else:
                k = k or 1  # Default to single best result for speed
                score_threshold = 0.85
                max_tokens = 300
            
            # Use similarity search with score threshold
            docs_with_scores = self.vectorstore.similarity_search_with_score(query, k=k)
            
            # Filter by relevance score and truncate content
            relevant_docs = []
            for doc, score in docs_with_scores:
                if score < 1.2:  # Lower is better for ChromaDB
                    # Truncate content for speed
                    if len(doc.page_content) > max_tokens:
                        doc.page_content = doc.page_content[:max_tokens] + "..."
                    relevant_docs.append(doc)
            
            # Return at least one result if we have any
            if not relevant_docs and docs_with_scores:
                doc, _ = docs_with_scores[0]
                if len(doc.page_content) > max_tokens:
                    doc.page_content = doc.page_content[:max_tokens] + "..."
                relevant_docs = [doc]
            
            return relevant_docs
            
        except Exception as e:
            console.print(f"[red]❌ Error retrieving documents: {e}[/red]")
            return []
    
    def create_prompt(self, query: str, context_docs: List[Document]) -> str:
        """Create prompt with context for the LLM including conversation history"""
        # Add conversation history for context
        history_context = ""
        if self.conversation_history:
            recent_history = self.conversation_history[-4:]  # Last 4 exchanges
            history_context = "\n".join([f"Human: {h['query']}\nAssistant: {h['response']}" for h in recent_history])
            history_context = f"\nPrevious conversation:\n{history_context}\n"
        
        if not context_docs:
            return f"""You are a helpful AI assistant. Be conversational and helpful.{history_context}

Question: {query}

Answer:"""
        
        # Combine context from retrieved documents with better length management
        context = "\n\n".join([doc.page_content[:400] for doc in context_docs])  # Increased context length
        
        prompt = f"""You are an intelligent document assistant. Answer based on the provided context and conversation history. Be accurate, helpful, and conversational.

Context from documents:
{context}{history_context}

Current question: {query}

Answer:"""
        
        return prompt
    
    def chat(self, query: str, mode: str = "auto") -> tuple[str, List[Document]]:
        """Process a chat query with ultra-fast optimizations"""
        start_time = time.time()
        
        # Lightning-fast mode for maximum speed
        if mode == "lightning":
            return self._lightning_fast_chat(query)
        
        # 1. Ultra-fast quick responses for common patterns
        if ULTRA_FAST_AVAILABLE:
            quick_response = ultra_fast_system.get_quick_response(query)
            if quick_response:
                console.print("[dim]⚡ Ultra-fast response![/dim]")
                self._add_to_history(query, quick_response, [])
                return quick_response, []
        
        # 2. Check ultra-fast cache first
        if ULTRA_FAST_AVAILABLE:
            cached_response = ultra_fast_system.get_cached_response(query, "")
            if cached_response:
                console.print("[dim]🚀 Cached response![/dim]")
                self._add_to_history(query, cached_response, [])
                return cached_response, []
        
        # 3. Legacy cache fallback
        cache_key = hashlib.md5(f"{query}_{mode}".encode()).hexdigest()
        cached_response = _response_cache.get(cache_key)
        
        if cached_response:
            timestamp, response, context_docs = cached_response
            if time.time() - timestamp < _cache_timeout:
                console.print("[dim]🔄 Legacy cache hit...[/dim]")
                self._add_to_history(query, response, context_docs)
                return response, context_docs
        
        # 4. Smart query processing
        is_document_query = self._is_document_question(query)
        context_docs = []
        
        if mode == "rag_only" or (mode == "auto" and is_document_query):
            # Ultra-fast document retrieval
            retrieval_config = ULTRA_FAST_RETRIEVAL if ULTRA_FAST_AVAILABLE else {"k": 1, "score_threshold": 0.85}
            context_docs = self.retrieve_context(query, k=retrieval_config["k"])
            
            if context_docs:
                # Use ultra-fast prompts
                if ULTRA_FAST_AVAILABLE:
                    context_text = "\n".join([doc.page_content[:300] for doc in context_docs])
                    prompt = ULTRA_FAST_PROMPTS["rag_template"].format(
                        context=context_text,
                        question=query
                    )
                else:
                    prompt = self.create_rag_prompt(query, context_docs)
            else:
                # No documents found - give quick general response
                if ULTRA_FAST_AVAILABLE:
                    prompt = ULTRA_FAST_PROMPTS["no_context_template"].format(question=query)
                else:
                    prompt = self.create_general_prompt(query, with_context="No relevant documents found.")
        else:
            # General conversation - use ultra-fast template
            if ULTRA_FAST_AVAILABLE:
                prompt = ULTRA_FAST_PROMPTS["no_context_template"].format(question=query)
            else:
                prompt = self.create_general_prompt(query)
        
        # 5. Generate response with timing
        response = self.llm.generate(prompt)
        
        # 6. Cache the response
        if ULTRA_FAST_AVAILABLE:
            ultra_fast_system.cache_response(query, "", response)
        
        _response_cache[cache_key] = (time.time(), response, context_docs)
        self._add_to_history(query, response, context_docs)
        
        # 7. Trigger garbage collection periodically
        if ULTRA_FAST_AVAILABLE and MEMORY_CONFIG["gc_frequency"] > 0:
            if ultra_fast_system.total_requests % MEMORY_CONFIG["gc_frequency"] == 0:
                gc.collect()
        
        return response, context_docs
    
    def _lightning_fast_chat(self, query: str) -> tuple[str, List[Document]]:
        """Lightning-fast chat with minimal processing for maximum speed"""
        start_time = time.time()
        
        # Quick pattern matching
        if LIGHTNING_FAST_AVAILABLE:
            query_lower = query.lower()
            for pattern, answer in LIGHTNING_FAST_PROMPTS["quick_answers"].items():
                if pattern in query_lower:
                    console.print("[dim]⚡ Lightning response![/dim]")
                    self._add_to_history(query, answer, [])
                    return answer, []
        
        # Minimal document retrieval
        context_docs = []
        if self._is_document_question(query):
            if LIGHTNING_FAST_AVAILABLE:
                context_docs = self.retrieve_context(query, k=LIGHTNING_FAST_RETRIEVAL["k"])
                if context_docs:
                    context_text = context_docs[0].page_content[:LIGHTNING_FAST_RETRIEVAL["max_tokens_per_doc"]]
                    prompt = LIGHTNING_FAST_PROMPTS["rag_template"].format(
                        context=context_text,
                        question=query
                    )
                else:
                    prompt = LIGHTNING_FAST_PROMPTS["no_context_template"].format(question=query)
            else:
                context_docs = self.retrieve_context(query, k=1)
                prompt = f"Q: {query}\nA:"
        else:
            prompt = LIGHTNING_FAST_PROMPTS["no_context_template"].format(question=query) if LIGHTNING_FAST_AVAILABLE else f"Q: {query}\nA:"
        
        # Generate with lightning-fast settings
        response = self.llm.generate(prompt, lightning_mode=True)
        
        self._add_to_history(query, response, context_docs)
        console.print(f"[dim]⚡ Lightning response in {time.time() - start_time:.2f}s[/dim]")
        
        return response, context_docs
    
    def _add_to_history(self, query: str, response: str, context_docs: List[Document] = None):
        """Add exchange to conversation history and persistent storage"""
        self.conversation_history.append({
            'query': query,
            'response': response,
            'timestamp': time.time()
        })
        
        # Keep only recent history
        if len(self.conversation_history) > self.max_history_length:
            self.conversation_history = self.conversation_history[-self.max_history_length:]
        
        # Save to persistent storage if available
        if self.chat_storage and self.current_conversation_id:
            sources = []
            if context_docs:
                for doc in context_docs:
                    source = doc.metadata.get('source', 'Unknown')
                    sources.append(Path(source).name if source != 'Unknown' else 'Unknown')
            
            self.chat_storage.save_message(
                self.current_conversation_id,
                query,
                response,
                list(set(sources))  # Remove duplicates
            )
    
    def _is_document_question(self, query: str) -> bool:
        """Determine if the query is asking about documents"""
        document_keywords = [
            'document', 'file', 'text', 'content', 'what does', 'according to',
            'mentioned', 'states', 'says', 'information', 'details', 'hours',
            'business', 'service', 'policy', 'procedure', 'guide', 'manual',
            'instructions', 'steps', 'how to', 'when', 'where', 'who', 'why'
        ]
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in document_keywords)
    
    def create_rag_prompt(self, query: str, context_docs: List[Document]) -> str:
        """Create prompt for document-based questions with advanced templates"""
        if ADVANCED_PROMPTS_AVAILABLE:
            # Use advanced prompt templates
            history_context = self._format_conversation_history()
            context = "\n\n".join([doc.page_content[:500] for doc in context_docs])
            
            return create_enhanced_prompt(
                "document",
                context=context,
                query=query,
                history=history_context
            )
        else:
            # Fallback to basic prompt
            history_context = ""
            if self.conversation_history:
                recent_history = self.conversation_history[-3:]
                history_context = "\n".join([f"Q: {h['query']}\nA: {h['response']}" for h in recent_history])
                history_context = f"\nRecent conversation:\n{history_context}\n"
            
            context = "\n".join([doc.page_content[:300] for doc in context_docs])  # Shorter context for speed
            
            prompt = f"""You are a smart AI assistant. Give concise, accurate answers based on the provided context.

Context:
{context}{history_context}

Q: {query}
A:"""
            return prompt
    
    def create_general_prompt(self, query: str, with_context: str = None) -> str:
        """Create prompt for general conversation with advanced templates"""
        if ADVANCED_PROMPTS_AVAILABLE:
            history_context = self._format_conversation_history()
            
            if with_context:
                # Add the context to the query
                enhanced_query = f"{query} (Note: {with_context})"
                return create_enhanced_prompt("general", query=enhanced_query, history=history_context)
            else:
                return create_enhanced_prompt("general", query=query, history=history_context)
        else:
            # Fallback to basic prompt
            history_context = ""
            if self.conversation_history:
                recent_history = self.conversation_history[-4:]
                history_context = "\n".join([f"Human: {h['query']}\nAssistant: {h['response']}" for h in recent_history])
                history_context = f"\nConversation history:\n{history_context}\n"
            
            if with_context:
                prompt = f"""You are a helpful AI assistant. {with_context}{history_context}

Current question: {query}
Assistant:"""
            else:
                prompt = f"""You are a helpful, friendly AI assistant. Provide thoughtful and detailed responses when appropriate.{history_context}

Current question: {query}
Assistant:"""
            return prompt
    
    def run_interactive(self):
        """Run interactive chat loop with optional streaming"""
        # Welcome message
        console.print(Panel.fit(
            "[bold blue]🤖 Local RAG Chatbot with Llama3[/bold blue]\n"
            f"Model: {self.llm.model} | Vector Store: ChromaDB\n"
            "Type 'exit', 'quit', or 'q' to exit\n"
            "Type 'stream on/off' to toggle streaming",
            border_style="blue"
        ))
        
        console.print("\n[dim]💡 Tips:[/dim]")
        console.print("[dim]• Ask questions about your uploaded documents[/dim]")
        console.print("[dim]• I can also have general conversations![/dim]")
        console.print("[dim]• Type 'clear' to clear the screen[/dim]")
        console.print("[dim]• I remember our conversation context[/dim]")
        console.print("[dim]• Type 'memory' to see conversation history[/dim]")
        console.print("[dim]• Type 'save' to save current conversation[/dim]")
        console.print("[dim]• Type 'load' to load a previous conversation[/dim]")
        console.print("[dim]• Type 'list' to see all saved conversations[/dim]")
        console.print("[dim]• Type 'new' to start a new conversation[/dim]")
        if ULTRA_FAST_AVAILABLE:
            console.print("[dim]• Type 'stats' to see performance statistics[/dim]")
        console.print()
        
        streaming_enabled = False
        
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
            elif user_input.lower().startswith('stream'):
                if 'on' in user_input.lower():
                    streaming_enabled = True
                    console.print("[green]✓ Streaming enabled[/green]")
                else:
                    streaming_enabled = False
                    console.print("[green]✓ Streaming disabled[/green]")
                continue
            elif user_input.lower() == 'stats' and ULTRA_FAST_AVAILABLE:
                # Show performance statistics
                stats = ultra_fast_system.get_performance_stats()
                console.print("\n[bold cyan]🚀 Ultra-Fast Performance Stats:[/bold cyan]")
                for key, value in stats.items():
                    console.print(f"  {key}: {value}")
                continue
            elif user_input.lower() == 'memory':
                if self.conversation_history:
                    console.print("\n[dim]� Recent conversation history:[/dim]")
                    for i, exchange in enumerate(self.conversation_history[-5:], 1):
                        console.print(f"[dim]{i}. Q: {exchange['query'][:50]}...[/dim]")
                        console.print(f"[dim]   A: {exchange['response'][:50]}...[/dim]")
                else:
                    console.print("[dim]No conversation history yet.[/dim]")
                continue
            elif user_input.lower() == 'save':
                self._save_current_conversation()
                continue
            elif user_input.lower() == 'load':
                self._load_conversation()
                continue
            elif user_input.lower() == 'list':
                self._list_conversations()
                continue
            elif user_input.lower() == 'new':
                self._start_new_conversation()
                continue
            elif user_input.lower() == 'export':
                self._export_conversation()
                continue
            elif not user_input:
                continue
            
            # Process query
            console.print("[dim]🔍 Processing your question...[/dim]")
            
            try:
                if streaming_enabled:
                    # For streaming, we need to modify the chat method
                    console.print(f"\n[bold cyan]Assistant:[/bold cyan] ", end="")
                    response, context_docs = self._chat_with_streaming(user_input)
                    console.print()  # New line after streaming
                else:
                    response, context_docs = self.chat(user_input)
                    # Display response
                    console.print(f"\n[bold cyan]Assistant:[/bold cyan] {response}")
                
                # Show context sources (optional)
                if context_docs:
                    console.print(f"\n[dim]📚 Based on {len(context_docs)} relevant document(s)[/dim]")
                    
            except Exception as e:
                console.print(f"[red]❌ Error: {e}[/red]")
    
    def _chat_with_streaming(self, query: str) -> tuple[str, List[Document]]:
        """Chat with streaming output"""
        # Check for fast response first
        fast_response = self.get_fast_response(query)
        if fast_response:
            # Simulate streaming for fast responses
            for word in fast_response.split():
                console.print(word + " ", end="")
                time.sleep(0.02)
            self._add_to_history(query, fast_response, [])
            return fast_response, []
        
        # For regular responses, get context first
        is_document_query = self._is_document_question(query)
        context_docs = []
        
        if is_document_query:
            context_docs = self.retrieve_context(query)
            prompt = self.create_rag_prompt(query, context_docs) if context_docs else self.create_general_prompt(query)
        else:
            prompt = self.create_general_prompt(query)
        
        # Generate with streaming
        response = self.llm.generate(prompt, stream=True)
        self._add_to_history(query, response, context_docs)
        
        return response, context_docs
    
    def _format_conversation_history(self) -> str:
        """Format conversation history for prompts"""
        if not self.conversation_history:
            return ""
        
        recent_history = self.conversation_history[-4:]  # Last 4 exchanges
        formatted_history = "\n".join([
            f"Human: {h['query']}\nAssistant: {h['response']}" 
            for h in recent_history
        ])
        return f"\nConversation History:\n{formatted_history}\n"
    
    def _save_current_conversation(self):
        """Save current conversation to persistent storage"""
        if not self.chat_storage:
            console.print("[yellow]⚠️ Chat storage not available[/yellow]")
            return
        
        if not self.conversation_history:
            console.print("[yellow]No conversation to save[/yellow]")
            return
        
        if self.current_conversation_id:
            console.print(f"[green]✓ Conversation already saved automatically[/green]")
            return
        
        # Create a new conversation
        title = Prompt.ask("Enter conversation title", default=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        conversation_id = self.chat_storage.create_conversation(title)
        
        if conversation_id:
            self.current_conversation_id = conversation_id
            
            # Save all current messages
            for exchange in self.conversation_history:
                self.chat_storage.save_message(
                    conversation_id,
                    exchange['query'],
                    exchange['response'],
                    []  # No context sources available from memory
                )
            
            console.print(f"[green]✓ Conversation saved as '{title}'[/green]")
        else:
            console.print("[red]❌ Failed to save conversation[/red]")
    
    def _load_conversation(self):
        """Load a conversation from persistent storage"""
        if not self.chat_storage:
            console.print("[yellow]⚠️ Chat storage not available[/yellow]")
            return
        
        conversations = self.chat_storage.get_conversations(20)
        if not conversations:
            console.print("[yellow]No saved conversations found[/yellow]")
            return
        
        console.print("\n[bold]📚 Saved Conversations:[/bold]")
        for i, conv in enumerate(conversations, 1):
            created = datetime.fromisoformat(conv['created_at']).strftime('%Y-%m-%d %H:%M')
            console.print(f"{i}. {conv['title']} ({conv['total_messages']} messages) - {created}")
        
        try:
            choice = int(Prompt.ask("\nEnter conversation number (0 to cancel)", default="0"))
            if choice == 0 or choice > len(conversations):
                return
            
            selected_conv = conversations[choice - 1]
            conversation = self.chat_storage.get_conversation(selected_conv['id'])
            
            if conversation:
                # Load conversation into memory
                self.conversation_history = []
                for msg in conversation.messages:
                    self.conversation_history.append({
                        'query': msg.user_message,
                        'response': msg.assistant_response,
                        'timestamp': datetime.fromisoformat(msg.timestamp).timestamp()
                    })
                
                self.current_conversation_id = conversation.id
                console.print(f"[green]✓ Loaded conversation '{conversation.title}' with {len(conversation.messages)} messages[/green]")
            else:
                console.print("[red]❌ Failed to load conversation[/red]")
                
        except (ValueError, IndexError):
            console.print("[red]Invalid selection[/red]")
    
    def _list_conversations(self):
        """List all saved conversations"""
        if not self.chat_storage:
            console.print("[yellow]⚠️ Chat storage not available[/yellow]")
            return
        
        conversations = self.chat_storage.get_conversations(50)
        if not conversations:
            console.print("[yellow]No saved conversations found[/yellow]")
            return
        
        console.print("\n[bold]📚 All Saved Conversations:[/bold]")
        for conv in conversations:
            created = datetime.fromisoformat(conv['created_at']).strftime('%Y-%m-%d %H:%M')
            updated = datetime.fromisoformat(conv['updated_at']).strftime('%Y-%m-%d %H:%M')
            console.print(f"• [bold]{conv['title']}[/bold]")
            console.print(f"  {conv['total_messages']} messages | Created: {created} | Updated: {updated}")
            console.print()
    
    def _start_new_conversation(self):
        """Start a new conversation"""
        if self.conversation_history and self.chat_storage:
            save_current = Prompt.ask("Save current conversation before starting new one? (y/n)", default="y")
            if save_current.lower() == 'y':
                self._save_current_conversation()
        
        # Clear current conversation
        self.conversation_history = []
        self.current_conversation_id = None
        console.print("[green]✓ Started new conversation[/green]")
    
    def _export_conversation(self):
        """Export current or selected conversation"""
        if not self.chat_storage:
            console.print("[yellow]⚠️ Chat storage not available[/yellow]")
            return
        
        if self.current_conversation_id:
            # Export current conversation
            format_choice = Prompt.ask("Export format (json/txt)", default="txt")
            filepath = self.chat_storage.export_conversation(self.current_conversation_id, format_choice)
            if filepath:
                console.print(f"[green]✓ Conversation exported to {filepath}[/green]")
            else:
                console.print("[red]❌ Export failed[/red]")
        else:
            console.print("[yellow]No current conversation to export. Use 'load' first.[/yellow]")


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
