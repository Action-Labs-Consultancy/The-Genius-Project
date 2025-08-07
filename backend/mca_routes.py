# mca_routes.py - Flask MCA Brain management routes with MongoDB and Pinecone
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os
import json
from datetime import datetime
import traceback

# Import Pinecone
try:
    import pinecone
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    print("Warning: Pinecone not available. Vector search will be disabled.")

# Import MongoDB connection
try:
    from mongo_db import mongo
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("Warning: MongoDB connection not available")

# Import MCA classes - using simplified approach without frontend dependencies
MCA_CLASSES_AVAILABLE = True

# Create blueprint
mca_routes = Blueprint('mca_routes', __name__)

# MongoDB connection helper
def get_mongo_db():
    """Get MongoDB database connection"""
    try:
        if MONGODB_AVAILABLE:
            from mongo_db import mongo
            return mongo.db
        else:
            # Fallback connection
            client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
            return client[os.getenv('DB_NAME', 'genius_project')]
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        # Return fallback connection
        client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
        return client[os.getenv('DB_NAME', 'genius_project')]

# Pinecone connection helper
def get_pinecone_index():
    """Get Pinecone index connection"""
    if not PINECONE_AVAILABLE:
        return None
    
    try:
        pinecone.init(
            api_key=os.getenv('PINECONE_API_KEY'),
            environment=os.getenv('PINECONE_ENVIRONMENT', 'us-west1-gcp')
        )
        return pinecone.Index(os.getenv('PINECONE_INDEX_NAME', 'mca-brains'))
    except Exception as e:
        print(f"Pinecone connection failed: {e}")
        return None

# Simple vector creation for Pinecone
def create_simple_vector(text, dimensions=384):
    """Create a simple vector from text for Pinecone storage"""
    words = text.lower().split()
    vector = [0.0] * dimensions
    
    for i, word in enumerate(words[:dimensions]):
        # Simple hash-based vector creation
        hash_val = hash(word) % dimensions
        vector[hash_val] += 1.0
    
    # Normalize vector
    magnitude = sum(x*x for x in vector) ** 0.5
    if magnitude > 0:
        vector = [x/magnitude for x in vector]
    
    return vector

# Store brain in Pinecone
def store_brain_in_pinecone(brain_data):
    """Store brain data in Pinecone for vector search"""
    try:
        index = get_pinecone_index()
        if not index:
            return False
        
        # Create text for embedding
        text_content = f"{brain_data.get('name', '')} {brain_data.get('description', '')} {brain_data.get('tone', '')} {brain_data.get('style', '')}"
        
        # Create vector
        vector = create_simple_vector(text_content)
        
        # Store in Pinecone
        index.upsert(vectors=[{
            'id': str(brain_data['_id']),
            'values': vector,
            'metadata': {
                'name': brain_data.get('name', ''),
                'description': brain_data.get('description', ''),
                'tone': brain_data.get('tone', ''),
                'style': brain_data.get('style', ''),
                'type': 'mca_brain',
                'created_at': str(brain_data.get('createdAt', ''))
            }
        }])
        
        return True
    except Exception as e:
        print(f"Failed to store in Pinecone: {e}")
        return False

# API Routes

