#!/usr/bin/env python3
"""
FastAPI Web Interface for Local RAG Chatbot
Provides REST API endpoints and web chat interface
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio
import uvicorn
from pathlib import Path
import os
from datetime import datetime

# Set working directory to the script location
script_dir = Path(__file__).parent
os.chdir(script_dir)

# Import our RAG system
from main import LocalRAGChatbot

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    success = initialize_chatbot()
    if not success:
        print("Warning: Chatbot initialization failed")
    yield
    # Shutdown (if needed)

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Local RAG Chatbot API",
    description="A local RAG chatbot with web interface",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for web interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:8000",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the RAG chatbot
chatbot = None

def initialize_chatbot():
    """Initialize the RAG chatbot with ultra-fast Llama3.2 optimizations"""
    global chatbot
    try:
        print("🚀 Initializing ultra-fast RAG chatbot...")
        chatbot = LocalRAGChatbot(model="llama3.2")  # Use ultra-fast Llama3.2
        
        # Import ultra-fast optimizations if available
        try:
            from ultra_fast_response import ultra_fast_system
            print("⚡ Ultra-fast optimizations loaded!")
        except ImportError:
            print("⚠️ Ultra-fast optimizations not available")
        
        print("✅ Ultra-fast chatbot ready!")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize chatbot: {e}")
        return False

# Pydantic models for API
class ChatMessage(BaseModel):
    message: str
    mode: Optional[str] = "auto"  # "auto", "rag_only", "general"
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7

class FastChatMessage(BaseModel):
    message: str
    mode: Optional[str] = "auto"  # "auto", "rag_only", "general"

class ChatResponse(BaseModel):
    response: str
    sources: List[str]
    processing_time: float

class FastChatResponse(BaseModel):
    response: str
    processing_time: float

class SystemStatus(BaseModel):
    status: str
    vector_db_count: int
    model: str
    ready: bool

# OpenAI-compatible endpoint for general chat
class OpenAIMessage(BaseModel):
    role: str
    content: str

class OpenAIChatRequest(BaseModel):
    model: str
    messages: List[OpenAIMessage]
    max_tokens: Optional[int] = 500
    temperature: Optional[float] = 0.7

class OpenAIChatResponse(BaseModel):
    choices: List[dict]

# Chat storage models for API
class ConversationRequest(BaseModel):
    title: str

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    total_messages: int

class MessageResponse(BaseModel):
    user_message: str
    assistant_response: str
    context_sources: List[str]
    timestamp: str

class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    created_at: str
    total_messages: int
    messages: List[MessageResponse]

# API Routes
@app.get("/")
async def root():
    """Serve the main chat interface"""
    from fastapi import Response
    import os
    from datetime import datetime
    
    # Add cache-busting headers
    response = FileResponse('static/chat.html')
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Last-Modified"] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    return response

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "ready": chatbot is not None}

@app.get("/status", response_model=SystemStatus)
async def get_status():
    """Get system status"""
    if not chatbot:
        return SystemStatus(
            status="error",
            vector_db_count=0,
            model="none",
            ready=False
        )
    
    try:
        # Get document count from vector store
        collection = chatbot.vectorstore._collection
        count = collection.count()
        
        return SystemStatus(
            status="ready",
            vector_db_count=count,
            model=chatbot.llm.model,
            ready=True
        )
    except Exception as e:
        return SystemStatus(
            status="error",
            vector_db_count=0,
            model="unknown",
            ready=False
        )

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(message: ChatMessage):
    """Chat with the RAG system"""
    if not chatbot:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    
    try:
        import time
        start_time = time.time()
        
        # Create new conversation if none exists
        if not chatbot.current_conversation_id and chatbot.chat_storage:
            from datetime import datetime
            title = f"Web Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            chatbot.current_conversation_id = chatbot.chat_storage.create_conversation(title)
        
        # Get response from chatbot with mode
        response, context_docs = chatbot.chat(message.message, message.mode)
        
        # Extract source information
        sources = []
        for doc in context_docs:
            source = doc.metadata.get('source', 'Unknown')
            sources.append(Path(source).name if source != 'Unknown' else 'Unknown')
        
        processing_time = time.time() - start_time
        
        return ChatResponse(
            response=response,
            sources=list(set(sources)),  # Remove duplicates
            processing_time=round(processing_time, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/chat/fast", response_model=FastChatResponse)
async def fast_chat_endpoint(message: FastChatMessage):
    """Fast chat endpoint optimized for speed (no source tracking)"""
    if not chatbot:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    
    try:
        import time
        start_time = time.time()
        
        # Get response from chatbot with mode (only response, skip context tracking)
        response, _ = chatbot.chat(message.message, message.mode)
        
        processing_time = time.time() - start_time
        
        return FastChatResponse(
            response=response,
            processing_time=round(processing_time, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/chat/ultra-fast", response_model=FastChatResponse)
async def ultra_fast_chat_endpoint(message: FastChatMessage):
    """Ultra-fast chat endpoint with aggressive optimizations"""
    if not chatbot:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    
    try:
        import time
        start_time = time.time()
        
        # Try ultra-fast response first
        try:
            from ultra_fast_response import ultra_fast_system
            
            # Check for instant responses
            quick_response = ultra_fast_system.get_quick_response(message.message)
            if quick_response:
                processing_time = time.time() - start_time
                return FastChatResponse(
                    response=quick_response,
                    processing_time=round(processing_time, 3)
                )
            
            # Check cache
            cached_response = ultra_fast_system.get_cached_response(message.message, "")
            if cached_response:
                processing_time = time.time() - start_time
                return FastChatResponse(
                    response=cached_response,
                    processing_time=round(processing_time, 3)
                )
        except ImportError:
            pass  # Fall back to regular processing
        
        # Regular ultra-fast processing
        response, _ = chatbot.chat(message.message, message.mode)
        
        processing_time = time.time() - start_time
        
        return FastChatResponse(
            response=response,
            processing_time=round(processing_time, 3)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/chat/lightning", response_model=FastChatResponse)
async def lightning_fast_chat_endpoint(message: FastChatMessage):
    """Lightning-fast chat endpoint with extreme optimizations for maximum speed"""
    if not chatbot:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    
    try:
        import time
        start_time = time.time()
        
        # Use lightning mode for maximum speed
        response, _ = chatbot.chat(message.message, mode="lightning")
        
        processing_time = time.time() - start_time
        
        return FastChatResponse(
            response=response,
            processing_time=round(processing_time, 3)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.get("/stats")
async def get_performance_stats():
    """Get ultra-fast performance statistics"""
    try:
        from ultra_fast_response import ultra_fast_system
        stats = ultra_fast_system.get_performance_stats()
        return {"status": "success", "stats": stats}
    except ImportError:
        return {"status": "error", "message": "Ultra-fast system not available"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# OpenAI-compatible chat endpoint using our RAG system
@app.post("/v1/chat/completions", response_model=OpenAIChatResponse)
async def openai_chat_endpoint(request: OpenAIChatRequest):
    """OpenAI-compatible chat endpoint using our RAG system"""
    if not chatbot:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    
    try:
        # Get the last user message
        user_messages = [msg for msg in request.messages if msg.role == "user"]
        if not user_messages:
            raise HTTPException(status_code=400, detail="No user message found")
        
        last_message = user_messages[-1].content
        
        # Use general mode for this endpoint
        response, _ = chatbot.chat(last_message, mode="general")
        
        return OpenAIChatResponse(
            choices=[{
                "message": {
                    "role": "assistant",
                    "content": response
                },
                "finish_reason": "stop",
                "index": 0
            }]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# WebSocket for real-time chat
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    
    if not chatbot:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Chatbot not initialized"
        }))
        await websocket.close()
        return
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat":
                user_message = message_data.get("message", "")
                
                # Create new conversation if none exists
                if not chatbot.current_conversation_id and chatbot.chat_storage:
                    from datetime import datetime
                    title = f"Web Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                    chatbot.current_conversation_id = chatbot.chat_storage.create_conversation(title)
                
                # Send typing indicator
                await websocket.send_text(json.dumps({
                    "type": "typing",
                    "message": "🔍 Searching knowledge base..."
                }))
                
                # Get response from chatbot
                response, context_docs = chatbot.chat(user_message)
                
                # Extract sources
                sources = []
                for doc in context_docs:
                    source = doc.metadata.get('source', 'Unknown')
                    sources.append(Path(source).name if source != 'Unknown' else 'Unknown')
                
                # Send response
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "message": response,
                    "sources": list(set(sources)),
                    "context_count": len(context_docs),
                    "conversation_id": chatbot.current_conversation_id
                }))
            
            elif message_data.get("type") == "load_conversation":
                conversation_id = message_data.get("conversation_id")
                if conversation_id and chatbot.chat_storage:
                    try:
                        conversation = chatbot.chat_storage.get_conversation(conversation_id)
                        if conversation:
                            # Load conversation into memory
                            chatbot.conversation_history = []
                            for msg in conversation.messages:
                                chatbot.conversation_history.append({
                                    'query': msg.user_message,
                                    'response': msg.assistant_response,
                                    'timestamp': datetime.fromisoformat(msg.timestamp).timestamp()
                                })
                            
                            chatbot.current_conversation_id = conversation.id
                            
                            await websocket.send_text(json.dumps({
                                "type": "conversation_loaded",
                                "conversation": {
                                    "id": conversation.id,
                                    "title": conversation.title,
                                    "messages": [
                                        {
                                            "user_message": msg.user_message,
                                            "assistant_response": msg.assistant_response,
                                            "context_sources": msg.context_sources,
                                            "timestamp": msg.timestamp
                                        }
                                        for msg in conversation.messages
                                    ]
                                }
                            }))
                        else:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "message": "Conversation not found"
                            }))
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": f"Failed to load conversation: {str(e)}"
                        }))
            
            elif message_data.get("type") == "new_conversation":
                # Start new conversation
                chatbot.conversation_history = []
                chatbot.current_conversation_id = None
                
                await websocket.send_text(json.dumps({
                    "type": "conversation_cleared",
                    "message": "Started new conversation"
                }))
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Error: {str(e)}"
        }))

# Add streaming response model
class StreamingChatMessage(BaseModel):
    message: str
    mode: Optional[str] = "auto"

# Add streaming endpoint
@app.post("/chat/stream")
async def stream_chat_endpoint(message: StreamingChatMessage):
    """Streaming chat endpoint using Server-Sent Events"""
    if not chatbot:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    
    async def generate_stream():
        try:
            # For now, simulate streaming by chunking the response
            # In a full implementation, we'd modify the LLM to truly stream
            response, context_docs = chatbot.chat(message.message, message.mode)
            
            # Send metadata first
            sources = []
            for doc in context_docs:
                source = doc.metadata.get('source', 'Unknown')
                sources.append(Path(source).name if source != 'Unknown' else 'Unknown')
            
            yield f"data: {json.dumps({'type': 'sources', 'sources': list(set(sources))})}\n\n"
            
            # Simulate streaming by sending response in chunks
            words = response.split()
            for i, word in enumerate(words):
                chunk_data = {
                    'type': 'chunk',
                    'content': word + ' ',
                    'done': False
                }
                yield f"data: {json.dumps(chunk_data)}\n\n"
                await asyncio.sleep(0.05)  # Small delay for streaming effect
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done', 'done': True})}\n\n"
            
        except Exception as e:
            error_data = {'type': 'error', 'message': str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )

# Chat storage API endpoints
@app.get("/api/conversations", response_model=List[ConversationResponse])
async def get_conversations():
    """Get list of saved conversations"""
    if not chatbot or not chatbot.chat_storage:
        raise HTTPException(status_code=503, detail="Chat storage not available")
    
    try:
        conversations = chatbot.chat_storage.get_conversations(limit=50)
        return [
            ConversationResponse(
                id=conv['id'],
                title=conv['title'],
                created_at=conv['created_at'],
                total_messages=conv['total_messages']
            )
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversations: {str(e)}")

@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(request: ConversationRequest):
    """Create a new conversation"""
    if not chatbot or not chatbot.chat_storage:
        raise HTTPException(status_code=503, detail="Chat storage not available")
    
    try:
        conversation_id = chatbot.chat_storage.create_conversation(request.title)
        if conversation_id:
            # Get the created conversation details
            conversations = chatbot.chat_storage.get_conversations(limit=1)
            if conversations:
                conv = conversations[0]  # Most recent one
                return ConversationResponse(
                    id=conv['id'],
                    title=conv['title'],
                    created_at=conv['created_at'],
                    total_messages=conv['total_messages']
                )
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")

@app.get("/api/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(conversation_id: str):
    """Get conversation details with messages"""
    if not chatbot or not chatbot.chat_storage:
        raise HTTPException(status_code=503, detail="Chat storage not available")
    
    try:
        conversation = chatbot.chat_storage.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        messages = [
            MessageResponse(
                user_message=msg.user_message,
                assistant_response=msg.assistant_response,
                context_sources=msg.context_sources,
                timestamp=msg.timestamp
            )
            for msg in conversation.messages
        ]
        
        return ConversationDetailResponse(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at,
            total_messages=conversation.total_messages,
            messages=messages
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")

@app.post("/api/conversations/{conversation_id}/load")
async def load_conversation(conversation_id: str):
    """Load a conversation into the current chat session"""
    if not chatbot or not chatbot.chat_storage:
        raise HTTPException(status_code=503, detail="Chat storage not available")
    
    try:
        conversation = chatbot.chat_storage.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Load conversation into chatbot memory
        chatbot.conversation_history = []
        for msg in conversation.messages:
            chatbot.conversation_history.append({
                'query': msg.user_message,
                'response': msg.assistant_response,
                'timestamp': datetime.fromisoformat(msg.timestamp).timestamp()
            })
        
        chatbot.current_conversation_id = conversation.id
        
        return {"status": "success", "message": f"Loaded conversation '{conversation.title}'"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load conversation: {str(e)}")

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    if not chatbot or not chatbot.chat_storage:
        raise HTTPException(status_code=503, detail="Chat storage not available")
    
    try:
        success = chatbot.chat_storage.delete_conversation(conversation_id)
        if success:
            return {"status": "success", "message": "Conversation deleted"}
        else:
            raise HTTPException(status_code=404, detail="Conversation not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")

@app.post("/api/conversations/new")
async def start_new_conversation():
    """Start a new conversation (clear current session)"""
    if not chatbot:
        raise HTTPException(status_code=503, detail="Chatbot not available")
    
    try:
        # Clear current conversation
        chatbot.conversation_history = []
        chatbot.current_conversation_id = None
        
        return {"status": "success", "message": "Started new conversation"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start new conversation: {str(e)}")

@app.get("/api/conversations/{conversation_id}/export")
async def export_conversation(conversation_id: str, format: str = "json"):
    """Export a conversation to file"""
    if not chatbot or not chatbot.chat_storage:
        raise HTTPException(status_code=503, detail="Chat storage not available")
    
    try:
        filepath = chatbot.chat_storage.export_conversation(conversation_id, format)
        if filepath:
            return FileResponse(
                path=filepath,
                filename=Path(filepath).name,
                media_type='application/octet-stream'
            )
        else:
            raise HTTPException(status_code=404, detail="Conversation not found or export failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export conversation: {str(e)}")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    # Create static directory if it doesn't exist
    Path("static").mkdir(exist_ok=True)
    
    print("🚀 Starting Local RAG Chatbot Web Server")
    print("📱 Web interface will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False
    )
