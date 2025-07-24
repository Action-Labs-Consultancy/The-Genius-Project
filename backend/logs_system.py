from datetime import datetime
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
import os
import json

class LogsSystem:
    def __init__(self):
        # MongoDB connection
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.client = MongoClient(mongo_uri)
        self.db = self.client['genius_project']
        self.logs_collection = self.db['system_logs']
        
        # Ensure index on timestamp for fast retrieval
        self.logs_collection.create_index([("timestamp", -1)])
        self.logs_collection.create_index([("user_id", 1)])
        self.logs_collection.create_index([("action_type", 1)])
    
    def log_action(self, 
                   action_type: str, 
                   description: str, 
                   user_id: str = "system", 
                   brain_id: str = None,
                   workflow_id: str = None,
                   node_id: str = None,
                   metadata: Dict[str, Any] = None,
                   level: str = "info"):
        """
        Log an action with comprehensive details
        
        Args:
            action_type: Type of action (e.g., 'brain_created', 'workflow_executed', 'node_added')
            description: Human-readable description of the action
            user_id: ID of the user who performed the action
            brain_id: ID of the brain involved (if any)
            workflow_id: ID of the workflow involved (if any)
            node_id: ID of the node involved (if any)
            metadata: Additional metadata as a dictionary
            level: Log level ('debug', 'info', 'warning', 'error', 'critical')
        """
        log_entry = {
            "timestamp": datetime.utcnow(),
            "action_type": action_type,
            "description": description,
            "user_id": user_id,
            "level": level,
            "brain_id": brain_id,
            "workflow_id": workflow_id,
            "node_id": node_id,
            "metadata": metadata or {},
            "ip_address": None,  # Will be set by the route handler
            "user_agent": None   # Will be set by the route handler
        }
        
        try:
            result = self.logs_collection.insert_one(log_entry)
            print(f"[LOG] {level.upper()}: {action_type} - {description}")
            return str(result.inserted_id)
        except Exception as e:
            print(f"Failed to log action: {e}")
            return None
    
    def get_logs(self, 
                 limit: int = 100, 
                 offset: int = 0,
                 user_id: str = None,
                 brain_id: str = None,
                 workflow_id: str = None,
                 action_type: str = None,
                 level: str = None,
                 start_date: datetime = None,
                 end_date: datetime = None) -> List[Dict[str, Any]]:
        """
        Retrieve logs with filtering options
        """
        query = {}
        
        if user_id:
            query["user_id"] = user_id
        if brain_id:
            query["brain_id"] = brain_id
        if workflow_id:
            query["workflow_id"] = workflow_id
        if action_type:
            query["action_type"] = action_type
        if level:
            query["level"] = level
        
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        try:
            cursor = self.logs_collection.find(query).sort("timestamp", -1).skip(offset).limit(limit)
            logs = []
            for log in cursor:
                log["_id"] = str(log["_id"])
                log["timestamp"] = log["timestamp"].isoformat()
                logs.append(log)
            return logs
        except Exception as e:
            print(f"Failed to retrieve logs: {e}")
            return []
    
    def get_logs_count(self, **filters) -> int:
        """Get total count of logs matching filters"""
        query = {}
        for key, value in filters.items():
            if value:
                query[key] = value
        
        try:
            return self.logs_collection.count_documents(query)
        except Exception as e:
            print(f"Failed to count logs: {e}")
            return 0
    
    def log_brain_action(self, action: str, brain_id: str, user_id: str = "system", **kwargs):
        """Convenience method for brain-related actions"""
        return self.log_action(
            action_type=f"brain_{action}",
            description=f"Brain {action}: {brain_id}",
            user_id=user_id,
            brain_id=brain_id,
            **kwargs
        )
    
    def log_workflow_action(self, action: str, workflow_id: str, brain_id: str = None, user_id: str = "system", **kwargs):
        """Convenience method for workflow-related actions"""
        return self.log_action(
            action_type=f"workflow_{action}",
            description=f"Workflow {action}: {workflow_id}",
            user_id=user_id,
            brain_id=brain_id,
            workflow_id=workflow_id,
            **kwargs
        )
    
    def log_node_action(self, action: str, node_id: str, workflow_id: str = None, brain_id: str = None, user_id: str = "system", **kwargs):
        """Convenience method for node-related actions"""
        return self.log_action(
            action_type=f"node_{action}",
            description=f"Node {action}: {node_id}",
            user_id=user_id,
            brain_id=brain_id,
            workflow_id=workflow_id,
            node_id=node_id,
            **kwargs
        )
    
    def log_error(self, error: str, context: str = "", user_id: str = "system", **kwargs):
        """Convenience method for error logging"""
        # Extract metadata from kwargs to avoid conflicts
        metadata = kwargs.pop('metadata', {})
        # Merge with default error metadata
        error_metadata = {"error": str(error), "context": context}
        error_metadata.update(metadata)
        
        return self.log_action(
            action_type="error",
            description=f"Error in {context}: {error}",
            user_id=user_id,
            level="error",
            metadata=error_metadata,
            **kwargs
        )

# Global instance
logs_system = LogsSystem()