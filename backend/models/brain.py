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
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            brains_collection = mongo.get_collection('brains')
            brains = list(brains_collection.find())
            for brain in brains:
                brain['_id'] = str(brain['_id'])
            return brains
        except Exception as e:
            raise Exception(f"Failed to get brains: {str(e)}")

    @staticmethod
    def create(name, description, system_prompt, user_id=None):
        """Create a new brain"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            brains_collection = mongo.get_collection('brains')
            
            brain = {
                'name': name,
                'description': description,
                'system_prompt': system_prompt,
                'user_id': user_id,
                'agent_count': 0,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            result = brains_collection.insert_one(brain)
            brain['_id'] = str(result.inserted_id)
            
            return brain
        except Exception as e:
            raise Exception(f"Failed to create brain: {str(e)}")

    @staticmethod
    def get_by_id(brain_id):
        """Get a brain by ID"""
        try:
            if mongo is None:
                raise Exception("Database not available")
            brains_collection = mongo.get_collection('brains')
            brain = brains_collection.find_one({'_id': ObjectId(brain_id)})
            if brain:
                brain['_id'] = str(brain['_id'])
            return brain
        except Exception as e:
            raise Exception(f"Failed to get brain: {str(e)}")
            return brain
        except Exception as e:
            raise Exception(f"Failed to get brain: {str(e)}")

    @staticmethod
    def update(brain_id, name=None, description=None, system_prompt=None):
        """Update a brain"""
        try:
            if mongo is None:
                raise Exception("Database not available")
            
            brains_collection = mongo.get_collection('brains')
            update_data = {'updated_at': datetime.now()}
            if name is not None:
                update_data['name'] = name
            if description is not None:
                update_data['description'] = description
            if system_prompt is not None:
                update_data['system_prompt'] = system_prompt
            
            result = brains_collection.update_one(
                {'_id': ObjectId(brain_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to update brain: {str(e)}")

    @staticmethod
    def delete(brain_id):
        """Delete a brain"""
        try:
            if mongo is None:
                raise Exception("Database not available")
            brains_collection = mongo.get_collection('brains')
            result = brains_collection.delete_one({'_id': ObjectId(brain_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Failed to delete brain: {str(e)}")

    @staticmethod
    def increment_agent_count(brain_id):
        """Increment agent count for a brain"""
        try:
            if mongo is None:
                raise Exception("Database not available")
            brains_collection = mongo.get_collection('brains')
            result = brains_collection.update_one(
                {'_id': ObjectId(brain_id)},
                {
                    '$inc': {'agent_count': 1},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to increment agent count: {str(e)}")

    @staticmethod
    def decrement_agent_count(brain_id):
        """Decrement agent count for a brain"""
        try:
            if mongo is None:
                raise Exception("Database not available")
            brains_collection = mongo.get_collection('brains')
            result = brains_collection.update_one(
                {'_id': ObjectId(brain_id)},
                {
                    '$inc': {'agent_count': -1},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to decrement agent count: {str(e)}")