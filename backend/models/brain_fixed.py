"""Brain model for managing AI brains"""
from datetime import datetime
from bson import ObjectId

# Import mongo from the same place as app.py
try:
    from mongo_db import mongo
except ImportError:
    print("[BRAIN MODEL] Warning: Could not import mongo from mongo_db")
    mongo = None

class Brain:
    """Brain model for managing AI brains and their knowledge bases"""

    @staticmethod
    def get_all():
        """Get all brains"""
        try:
            if not mongo or not mongo.db:
                raise Exception("Database not available")
                
            brains = list(mongo.db.brains.find())
            for brain in brains:
                brain['_id'] = str(brain['_id'])
            return brains
        except Exception as e:
            raise Exception(f"Failed to get brains: {str(e)}")

    @staticmethod
    def create(name, tone, prompt, user_id=None, created_at=None, updated_at=None):
        """Create a new brain"""
        try:
            if not mongo or not mongo.db:
                raise Exception("Database not available")
                
            brain = {
                'name': name,
                'tone': tone,
                'prompt': prompt,
                'user_id': user_id,
                'knowledge_base': [],
                'created_at': created_at or datetime.now(),
                'updated_at': updated_at or datetime.now()
            }
            
            result = mongo.db.brains.insert_one(brain)
            brain['_id'] = str(result.inserted_id)
            
            return brain
        except Exception as e:
            raise Exception(f"Failed to create brain: {str(e)}")

    @staticmethod
    def get_by_id(brain_id):
        """Get a brain by ID"""
        try:
            if not mongo or not mongo.db:
                raise Exception("Database not available")
                
            brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
            if brain:
                brain['_id'] = str(brain['_id'])
            return brain
        except Exception as e:
            raise Exception(f"Failed to get brain: {str(e)}")

    @staticmethod
    def delete(brain_id):
        """Delete a brain"""
        try:
            if not mongo or not mongo.db:
                raise Exception("Database not available")
                
            result = mongo.db.brains.delete_one({'_id': ObjectId(brain_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Failed to delete brain: {str(e)}")

    @staticmethod
    def add_to_knowledge_base(brain_id, file_info):
        """Add a file to a brain's knowledge base"""
        try:
            if not mongo or not mongo.db:
                raise Exception("Database not available")
                
            result = mongo.db.brains.update_one(
                {'_id': ObjectId(brain_id)},
                {
                    '$push': {'knowledge_base': file_info},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to add to knowledge base: {str(e)}")

    @staticmethod
    def get_knowledge_base(brain_id):
        """Get a brain's knowledge base"""
        try:
            if not mongo or not mongo.db:
                raise Exception("Database not available")
                
            brain = mongo.db.brains.find_one(
                {'_id': ObjectId(brain_id)},
                {'knowledge_base': 1}
            )
            return brain.get('knowledge_base', []) if brain else []
        except Exception as e:
            raise Exception(f"Failed to get knowledge base: {str(e)}")
