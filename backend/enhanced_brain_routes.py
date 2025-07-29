"""
Enhanced Brain Routes with Proper Pinecone and MongoDB Integration
Ensures all brains and agents are saved to both systems with full RAG capabilities
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import os
from werkzeug.utils import secure_filename

# Import models and services
from models.brain import Brain
from models.agent import Agent
from ai_service import get_ai_service, get_pinecone_service, get_mongodb_service

# Initialize services
ai_service = get_ai_service()
pinecone_service = get_pinecone_service()
mongodb_service = get_mongodb_service()

enhanced_brain_routes = Blueprint('enhanced_brain_routes', __name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'md', 'csv', 'json'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@enhanced_brain_routes.route('/api/brains/enhanced', methods=['POST'])
def create_enhanced_brain():
    """Create brain with full Pinecone and MongoDB integration"""
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400
        
        # Extract brain data
        name = data['name']
        description = data.get('description', '')
        system_prompt = data.get('system_prompt', data.get('prompt', ''))
        user_id = data.get('user_id')
        personality = data.get('personality', 'assistant')
        
        # Create brain in MongoDB
        brain = Brain.create(
            name=name,
            description=description,
            system_prompt=system_prompt,
            user_id=user_id
        )
        
        if not brain:
            raise Exception("Failed to create brain in MongoDB")
        
        brain_id = str(brain['_id'])
        
        # Store brain information in Pinecone for RAG
        brain_content = f"""
Brain Name: {name}
Description: {description}
System Prompt: {system_prompt}
Personality: {personality}
"""
        
        brain_metadata = {
            'id': f"brain_{brain_id}",
            'brain_id': brain_id,
            'user_id': user_id or 'system',
            'type': 'brain_profile',
            'name': name,
            'created_at': datetime.now().isoformat()
        }
        
        # Store in Pinecone
        pinecone_success = pinecone_service.store_content(brain_content, brain_metadata)
        
        # Log creation to MongoDB
        creation_log = {
            'action': 'brain_created',
            'brain_id': brain_id,
            'brain_name': name,
            'user_id': user_id,
            'pinecone_stored': pinecone_success,
            'timestamp': datetime.now()
        }
        
        mongodb_service.save_marketing_content(creation_log)
        
        return jsonify({
            'success': True,
            'message': 'Brain created successfully with full integration',
            'data': {
                'brain': brain,
                'brain_id': brain_id,
                'pinecone_stored': pinecone_success,
                'mongodb_stored': True,
                'integrations': {
                    'mongodb': True,
                    'pinecone': pinecone_success
                }
            }
        }), 201
        
    except Exception as e:
        print(f"Error creating enhanced brain: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to create brain: {str(e)}'
        }), 500

@enhanced_brain_routes.route('/api/brains/<brain_id>/agents/enhanced', methods=['POST'])
def create_enhanced_agent(brain_id):
    """Create agent with full Pinecone and MongoDB integration"""
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': 'Agent name is required'}), 400
        
        # Verify brain exists
        brain = Brain.get_by_id(brain_id)
        if not brain:
            return jsonify({'error': 'Brain not found'}), 404
        
        # Extract agent data
        name = data['name']
        description = data.get('description', '')
        system_prompt = data.get('system_prompt', '')
        capabilities = data.get('capabilities', [])
        user_id = data.get('user_id')
        
        # Create agent in MongoDB
        agent = Agent.create(
            name=name,
            description=description,
            system_prompt=system_prompt,
            brain_id=brain_id,
            user_id=user_id
        )
        
        if not agent:
            raise Exception("Failed to create agent in MongoDB")
        
        agent_id = str(agent['_id'])
        
        # Store agent information in Pinecone for RAG
        agent_content = f"""