@mca_routes.route('/mca-brains', methods=['GET'])
def get_mca_brains():
    """Get all MCA brains, agents, and sessions"""
    try:
        db = get_mongo_db()
        
        # Get brains
        brains_cursor = db.mca_brains.find({})
        brains = []
        for brain in brains_cursor:
            brain['_id'] = str(brain['_id'])
            brains.append(brain)
        
        # Get agents
        agents_cursor = db.mca_agents.find({})
        agents = []
        for agent in agents_cursor:
            agent['_id'] = str(agent['_id'])
            agents.append(agent)
        
        # Get sessions
        sessions_cursor = db.mca_sessions.find({}).sort('startTime', -1).limit(100)
        sessions = []
        for session in sessions_cursor:
            session['_id'] = str(session['_id'])
            sessions.append(session)
        
        return jsonify({
            'success': True,
            'brains': brains,
            'agents': agents,
            'sessions': sessions
        })
        
    except Exception as e:
        print(f"Error fetching MCA brains: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to fetch MCA brains',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-brains', methods=['POST'])
def create_mca_brain():
    """Create new MCA brain"""
    try:
        db = get_mongo_db()
        data = request.get_json()
        
        # Prepare brain data
        brain_data = {
            'name': data.get('name', ''),
            'description': data.get('description', ''),
            'tone': data.get('tone', 'professional'),
            'style': data.get('style', 'clear and actionable'),
            'protocol': data.get('protocol', {}),
            'agents': [],
            'type': 'mca_brain',
            'createdAt': datetime.utcnow(),
            'lastModified': datetime.utcnow(),
            'version': '1.0'
        }
        
        # Insert into MongoDB
        result = db.mca_brains.insert_one(brain_data)
        brain_data['_id'] = str(result.inserted_id)
        
        # Store in Pinecone
        store_brain_in_pinecone(brain_data)
        
        return jsonify({
            'success': True,
            'brain': brain_data
        }), 201
        
    except Exception as e:
        print(f"Error creating MCA brain: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to create MCA brain',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-brains/<brain_id>', methods=['PUT'])
def update_mca_brain(brain_id):
    """Update MCA brain"""
    try:
        db = get_mongo_db()
        data = request.get_json()
        
        # Update data
        update_data = {
            **data,
            'lastModified': datetime.utcnow()
        }
        
        # Update in MongoDB
        result = db.mca_brains.update_one(
            {'_id': ObjectId(brain_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'MCA brain not found'
            }), 404
        
        # Get updated brain
        updated_brain = db.mca_brains.find_one({'_id': ObjectId(brain_id)})
        updated_brain['_id'] = str(updated_brain['_id'])
        
        # Update in Pinecone
        store_brain_in_pinecone(updated_brain)
        
        return jsonify({
            'success': True,
            'brain': updated_brain
        })
        
    except Exception as e:
        print(f"Error updating MCA brain: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to update MCA brain',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-brains/<brain_id>', methods=['DELETE'])
def delete_mca_brain(brain_id):
    """Delete MCA brain"""
    try:
        db = get_mongo_db()
        
        # Delete associated agents
        db.mca_agents.delete_many({'brainId': brain_id})
        
        # Delete associated sessions
        db.mca_sessions.delete_many({'brainId': brain_id})
        
        # Delete brain
        result = db.mca_brains.delete_one({'_id': ObjectId(brain_id)})
        
        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'error': 'MCA brain not found'
            }), 404
        
        # Delete from Pinecone
        try:
            index = get_pinecone_index()
            if index:
                index.delete(ids=[brain_id])
        except Exception as e:
            print(f"Failed to delete from Pinecone: {e}")
        
        return jsonify({
            'success': True,
            'message': 'MCA brain deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting MCA brain: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to delete MCA brain',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-agents', methods=['POST'])
def create_mca_agent():
    """Create new MCA agent"""
    try:
        db = get_mongo_db()
        data = request.get_json()
        
        # Prepare agent data
        agent_data = {
            'name': data.get('name', ''),
            'role': data.get('role', 'maker'),
            'brainId': data.get('brainId', ''),
            'capabilities': data.get('capabilities', []),
            'createdAt': datetime.utcnow(),
            'lastModified': datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = db.mca_agents.insert_one(agent_data)
        agent_data['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'agent': agent_data
        }), 201
        
    except Exception as e:
        print(f"Error creating MCA agent: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to create MCA agent',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-agents/<agent_id>', methods=['PUT'])
def update_mca_agent(agent_id):
    """Update MCA agent"""
    try:
        db = get_mongo_db()
        data = request.get_json()
        
        # Update data
        update_data = {
            **data,
            'lastModified': datetime.utcnow()
        }
        
        # Update in MongoDB
        result = db.mca_agents.update_one(
            {'_id': ObjectId(agent_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'MCA agent not found'
            }), 404
        
        # Get updated agent
        updated_agent = db.mca_agents.find_one({'_id': ObjectId(agent_id)})
        updated_agent['_id'] = str(updated_agent['_id'])
        
        return jsonify({
            'success': True,
            'agent': updated_agent
        })
        
    except Exception as e:
        print(f"Error updating MCA agent: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to update MCA agent',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-agents/<agent_id>', methods=['DELETE'])
def delete_mca_agent(agent_id):
    """Delete MCA agent"""
    try:
        db = get_mongo_db()
        
        # Delete agent
        result = db.mca_agents.delete_one({'_id': ObjectId(agent_id)})
        
        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'error': 'MCA agent not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'MCA agent deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting MCA agent: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to delete MCA agent',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-sessions', methods=['POST'])
def save_mca_session():
    """Save MCA session"""
    try:
        db = get_mongo_db()
        data = request.get_json()
        
        # Prepare session data
        session_data = {
            'sessionId': data.get('sessionId', ''),
            'brainId': data.get('brainId', ''),
            'prompt': data.get('prompt', ''),
            'result': data.get('result', {}),
            'status': data.get('status', 'completed'),
            'startTime': data.get('startTime'),
            'endTime': data.get('endTime'),
            'steps': data.get('steps', []),
            'savedAt': datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = db.mca_sessions.insert_one(session_data)
        session_data['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'session': session_data
        }), 201
        
    except Exception as e:
        print(f"Error saving MCA session: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to save MCA session',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-sessions/<brain_id>', methods=['GET'])
def get_mca_sessions(brain_id):
    """Get MCA sessions for a brain"""
    try:
        db = get_mongo_db()
        
        # Get sessions
        sessions_cursor = db.mca_sessions.find({'brainId': brain_id}).sort('startTime', -1).limit(50)
        sessions = []
        for session in sessions_cursor:
            session['_id'] = str(session['_id'])
            sessions.append(session)
        
        return jsonify({
            'success': True,
            'sessions': sessions
        })
        
    except Exception as e:
        print(f"Error fetching MCA sessions: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to fetch MCA sessions',
            'details': str(e)
        }), 500

@mca_routes.route('/pinecone/search-brains', methods=['POST'])
def search_mca_brains():
    """Search MCA brains using Pinecone"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        index = get_pinecone_index()
        if not index:
            return jsonify({
                'success': False,
                'error': 'Pinecone not available',
                'matches': []
            })
        
        # Create query vector
        query_vector = create_simple_vector(query)
        
        # Search in Pinecone
        search_results = index.query(
            vector=query_vector,
            top_k=10,
            include_metadata=True
        )
        
        return jsonify({
            'success': True,
            'matches': search_results.get('matches', [])
        })
        
    except Exception as e:
        print(f"Error searching MCA brains: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Search failed',
            'details': str(e),
            'matches': []
        }), 500

@mca_routes.route('/pinecone/store-brain', methods=['POST'])
def store_brain_pinecone():
    """Store brain in Pinecone"""
    try:
        data = request.get_json()
        
        index = get_pinecone_index()
        if not index:
            return jsonify({
                'success': False,
                'error': 'Pinecone not available'
            })
        
        # Create vector
        text = data.get('text', '')
        vector = create_simple_vector(text)
        
        # Store in Pinecone
        index.upsert(vectors=[{
            'id': data.get('id', ''),
            'values': vector,
            'metadata': data.get('metadata', {})
        }])
        
        return jsonify({
            'success': True,
            'message': 'Brain stored in Pinecone successfully'
        })
        
    except Exception as e:
        print(f"Error storing brain in Pinecone: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to store in Pinecone',
            'details': str(e)
        }), 500

@mca_routes.route('/mca-analytics/<brain_id>', methods=['GET'])
def get_mca_analytics(brain_id):
    """Get MCA brain analytics"""
    try:
        db = get_mongo_db()
        
        # Get brain
        brain = db.mca_brains.find_one({'_id': ObjectId(brain_id)})
        if not brain:
            return jsonify({
                'success': False,
                'error': 'MCA brain not found'
            }), 404
        
        # Get agents
        agents = list(db.mca_agents.find({'brainId': brain_id}))
        
        # Get sessions
        sessions = list(db.mca_sessions.find({'brainId': brain_id}))
        
        # Calculate analytics
        analytics = {
            'totalSessions': len(sessions),
            'completedSessions': len([s for s in sessions if s.get('status') == 'completed']),
            'failedSessions': len([s for s in sessions if s.get('status') == 'failed']),
            'successRate': (len([s for s in sessions if s.get('status') == 'completed']) / len(sessions) * 100) if sessions else 0,
            'agentCount': len(agents),
            'agentsByRole': {
                'maker': len([a for a in agents if a.get('role') == 'maker']),
                'checker': len([a for a in agents if a.get('role') == 'checker']),
                'approver': len([a for a in agents if a.get('role') == 'approver'])
            },
            'protocolVersion': brain.get('protocol', {}).get('version', '1.0'),
            'lastUsed': max([s.get('startTime') for s in sessions]) if sessions else None
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics
        })
        
    except Exception as e:
        print(f"Error fetching MCA analytics: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to fetch MCA analytics',
            'details': str(e)
        }), 500
