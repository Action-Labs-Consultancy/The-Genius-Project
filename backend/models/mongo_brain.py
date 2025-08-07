"""MongoDB Brain model for enhanced brain functionality"""
from datetime import datetime
from bson import ObjectId
from mongo_db import mongo

class MongoBrain:
    """Enhanced MongoDB Brain model with full CRUD operations"""
    
    @staticmethod
    def create_brain(data):
        """Create a new brain with enhanced features"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            
            brain_doc = {
                'name': data.get('name', 'Untitled Brain'),
                'description': data.get('description', ''),
                'system_prompt': data.get('system_prompt', 'You are a helpful AI assistant.'),
                'user_id': data.get('user_id'),
                'client_id': data.get('client_id'),
                'knowledge_base': [],
                'settings': data.get('settings', {}),
                'metadata': data.get('metadata', {}),
                'tags': data.get('tags', []),
                'is_active': True,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            result = collection.insert_one(brain_doc)
            brain_doc['_id'] = str(result.inserted_id)
            return brain_doc
            
        except Exception as e:
            raise Exception(f"Failed to create MongoBrain: {str(e)}")
    
    @staticmethod
    def get_brain_by_id(brain_id):
        """Get brain by ID"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            brain = collection.find_one({'_id': ObjectId(brain_id)})
            
            if brain:
                brain['_id'] = str(brain['_id'])
            return brain
            
        except Exception as e:
            raise Exception(f"Failed to get MongoBrain: {str(e)}")
    
    @staticmethod
    def get_all_brains(user_id=None, client_id=None):
        """Get all brains with optional filtering"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            query = {'is_active': True}
            
            if user_id:
                query['user_id'] = user_id
            if client_id:
                query['client_id'] = client_id
                
            brains = list(collection.find(query).sort('updated_at', -1))
            
            for brain in brains:
                brain['_id'] = str(brain['_id'])
            return brains
            
        except Exception as e:
            raise Exception(f"Failed to get MongoBrains: {str(e)}")
    
    @staticmethod
    def update_brain(brain_id, update_data):
        """Update brain with new data"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            update_data['updated_at'] = datetime.now()
            
            result = collection.update_one(
                {'_id': ObjectId(brain_id)},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Failed to update MongoBrain: {str(e)}")
    
    @staticmethod
    def delete_brain(brain_id):
        """Soft delete brain"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            
            result = collection.update_one(
                {'_id': ObjectId(brain_id)},
                {
                    '$set': {
                        'is_active': False,
                        'deleted_at': datetime.now(),
                        'updated_at': datetime.now()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Failed to delete MongoBrain: {str(e)}")
    
    @staticmethod
    def add_knowledge_base_item(brain_id, file_data):
        """Add item to brain's knowledge base"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            
            file_data['uploaded_at'] = datetime.now()
            file_data['chunk_ids'] = file_data.get('chunk_ids', [])
            
            result = collection.update_one(
                {'_id': ObjectId(brain_id)},
                {
                    '$push': {'knowledge_base': file_data},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Failed to add knowledge base item: {str(e)}")
    
    @staticmethod
    def get_knowledge_base(brain_id):
        """Get brain's knowledge base"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            brain = collection.find_one(
                {'_id': ObjectId(brain_id)},
                {'knowledge_base': 1}
            )
            
            return brain.get('knowledge_base', []) if brain else []
            
        except Exception as e:
            raise Exception(f"Failed to get knowledge base: {str(e)}")
    
    @staticmethod
    def search_brains(query, user_id=None, limit=50):
        """Search brains by name or description"""
        try:
            if not mongo or not mongo.is_connected():
                raise Exception("Database not available")
                
            collection = mongo.get_collection('brains')
            
            search_query = {
                'is_active': True,
                '$or': [
                    {'name': {'$regex': query, '$options': 'i'}},
                    {'description': {'$regex': query, '$options': 'i'}}
                ]
            }
            
            if user_id:
                search_query['user_id'] = user_id
                
            brains = list(collection.find(search_query).limit(limit))
            
            for brain in brains:
                brain['_id'] = str(brain['_id'])
            return brains
            
        except Exception as e:
            raise Exception(f"Failed to search brains: {str(e)}")
