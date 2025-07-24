"""
AI-Powered Semantic Memory Layer using Pinecone
Vector storage and retrieval for intelligent project management
"""

import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from pinecone import Pinecone
import openai
from sentence_transformers import SentenceTransformer
import tiktoken
import numpy as np
import json

class SemanticMemoryEngine:
    """Core semantic memory engine for AI-powered project management"""
    
    def __init__(self, pinecone_api_key: str = None, openai_api_key: str = None):
        # Initialize Pinecone
        self.pc = Pinecone(api_key=pinecone_api_key or os.getenv("PINECONE_API_KEY"))
        self.index = self.pc.Index("genius-project-index")
        
        # Initialize embedding models
        self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize OpenAI for advanced embeddings (if available)
        if openai_api_key or os.getenv("OPENAI_API_KEY"):
            openai.api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
            self.openai_available = True
        else:
            self.openai_available = False
        
        # Tokenizer for text processing
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Namespace mappings for different content types
        self.namespaces = {
            "tasks": "tasks",
            "documents": "documents", 
            "comments": "comments",
            "reports": "reports",
            "workflows": "workflows",
            "projects": "projects",
            "performance": "performance"
        }
    
    def get_embedding(self, text: str, model: str = "sentence_transformer") -> List[float]:
        """Generate embeddings using specified model"""
        if model == "openai" and self.openai_available:
            try:
                response = openai.Embedding.create(
                    input=text,
                    model="text-embedding-ada-002"
                )
                return response['data'][0]['embedding']
            except Exception as e:
                print(f"OpenAI embedding failed, falling back to sentence transformer: {e}")
                model = "sentence_transformer"
        
        if model == "sentence_transformer":
            embedding = self.sentence_transformer.encode(text)
            # Pad or truncate to 1536 dimensions to match Pinecone index
            if len(embedding) < 1536:
                # Pad with zeros
                padded = np.zeros(1536)
                padded[:len(embedding)] = embedding
                return padded.tolist()
            else:
                # Truncate to 1536
                return embedding[:1536].tolist()
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks for better context preservation"""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundaries
            if end < len(text):
                # Look for sentence endings near the chunk boundary
                for i in range(end - 100, end + 100):
                    if i < len(text) and text[i] in '.!?':
                        end = i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks

class TaskMemory(SemanticMemoryEngine):
    """Semantic memory for task-related content"""
    
    def store_task(self, task_id: str, task_data: Dict[str, Any], 
                   user_id: str, project_id: str = None) -> List[str]:
        """Store task information in semantic memory"""
        vectors_stored = []
        
        # Combine task title and description for embedding
        task_text = f"Title: {task_data.get('title', '')}\n"
        task_text += f"Description: {task_data.get('description', '')}\n"
        
        if task_data.get('objectives'):
            task_text += f"Objectives: {'; '.join(task_data['objectives'])}\n"
        
        if task_data.get('requirements'):
            task_text += f"Requirements: {task_data['requirements']}\n"
        
        # Chunk the text if it's too long
        chunks = self.chunk_text(task_text)
        
        for i, chunk in enumerate(chunks):
            vector_id = f"task_{task_id}_chunk_{i}"
            embedding = self.get_embedding(chunk)
            
            metadata = {
                "type": "task",
                "task_id": task_id,
                "user_id": user_id,
                "project_id": project_id,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "title": task_data.get('title', ''),
                "priority": task_data.get('priority', 'medium'),
                "status": task_data.get('status', 'todo'),
                "tags": task_data.get('tags', []),
                "timestamp": datetime.utcnow().isoformat(),
                "content_type": "task_description"
            }
            
            # Store in Pinecone
            self.index.upsert(
                vectors=[(vector_id, embedding, metadata)],
                namespace=self.namespaces["tasks"]
            )
            
            vectors_stored.append(vector_id)
        
        return vectors_stored
    
    def update_task_status(self, task_id: str, new_status: str, 
                          notes: str = None, user_id: str = None):
        """Update task status and store status change in semantic memory"""
        if notes:
            # Store status change notes as semantic memory
            status_text = f"Task status changed to: {new_status}\nNotes: {notes}"
            vector_id = f"task_{task_id}_status_{datetime.utcnow().timestamp()}"
            embedding = self.get_embedding(status_text)
            
            metadata = {
                "type": "task_status_change",
                "task_id": task_id,
                "user_id": user_id,
                "status": new_status,
                "timestamp": datetime.utcnow().isoformat(),
                "content_type": "status_update"
            }
            
            self.index.upsert(
                vectors=[(vector_id, embedding, metadata)],
                namespace=self.namespaces["tasks"]
            )
    
    def find_similar_tasks(self, query: str, project_id: str = None, 
                          top_k: int = 10) -> List[Dict]:
        """Find tasks similar to the query using semantic search"""
        query_embedding = self.get_embedding(query)
        
        filter_conditions = {"type": "task"}
        if project_id:
            filter_conditions["project_id"] = project_id
        
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            filter=filter_conditions,
            namespace=self.namespaces["tasks"],
            include_metadata=True
        )
        
        return [
            {
                "task_id": match.metadata["task_id"],
                "title": match.metadata.get("title", ""),
                "similarity_score": match.score,
                "status": match.metadata.get("status", ""),
                "priority": match.metadata.get("priority", ""),
                "metadata": match.metadata
            }
            for match in results.matches
        ]

class DocumentMemory(SemanticMemoryEngine):
    """Semantic memory for document and RAG content"""
    
    def store_document(self, document_id: str, content: str, metadata: Dict[str, Any]) -> List[str]:
        """Store document content in semantic memory with RAG capabilities"""
        vectors_stored = []
        
        # Chunk the document content
        chunks = self.chunk_text(content, chunk_size=1000, overlap=200)
        
        for i, chunk in enumerate(chunks):
            vector_id = f"doc_{document_id}_chunk_{i}"
            embedding = self.get_embedding(chunk)
            
            chunk_metadata = {
                "type": "document",
                "document_id": document_id,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "filename": metadata.get("filename", ""),
                "file_type": metadata.get("file_type", ""),
                "project_id": metadata.get("project_id"),
                "task_id": metadata.get("task_id"),
                "user_id": metadata.get("uploaded_by"),
                "tags": metadata.get("tags", []),
                "timestamp": datetime.utcnow().isoformat(),
                "content_type": "document_chunk",
                "content_preview": chunk[:200] + "..." if len(chunk) > 200 else chunk
            }
            
            self.index.upsert(
                vectors=[(vector_id, embedding, chunk_metadata)],
                namespace=self.namespaces["documents"]
            )
            
            vectors_stored.append(vector_id)
        
        return vectors_stored
    
    def search_documents(self, query: str, project_id: str = None, 
                        task_id: str = None, file_type: str = None, 
                        top_k: int = 10) -> List[Dict]:
        """Search documents using semantic similarity"""
        query_embedding = self.get_embedding(query)
        
        filter_conditions = {"type": "document"}
        if project_id:
            filter_conditions["project_id"] = project_id
        if task_id:
            filter_conditions["task_id"] = task_id
        if file_type:
            filter_conditions["file_type"] = file_type
        
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            filter=filter_conditions,
            namespace=self.namespaces["documents"],
            include_metadata=True
        )
        
        return [
            {
                "document_id": match.metadata["document_id"],
                "filename": match.metadata.get("filename", ""),
                "similarity_score": match.score,
                "content_preview": match.metadata.get("content_preview", ""),
                "chunk_index": match.metadata["chunk_index"],
                "metadata": match.metadata
            }
            for match in results.matches
        ]

class CommentMemory(SemanticMemoryEngine):
    """Semantic memory for comments and discussions"""
    
    def store_comment(self, comment_id: str, comment_data: Dict[str, Any]) -> str:
        """Store comment in semantic memory for discussion analysis"""
        vector_id = f"comment_{comment_id}"
        embedding = self.get_embedding(comment_data["content"])
        
        metadata = {
            "type": "comment",
            "comment_id": comment_id,
            "user_id": comment_data["user_id"],
            "project_id": comment_data.get("project_id"),
            "task_id": comment_data.get("task_id"),
            "parent_comment_id": comment_data.get("parent_comment_id"),
            "sentiment": comment_data.get("sentiment"),
            "tags": comment_data.get("tags", []),
            "timestamp": datetime.utcnow().isoformat(),
            "content_type": "comment",
            "content_preview": comment_data["content"][:200]
        }
        
        self.index.upsert(
            vectors=[(vector_id, embedding, metadata)],
            namespace=self.namespaces["comments"]
        )
        
        return vector_id
    
    def find_related_discussions(self, query: str, project_id: str = None, 
                               top_k: int = 10) -> List[Dict]:
        """Find related discussions and comments"""
        query_embedding = self.get_embedding(query)
        
        filter_conditions = {"type": "comment"}
        if project_id:
            filter_conditions["project_id"] = project_id
        
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            filter=filter_conditions,
            namespace=self.namespaces["comments"],
            include_metadata=True
        )
        
        return [
            {
                "comment_id": match.metadata["comment_id"],
                "user_id": match.metadata["user_id"],
                "similarity_score": match.score,
                "content_preview": match.metadata.get("content_preview", ""),
                "timestamp": match.metadata["timestamp"],
                "metadata": match.metadata
            }
            for match in results.matches
        ]

class PerformanceMemory(SemanticMemoryEngine):
    """Semantic memory for performance reports and analytics"""
    
    def store_performance_report(self, report_id: str, report_data: Dict[str, Any]) -> str:
        """Store performance reports for AI analysis"""
        # Create a comprehensive text representation of the report
        report_text = f"Performance Report: {report_data.get('title', '')}\n"
        report_text += f"Summary: {report_data.get('summary', '')}\n"
        
        if report_data.get('metrics'):
            report_text += "Metrics:\n"
            for metric, value in report_data['metrics'].items():
                report_text += f"- {metric}: {value}\n"
        
        if report_data.get('insights'):
            report_text += f"Insights: {report_data['insights']}\n"
        
        if report_data.get('recommendations'):
            report_text += f"Recommendations: {report_data['recommendations']}\n"
        
        vector_id = f"report_{report_id}"
        embedding = self.get_embedding(report_text)
        
        metadata = {
            "type": "performance_report",
            "report_id": report_id,
            "user_id": report_data.get("created_by"),
            "project_id": report_data.get("project_id"),
            "report_type": report_data.get("report_type", "general"),
            "time_period": report_data.get("time_period"),
            "tags": report_data.get("tags", []),
            "timestamp": datetime.utcnow().isoformat(),
            "content_type": "performance_report"
        }
        
        self.index.upsert(
            vectors=[(vector_id, embedding, metadata)],
            namespace=self.namespaces["performance"]
        )
        
        return vector_id

class SemanticQueryEngine:
    """Advanced querying engine for cross-domain semantic search"""
    
    def __init__(self, semantic_memory: SemanticMemoryEngine):
        self.memory = semantic_memory
    
    def intelligent_search(self, query: str, context: Dict[str, Any] = None, 
                          search_types: List[str] = None, top_k: int = 20) -> Dict[str, List]:
        """Perform intelligent search across all content types"""
        if search_types is None:
            search_types = ["tasks", "documents", "comments", "reports", "workflows"]
        
        query_embedding = self.memory.get_embedding(query)
        results = {}
        
        for search_type in search_types:
            namespace = self.memory.namespaces.get(search_type)
            if not namespace:
                continue
            
            # Build filter based on context
            filter_conditions = {"type": search_type}
            if context:
                if context.get("project_id"):
                    filter_conditions["project_id"] = context["project_id"]
                if context.get("user_id"):
                    filter_conditions["user_id"] = context["user_id"]
                if context.get("time_range"):
                    # Add time-based filtering if needed
                    pass
            
            search_results = self.memory.index.query(
                vector=query_embedding,
                top_k=top_k // len(search_types),
                filter=filter_conditions,
                namespace=namespace,
                include_metadata=True
            )
            
            results[search_type] = [
                {
                    "id": match.metadata.get(f"{search_type[:-1]}_id", match.id),
                    "similarity_score": match.score,
                    "content_type": search_type,
                    "metadata": match.metadata
                }
                for match in search_results.matches
            ]
        
        return results
    
    def get_contextual_recommendations(self, user_id: str, project_id: str = None) -> Dict[str, List]:
        """Get AI-powered recommendations based on user context"""
        recommendations = {
            "similar_tasks": [],
            "relevant_documents": [],
            "related_discussions": [],
            "performance_insights": []
        }
        
        # Get user's recent activity patterns from semantic memory
        user_activity_query = f"user:{user_id} recent activity"
        
        # Find similar tasks the user might be interested in
        task_results = self.memory.index.query(
            vector=self.memory.get_embedding(user_activity_query),
            top_k=10,
            filter={"type": "task", "user_id": user_id},
            namespace=self.memory.namespaces["tasks"],
            include_metadata=True
        )
        
        recommendations["similar_tasks"] = [
            {
                "task_id": match.metadata["task_id"],
                "title": match.metadata.get("title", ""),
                "similarity_score": match.score,
                "reason": "Based on your recent activity pattern"
            }
            for match in task_results.matches[:5]
        ]
        
        return recommendations
    
    def analyze_project_patterns(self, project_id: str) -> Dict[str, Any]:
        """Analyze patterns and insights for a specific project"""
        # Get all project-related content
        project_query = f"project:{project_id}"
        query_embedding = self.memory.get_embedding(project_query)
        
        analysis = {
            "common_themes": [],
            "bottlenecks": [],
            "success_patterns": [],
            "resource_gaps": [],
            "recommendations": []
        }
        
        # Analyze across all namespaces
        for namespace in self.memory.namespaces.values():
            results = self.memory.index.query(
                vector=query_embedding,
                top_k=50,
                filter={"project_id": project_id},
                namespace=namespace,
                include_metadata=True
            )
            
            # Extract insights from the results
            # This would involve more sophisticated NLP analysis
            # For now, we'll return the structure
        
        return analysis
