"""Agent model for managing AI agents within brains"""
from datetime import datetime
from bson import ObjectId

# Import mongo from the same place as app.py
try:
    from mongo_db import mongo
except ImportError:
    print("[AGENT MODEL] Warning: Could not import mongo from mongo_db")
    mongo = None

class Agent:
    """Agent model for managing AI agents within brains"""

    @staticmethod
    def get_all_by_brain(brain_id):
        """Get all agents for a specific brain"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
                
            agents = list(mongo.db.agents.find({'brain_id': brain_id}))
            for agent in agents:
                agent['_id'] = str(agent['_id'])
            return agents
        except Exception as e:
            raise Exception(f"Failed to get agents: {str(e)}")

    @staticmethod
    def create(brain_id, agent_name, role_description, system_prompt, user_id=None, temperature=0.7, tools=None, personality="professional"):
        """Create a new agent within a brain"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            # Verify brain exists
            brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
            if not brain:
                raise Exception("Brain not found")
            
            agent = {
                'brain_id': brain_id,
                'agent_name': agent_name,
                'role_description': role_description,
                'system_prompt': system_prompt,
                'temperature': temperature,
                'tools': tools or [],
                'personality': personality,
                'user_id': user_id,
                'documents': [],  # For agent-specific vectorized documents
                'status': 'active',
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            result = mongo.db.agents.insert_one(agent)
            agent['_id'] = str(result.inserted_id)
            
            # Update brain's agent count
            mongo.db.brains.update_one(
                {'_id': ObjectId(brain_id)},
                {
                    '$inc': {'agent_count': 1},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            
            return agent
        except Exception as e:
            raise Exception(f"Failed to create agent: {str(e)}")

    @staticmethod
    def get_by_id(agent_id):
        """Get an agent by ID"""
        try:
            if mongo is None or mongo.db is None:
                raise Exception("Database not available")
                
            agent = mongo.db.agents.find_one({'_id': ObjectId(agent_id)})
            if agent:
                agent['_id'] = str(agent['_id'])
            return agent
        except Exception as e:
            raise Exception(f"Failed to get agent: {str(e)}")

    @staticmethod
    def update(agent_id, **kwargs):
        """Update an agent"""
        try:
            if mongo is None or mongo.db is None:
                raise Exception("Database not available")
            
            update_data = {'updated_at': datetime.now()}
            
            # Allowed fields for update
            allowed_fields = [
                'agent_name', 'role_description', 'system_prompt', 
                'temperature', 'tools', 'personality', 'status'
            ]
            
            for field in allowed_fields:
                if field in kwargs:
                    update_data[field] = kwargs[field]
            
            result = mongo.db.agents.update_one(
                {'_id': ObjectId(agent_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to update agent: {str(e)}")

    @staticmethod
    def delete(agent_id):
        """Delete an agent"""
        try:
            if mongo is None or mongo.db is None:
                raise Exception("Database not available")
                
            # Get agent to find brain_id
            agent = mongo.db.agents.find_one({'_id': ObjectId(agent_id)})
            if not agent:
                return False
                
            brain_id = agent['brain_id']
            
            # Delete agent
            result = mongo.db.agents.delete_one({'_id': ObjectId(agent_id)})
            
            if result.deleted_count > 0:
                # Update brain's agent count
                mongo.db.brains.update_one(
                    {'_id': ObjectId(brain_id)},
                    {
                        '$inc': {'agent_count': -1},
                        '$set': {'updated_at': datetime.now()}
                    }
                )
            
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Failed to delete agent: {str(e)}")

    @staticmethod
    def add_document(agent_id, document_info):
        """Add a document to an agent's knowledge base"""
        try:
            if mongo is None or mongo.db is None:
                raise Exception("Database not available")
                
            result = mongo.db.agents.update_one(
                {'_id': ObjectId(agent_id)},
                {
                    '$push': {'documents': document_info},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to add document to agent: {str(e)}")

    @staticmethod
    def get_documents(agent_id):
        """Get an agent's documents"""
        try:
            if mongo is None or mongo.db is None:
                raise Exception("Database not available")
                
            agent = mongo.db.agents.find_one(
                {'_id': ObjectId(agent_id)},
                {'documents': 1}
            )
            return agent.get('documents', []) if agent else []
        except Exception as e:
            raise Exception(f"Failed to get agent documents: {str(e)}")

    @staticmethod
    def remove_document(agent_id, document_id):
        """Remove a document from an agent's knowledge base"""
        try:
            if mongo is None or mongo.db is None:
                raise Exception("Database not available")
                
            result = mongo.db.agents.update_one(
                {'_id': ObjectId(agent_id)},
                {
                    '$pull': {'documents': {'id': document_id}},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to remove document from agent: {str(e)}")