Agent Name: {name}
Brain: {brain['name']}
Description: {description}
System Prompt: {system_prompt}
Capabilities: {', '.join(capabilities) if capabilities else 'General assistance'}
Brain Context: {brain.get('system_prompt', '')}
"""
        
        agent_metadata = {
            'id': f"agent_{agent_id}",
            'agent_id': agent_id,
            'brain_id': brain_id,
            'user_id': user_id or 'system',
            'type': 'agent_profile',
            'name': name,
            'brain_name': brain['name'],
            'created_at': datetime.now().isoformat()
        }
        
        # Store in Pinecone
        pinecone_success = pinecone_service.store_content(agent_content, agent_metadata)
        
        # Update brain agent count
        Brain.increment_agent_count(brain_id)
        
        # Log creation to MongoDB
        creation_log = {
            'action': 'agent_created',
            'agent_id': agent_id,
            'agent_name': name,
            'brain_id': brain_id,
            'brain_name': brain['name'],
            'user_id': user_id,
            'pinecone_stored': pinecone_success,
            'timestamp': datetime.now()
        }
        
        mongodb_service.save_marketing_content(creation_log)
        
        return jsonify({
            'success': True,
            'message': 'Agent created successfully with full integration',
            'data': {
                'agent': agent,
                'agent_id': agent_id,
                'brain_id': brain_id,
                'pinecone_stored': pinecone_success,
                'mongodb_stored': True,
                'integrations': {
                    'mongodb': True,
                    'pinecone': pinecone_success
                }
            }
        }), 201
        
    except Exception as e:
        print(f"Error creating enhanced agent: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to create agent: {str(e)}'
        }), 500

@enhanced_brain_routes.route('/api/brains/<brain_id>/knowledge/upload', methods=['POST'])
def upload_knowledge_enhanced(brain_id):
    """Upload and process knowledge with full Pinecone integration"""
    try:
        # Verify brain exists
        brain = Brain.get_by_id(brain_id)
        if not brain:
            return jsonify({'error': 'Brain not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Read file content
        content = file.read().decode('utf-8')
        filename = secure_filename(file.filename)
        
        # Generate unique ID for this knowledge piece
        knowledge_id = str(uuid.uuid4())
        
        # Prepare metadata
        knowledge_metadata = {
            'id': f"knowledge_{knowledge_id}",
            'brain_id': brain_id,
            'brain_name': brain['name'],
            'filename': filename,
            'type': 'brain_knowledge',
            'uploaded_at': datetime.now().isoformat(),
            'content_length': len(content)
        }
        
        # Store in Pinecone
        pinecone_success = pinecone_service.store_content(content, knowledge_metadata)
        
        # Update brain knowledge base in MongoDB
        knowledge_entry = {
            'id': knowledge_id,
            'filename': filename,
            'original_filename': file.filename,
            'content_preview': content[:500] + "..." if len(content) > 500 else content,
            'full_content': content,
            'uploaded_at': datetime.now(),
            'pinecone_stored': pinecone_success,
            'file_size': len(content)
        }
        
        # Add to brain's knowledge base
        try:
            from mongo_db import mongo
            mongo.db.brains.update_one(
                {'_id': brain['_id']},
                {
                    '$push': {'knowledge_base': knowledge_entry},
                    '$set': {'updated_at': datetime.now()}
                }
            )
        except Exception as e:
            print(f"Warning: Failed to update brain knowledge base: {e}")
        
        # Log upload to MongoDB
        upload_log = {
            'action': 'knowledge_uploaded',
            'brain_id': brain_id,
            'brain_name': brain['name'],
            'filename': filename,
            'knowledge_id': knowledge_id,
            'content_length': len(content),
            'pinecone_stored': pinecone_success,
            'timestamp': datetime.now()
        }
        
        mongodb_service.save_marketing_content(upload_log)
        
        return jsonify({
            'success': True,
            'message': 'Knowledge uploaded and processed successfully',
            'data': {
                'knowledge_id': knowledge_id,
                'filename': filename,
                'content_length': len(content),
                'brain_id': brain_id,
                'pinecone_stored': pinecone_success,
                'mongodb_updated': True,
                'integrations': {
                    'mongodb': True,
                    'pinecone': pinecone_success
                }
            }
        })
        
    except Exception as e:
        print(f"Error uploading knowledge: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to upload knowledge: {str(e)}'
        }), 500

@enhanced_brain_routes.route('/api/brains/<brain_id>/chat/enhanced', methods=['POST'])
def chat_with_brain_enhanced(brain_id):
    """Chat with brain using RAG from Pinecone"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message']
        
        # Verify brain exists
        brain = Brain.get_by_id(brain_id)
        if not brain:
            return jsonify({'error': 'Brain not found'}), 404
        
        # Get relevant context from Pinecone
        rag_results = pinecone_service.search_content(
            query=message,
            top_k=5,
            filter_dict={'brain_id': brain_id}
        )
        
        # Build context from RAG results
        rag_context = ""
        if rag_results:
            context_pieces = []
            for result in rag_results:
                if result['score'] > 0.6:  # Only use relevant results
                    context_pieces.append(result['content'])
            
            if context_pieces:
                rag_context = "\n\nRelevant Knowledge:\n" + "\n".join(context_pieces)
        
        # Build comprehensive prompt
        system_prompt = brain.get('system_prompt', 'You are a helpful AI assistant.')
        full_prompt = f"{message}{rag_context}"
        
        # Generate response with AI
        response = ai_service.generate_text(
            prompt=full_prompt,
            system_prompt=system_prompt,
            max_tokens=500,
            temperature=0.7
        )
        
        # Log conversation to MongoDB
        conversation_log = {
            'action': 'brain_chat',
            'brain_id': brain_id,
            'brain_name': brain['name'],
            'user_message': message,
            'ai_response': response,
            'rag_context_used': bool(rag_context),
            'rag_sources': len(rag_results),
            'timestamp': datetime.now()
        }
        
        mongodb_service.save_marketing_content(conversation_log)
        
        return jsonify({
            'success': True,
            'message': 'Chat response generated successfully',
            'data': {
                'response': response,
                'brain_name': brain['name'],
                'rag_context_used': bool(rag_context),
                'rag_sources': len(rag_results),
                'relevant_matches': [
                    {
                        'content_preview': result['content'][:100] + "...",
                        'score': result['score']
                    }
                    for result in rag_results[:3]
                ]
            }
        })
        
    except Exception as e:
        print(f"Error in brain chat: {e}")
        return jsonify({
            'success': False,
            'error': f'Chat failed: {str(e)}'
        }), 500

@enhanced_brain_routes.route('/api/brains/integration-status', methods=['GET'])
def get_integration_status():
    """Get status of all integrations"""
    try:
        from ai_service import get_service_status
        
        # Get brain counts from MongoDB
        brain_count = 0
        agent_count = 0
        
        try:
            from mongo_db import mongo
            brain_count = mongo.db.brains.count_documents({})
            
            # Count agents across all brains
            brains = mongo.db.brains.find({}, {'_id': 1})
            for brain in brains:
                agents_in_brain = mongo.db.agents.count_documents({'brain_id': str(brain['_id'])})
                agent_count += agents_in_brain
                
        except Exception as e:
            print(f"Error counting documents: {e}")
        
        # Get service status
        service_status = get_service_status()
        
        return jsonify({
            'success': True,
            'message': 'Integration status retrieved',
            'data': {
                'services': service_status,
                'database_counts': {
                    'brains': brain_count,
                    'agents': agent_count
                },
                'integrations_working': {
                    'mongodb': service_status['mongodb_available'],
                    'pinecone': service_status['pinecone_available'],
                    'ai_services': service_status['services_ready']
                },
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get integration status: {str(e)}'
        }), 500
