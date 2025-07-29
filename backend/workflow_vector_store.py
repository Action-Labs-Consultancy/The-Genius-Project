"""
Pinecone integration for workflow vector search and brain memory
"""
import os
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional

try:
    from pinecone import Pinecone, ServerlessSpec
    import openai
    PINECONE_AVAILABLE = True
except ImportError as e:
    print(f"[WARNING] Pinecone or OpenAI not available: {e}")
    PINECONE_AVAILABLE = False

class WorkflowVectorStore:
    """Vector store for workflow knowledge and memory"""
    
    def __init__(self):
        self.client = None
        self.index = None
        self.openai_client = None
        
    def initialize(self):
        """Initialize Pinecone and OpenAI clients"""
        if not PINECONE_AVAILABLE:
            return False
            
        try:
            # Initialize Pinecone
            api_key = os.getenv('PINECONE_API_KEY')
            if not api_key:
                print("[WARNING] PINECONE_API_KEY not set")
                return False
            
            self.client = Pinecone(api_key=api_key)
            
            # Initialize or get index
            index_name = "workflow-brain-memory"
            dimension = 1536  # OpenAI embedding dimension
            
            existing_indexes = [idx.name for idx in self.client.list_indexes()]
            
            if index_name not in existing_indexes:
                print(f"[PINECONE] Creating index: {index_name}")
                self.client.create_index(
                    name=index_name,
                    dimension=dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
            
            self.index = self.client.Index(index_name)
            
            # Initialize OpenAI for embeddings
            openai_key = os.getenv('OPENAI_API_KEY')
            if openai_key:
                openai.api_key = openai_key
                self.openai_client = openai
            else:
                print("[WARNING] OPENAI_API_KEY not set, embeddings disabled")
                
            print("[PINECONE] Vector store initialized successfully")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to initialize vector store: {e}")
            return False
    
    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using OpenAI"""
        if not self.openai_client:
            return None
            
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"[ERROR] Failed to generate embedding: {e}")
            return None
    
    def store_workflow_knowledge(self, workflow: Dict[str, Any]) -> bool:
        """Store workflow as vector knowledge"""
        if not self.index:
            return False
            
        try:
            # Create searchable text from workflow
            workflow_text = self._workflow_to_text(workflow)
            
            # Generate embedding
            embedding = self.generate_embedding(workflow_text)
            if not embedding:
                return False
            
            # Create unique ID
            workflow_id = workflow.get('_id', workflow.get('id', 'unknown'))
            vector_id = f"workflow_{workflow_id}_{int(datetime.utcnow().timestamp())}"
            
            # Store in Pinecone
            self.index.upsert(vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "type": "workflow",
                    "workflow_id": workflow_id,
                    "workflow_name": workflow.get('name', 'Unnamed'),
                    "description": workflow.get('description', ''),
                    "node_count": len(workflow.get('nodes', [])),
                    "tags": workflow.get('tags', []),
                    "created_at": workflow.get('created_at', datetime.utcnow().isoformat()),
                    "text_content": workflow_text[:1000]  # Store partial text in metadata
                }
            }])
            
            print(f"[PINECONE] Stored workflow knowledge: {workflow.get('name', 'Unnamed')}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to store workflow knowledge: {e}")
            return False
    
    def store_execution_memory(self, execution: Dict[str, Any]) -> bool:
        """Store execution results as memory"""
        if not self.index:
            return False
            
        try:
            # Create searchable text from execution
            execution_text = self._execution_to_text(execution)
            
            # Generate embedding
            embedding = self.generate_embedding(execution_text)
            if not embedding:
                return False
            
            # Create unique ID
            execution_id = execution.get('_id', execution.get('execution_id', 'unknown'))
            vector_id = f"execution_{execution_id}_{int(datetime.utcnow().timestamp())}"
            
            # Store in Pinecone
            self.index.upsert(vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "type": "execution",
                    "execution_id": execution_id,
                    "workflow_id": execution.get('workflow_id'),
                    "workflow_name": execution.get('workflow_name'),
                    "status": execution.get('status'),
                    "duration_ms": execution.get('duration_ms'),
                    "started_at": execution.get('started_at', datetime.utcnow().isoformat()),
                    "error_summary": execution.get('error_details', {}).get('summary') if execution.get('status') == 'error' else None,
                    "text_content": execution_text[:1000]
                }
            }])
            
            print(f"[PINECONE] Stored execution memory: {execution.get('workflow_name', 'Unknown')} - {execution.get('status')}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to store execution memory: {e}")
            return False
    
    def search_similar_workflows(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for similar workflows"""
        if not self.index:
            return []
            
        try:
            # Generate query embedding
            query_embedding = self.generate_embedding(query)
            if not query_embedding:
                return []
            
            # Search in Pinecone
            results = self.index.query(
                vector=query_embedding,
                filter={"type": "workflow"},
                top_k=limit,
                include_metadata=True
            )
            
            # Format results
            similar_workflows = []
            for match in results.matches:
                similar_workflows.append({
                    "workflow_id": match.metadata.get("workflow_id"),
                    "workflow_name": match.metadata.get("workflow_name"),
                    "description": match.metadata.get("description"),
                    "similarity_score": float(match.score),
                    "node_count": match.metadata.get("node_count"),
                    "tags": match.metadata.get("tags", []),
                    "created_at": match.metadata.get("created_at")
                })
            
            return similar_workflows
            
        except Exception as e:
            print(f"[ERROR] Failed to search workflows: {e}")
            return []
    
    def search_execution_memories(self, query: str, workflow_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search execution memories"""
        if not self.index:
            return []
            
        try:
            # Generate query embedding
            query_embedding = self.generate_embedding(query)
            if not query_embedding:
                return []
            
            # Build filter
            filter_dict = {"type": "execution"}
            if workflow_id:
                filter_dict["workflow_id"] = workflow_id
            
            # Search in Pinecone
            results = self.index.query(
                vector=query_embedding,
                filter=filter_dict,
                top_k=limit,
                include_metadata=True
            )
            
            # Format results
            memories = []
            for match in results.matches:
                memories.append({
                    "execution_id": match.metadata.get("execution_id"),
                    "workflow_name": match.metadata.get("workflow_name"),
                    "status": match.metadata.get("status"),
                    "similarity_score": float(match.score),
                    "duration_ms": match.metadata.get("duration_ms"),
                    "started_at": match.metadata.get("started_at"),
                    "error_summary": match.metadata.get("error_summary")
                })
            
            return memories
            
        except Exception as e:
            print(f"[ERROR] Failed to search execution memories: {e}")
            return []
    
    def get_workflow_insights(self, workflow_id: str) -> Dict[str, Any]:
        """Get AI-generated insights about a workflow based on vector memories"""
        if not self.index or not self.openai_client:
            return {"insights": "Vector search not available"}
            
        try:
            # Search for related executions
            executions = self.search_execution_memories(f"workflow {workflow_id}", workflow_id, limit=20)
            
            if not executions:
                return {"insights": "No execution history available for insights"}
            
            # Analyze execution patterns
            successful = sum(1 for e in executions if e['status'] == 'completed')
            failed = sum(1 for e in executions if e['status'] == 'error')
            total = len(executions)
            
            success_rate = (successful / total * 100) if total > 0 else 0
            
            # Generate AI insights prompt
            execution_summary = f"""
            Workflow Execution Analysis:
            - Total executions: {total}
            - Successful: {successful} ({success_rate:.1f}%)
            - Failed: {failed}
            - Recent executions: {executions[:5]}
            """
            
            # Get AI insights (simplified - could be enhanced)
            insights = {
                "success_rate": success_rate,
                "total_executions": total,
                "performance_trend": "stable" if success_rate > 80 else "needs_attention",
                "recommendations": []
            }
            
            if success_rate < 50:
                insights["recommendations"].append("Review failed executions for common error patterns")
            if total < 5:
                insights["recommendations"].append("More execution data needed for comprehensive analysis")
            
            return {"insights": insights}
            
        except Exception as e:
            print(f"[ERROR] Failed to generate workflow insights: {e}")
            return {"insights": f"Error generating insights: {str(e)}"}
    
    def _workflow_to_text(self, workflow: Dict[str, Any]) -> str:
        """Convert workflow to searchable text"""
        parts = []
        
        # Basic info
        parts.append(f"Workflow: {workflow.get('name', 'Unnamed')}")
        if workflow.get('description'):
            parts.append(f"Description: {workflow['description']}")
        
        # Nodes
        nodes = workflow.get('nodes', [])
        if nodes:
            node_types = [node.get('type', 'unknown') for node in nodes]
            parts.append(f"Node types: {', '.join(set(node_types))}")
            
            for node in nodes:
                node_label = node.get('data', {}).get('label', node.get('type', 'unknown'))
                parts.append(f"Node: {node_label}")
                
                # Add node parameters
                params = node.get('data', {}).get('params', {})
                for key, value in params.items():
                    parts.append(f"{key}: {value}")
        
        # Tags
        tags = workflow.get('tags', [])
        if tags:
            parts.append(f"Tags: {', '.join(tags)}")
        
        return " | ".join(parts)
    
    def _execution_to_text(self, execution: Dict[str, Any]) -> str:
        """Convert execution to searchable text"""
        parts = []
        
        # Basic info
        parts.append(f"Execution of: {execution.get('workflow_name', 'Unknown')}")
        parts.append(f"Status: {execution.get('status', 'unknown')}")
        
        if execution.get('duration_ms'):
            parts.append(f"Duration: {execution['duration_ms']}ms")
        
        # Execution log
        execution_log = execution.get('execution_log', [])
        for log_entry in execution_log:
            if isinstance(log_entry, dict):
                if log_entry.get('error'):
                    parts.append(f"Error: {log_entry['error']}")
                if log_entry.get('output'):
                    output = log_entry['output']
                    if isinstance(output, dict) and output.get('message'):
                        parts.append(f"Output: {output['message']}")
        
        # Error details
        error_details = execution.get('error_details')
        if error_details:
            parts.append(f"Error details: {error_details}")
        
        return " | ".join(parts)

# Global instance
vector_store = WorkflowVectorStore()

def initialize_vector_store():
    """Initialize the global vector store"""
    return vector_store.initialize()

def get_vector_store():
    """Get the global vector store instance"""
    return vector_store
