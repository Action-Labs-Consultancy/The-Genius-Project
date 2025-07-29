"""
Enhanced AI Service Integration
Handles local Llama, OpenAI fallback, and proper Pinecone/MongoDB integration
"""
import os
import json
import requests
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import traceback

# Environment variables
LLAMA_API_URL = os.getenv('LLAMA_API_URL', 'http://localhost:8080')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME')
USE_MOCK_AI = os.getenv('USE_MOCK_AI', 'false').lower() == 'true'

# Import dependencies
try:
    import openai
    if OPENAI_API_KEY:
        openai.api_key = OPENAI_API_KEY
    OPENAI_AVAILABLE = bool(OPENAI_API_KEY)
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import pinecone
    from pinecone import Pinecone
    if PINECONE_API_KEY:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        if PINECONE_INDEX_NAME:
            index = pc.Index(PINECONE_INDEX_NAME)
    PINECONE_AVAILABLE = bool(PINECONE_API_KEY and PINECONE_INDEX_NAME)
except ImportError:
    PINECONE_AVAILABLE = False

try:
    from mongo_db import mongo
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

class AIService:
    """Unified AI service for local Llama and cloud services"""
    
    def __init__(self):
        self.llama_available = self._test_llama_connection()
        
    def _test_llama_connection(self):
        """Test if local Llama server is running"""
        try:
            response = requests.get(f"{LLAMA_API_URL}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def generate_text(self, prompt: str, system_prompt: str = "", max_tokens: int = 500, temperature: float = 0.7) -> str:
        """Generate text using available AI service"""
        
        # Try local Llama first (preferred)
        if self.llama_available:
            try:
                return self._call_llama(prompt, system_prompt, max_tokens, temperature)
            except Exception as e:
                print(f"[AI] Llama failed, trying fallback: {e}")
        
        # Fallback to OpenAI if available
        if OPENAI_AVAILABLE:
            try:
                return self._call_openai(prompt, system_prompt, max_tokens, temperature)
            except Exception as e:
                print(f"[AI] OpenAI failed: {e}")
        
        # Last resort: return structured template
        return self._generate_fallback_response(prompt)
    
    def _call_llama(self, prompt: str, system_prompt: str = "", max_tokens: int = 500, temperature: float = 0.7) -> str:
        """Call local Llama server"""
        full_prompt = f"{system_prompt}\n\nUser: {prompt}\nAssistant:"
        
        payload = {
            "prompt": full_prompt,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stop": ["\n\nUser:", "\n\nSystem:", "User:", "System:"],
            "stream": False
        }
        
        response = requests.post(
            f"{LLAMA_API_URL}/completion",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data.get('content', data.get('response', data.get('text', ''))).strip()
            # Clean up the response
            if content.startswith('Assistant:'):
                content = content[10:].strip()
            return content
        else:
            raise Exception(f"Llama API error: {response.status_code}")
    
    def _call_openai(self, prompt: str, system_prompt: str = "", max_tokens: int = 500, temperature: float = 0.7) -> str:
        """Call OpenAI API"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content
    
    def _generate_fallback_response(self, prompt: str) -> str:
        """Generate a basic response when AI services are unavailable"""
        return f"AI services are currently unavailable. Please review and customize this content: {prompt[:100]}..."

class PineconeService:
    """Enhanced Pinecone integration with proper embedding handling"""
    
    def __init__(self):
        self.available = PINECONE_AVAILABLE
        self.ai_service = AIService()
    
    def store_content(self, content: str, metadata: Dict[str, Any]) -> bool:
        """Store content in Pinecone with proper embeddings"""
        if not self.available:
            print("[PINECONE] Service not available")
            return False
        
        try:
            # Generate embedding
            embedding = self._get_embedding(content)
            if not embedding:
                return False
            
            # Prepare vector data
            vector_id = metadata.get('id', str(uuid.uuid4()))
            vector_data = {
                'id': vector_id,
                'values': embedding,
                'metadata': {
                    **metadata,
                    'content': content[:1000],  # Store truncated content in metadata
                    'timestamp': datetime.now().isoformat(),
                    'content_length': len(content)
                }
            }
            
            # Upsert to Pinecone
            index.upsert(vectors=[vector_data])
            print(f"[PINECONE] Stored content with ID: {vector_id}")
            return True
            
        except Exception as e:
            print(f"[PINECONE] Error storing content: {e}")
            return False
    
    def search_content(self, query: str, top_k: int = 5, filter_dict: Dict = None) -> List[Dict]:
        """Search for relevant content in Pinecone"""
        if not self.available:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self._get_embedding(query)
            if not query_embedding:
                return []
            
            # Search Pinecone
            results = index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            return [
                {
                    'id': match['id'],
                    'score': match['score'],
                    'content': match['metadata'].get('content', ''),
                    'metadata': match['metadata']
                }
                for match in results['matches']
            ]
            
        except Exception as e:
            print(f"[PINECONE] Error searching content: {e}")
            return []
    
    def _get_embedding(self, text: str) -> List[float]:
        """Generate embedding for text"""
        try:
            if OPENAI_AVAILABLE:
                # Use OpenAI embeddings
                response = openai.Embedding.create(
                    model="text-embedding-ada-002",
                    input=text
                )
                return response['data'][0]['embedding']
            else:
                # For now, return a placeholder embedding
                # In production, you'd use a local embedding model
                print("[PINECONE] Warning: Using placeholder embedding (no OpenAI key)")
                return [0.0] * 1536  # OpenAI ada-002 dimension
        except Exception as e:
            print(f"[PINECONE] Error generating embedding: {e}")
            return None

class MongoDBService:
    """Enhanced MongoDB service for marketing content"""
    
    def __init__(self):
        self.available = MONGODB_AVAILABLE
    
    def save_marketing_content(self, content_data: Dict[str, Any]) -> str:
        """Save marketing content to MongoDB"""
        if not self.available:
            print("[MONGODB] Service not available")
            return None
        
        try:
            collection = mongo.db.marketing_content
            
            # Add metadata
            content_data.update({
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'id': str(uuid.uuid4())
            })
            
            result = collection.insert_one(content_data)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"[MONGODB] Error saving content: {e}")
            return None
    
    def get_marketing_content(self, filters: Dict = None) -> List[Dict]:
        """Get marketing content from MongoDB"""
        if not self.available:
            return []
        
        try:
            collection = mongo.db.marketing_content
            cursor = collection.find(filters or {}).sort('created_at', -1)
            
            results = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                results.append(doc)
            
            return results
            
        except Exception as e:
            print(f"[MONGODB] Error retrieving content: {e}")
            return []

# Initialize services
ai_service = AIService()
pinecone_service = PineconeService()
mongodb_service = MongoDBService()

def get_ai_service():
    """Get the AI service instance"""
    return ai_service

def get_pinecone_service():
    """Get the Pinecone service instance"""
    return pinecone_service

def get_mongodb_service():
    """Get the MongoDB service instance"""
    return mongodb_service

# Service status check
def get_service_status():
    """Get status of all AI services"""
    return {
        'llama_available': ai_service.llama_available,
        'openai_available': OPENAI_AVAILABLE,
        'pinecone_available': PINECONE_AVAILABLE,
        'mongodb_available': MONGODB_AVAILABLE,
        'services_ready': ai_service.llama_available or OPENAI_AVAILABLE
    }
