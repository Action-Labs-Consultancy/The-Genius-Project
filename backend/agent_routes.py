"""
Agent Management Routes
Handles agent creation, management, document upload, and inter-agent communication
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF for PDF processing
import docx  # python-docx for Word documents
from bson import ObjectId

# Import models
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))
try:
    from agent import Agent
    from brain import Brain
except ImportError:
    print("[AGENT ROUTES] Warning: Could not import Agent or Brain model")
    Agent = None
    Brain = None

try:
    from mongo_db import mongo
except ImportError:
    print("[AGENT ROUTES] Warning: Could not import mongo from mongo_db")
    mongo = None

from pinecone_utils import (
    store_text_in_pinecone, 
    query_pinecone, 
    generate_brain_response,
    chunk_document_text,
    delete_brain_vectors
)

agent_routes = Blueprint('agent_routes', __name__)

# Configure upload settings
UPLOAD_FOLDER = 'uploads/agent_documents'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'md'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path, filename):
    """Extract text content from uploaded files"""
    try:
        file_extension = filename.split('.')[-1].lower()
        
        if file_extension == 'pdf':
            # Extract text from PDF using PyMuPDF
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
            
        elif file_extension in ['doc', 'docx']:
            # Extract text from Word documents
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
            
        elif file_extension in ['txt', 'md']:
            # Read plain text files
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
                
        else:
            raise Exception(f"Unsupported file type: {file_extension}")
            
    except Exception as e:
        raise Exception(f"Failed to extract text from {filename}: {str(e)}")

def create_success_response(data, message, status_code=200):
    """Create a standardized success response"""
    return jsonify({
        'success': True,
        'data': data,
        'message': message
    }), status_code

def create_error_response(message, status_code=400):
    """Create a standardized error response"""
    return jsonify({
        'success': False,
        'error': message
    }), status_code

@agent_routes.route('/api/brains/<brain_id>/agents', methods=['GET'])
def get_brain_agents(brain_id):
    """Get all agents for a specific brain"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        agents = Agent.get_all_by_brain(brain_id)
        return create_success_response(agents, f"Found {len(agents)} agents")
        
    except Exception as e:
        print(f"Error getting brain agents: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/brains/<brain_id>/agents', methods=['POST'])
def create_agent(brain_id):
    """Create a new agent within a brain"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['agent_name', 'role_description', 'system_prompt']
        for field in required_fields:
            if not data.get(field):
                return create_error_response(f'{field} is required', 400)
        
        # Create agent
        agent = Agent.create(
            brain_id=brain_id,
            agent_name=data['agent_name'],
            role_description=data['role_description'],
            system_prompt=data['system_prompt'],
            user_id=data.get('user_id'),
            temperature=data.get('temperature', 0.7),
            tools=data.get('tools', []),
            personality=data.get('personality', 'professional')
        )
        
        return create_success_response(agent, "Agent created successfully", 201)
        
    except Exception as e:
        print(f"Error creating agent: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>', methods=['GET'])
def get_agent(agent_id):
    """Get a specific agent by ID"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        agent = Agent.get_by_id(agent_id)
        if not agent:
            return create_error_response('Agent not found', 404)
            
        return create_success_response(agent, "Agent retrieved successfully")
        
    except Exception as e:
        print(f"Error getting agent: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>', methods=['PUT'])
def update_agent(agent_id):
    """Update an existing agent"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        data = request.get_json()
        
        # Update agent
        success = Agent.update(agent_id, **data)
        if not success:
            return create_error_response('Agent not found or update failed', 404)
            
        # Get updated agent
        agent = Agent.get_by_id(agent_id)
        return create_success_response(agent, "Agent updated successfully")
        
    except Exception as e:
        print(f"Error updating agent: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>', methods=['DELETE'])
def delete_agent(agent_id):
    """Delete an agent and all associated data"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        # Get agent info before deletion for cleanup
        agent = Agent.get_by_id(agent_id)
        if not agent:
            return create_error_response('Agent not found', 404)
        
        # Delete agent vectors from Pinecone if any
        try:
            # Delete agent-specific vectors from Pinecone
            # This would delete vectors with metadata containing this agent_id
            # Implementation depends on how you structure agent vectors in Pinecone
            pass
        except Exception as e:
            print(f"Warning: Failed to delete agent vectors from Pinecone: {e}")
        
        # Delete agent from MongoDB
        success = Agent.delete(agent_id)
        if not success:
            return create_error_response('Failed to delete agent', 500)
            
        return create_success_response(None, "Agent deleted successfully")
        
    except Exception as e:
        print(f"Error deleting agent: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>/documents', methods=['GET'])
def get_agent_documents(agent_id):
    """Get all documents for an agent"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        documents = Agent.get_documents(agent_id)
        return create_success_response(
            {'agent_id': agent_id, 'documents': documents}, 
            f"Found {len(documents)} documents"
        )
        
    except Exception as e:
        print(f"Error getting agent documents: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>/upload', methods=['POST'])
def upload_agent_document(agent_id):
    """Upload and process a document for an agent's knowledge base"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        # Verify agent exists
        agent = Agent.get_by_id(agent_id)
        if not agent:
            return create_error_response('Agent not found', 404)
        
        if 'file' not in request.files:
            return create_error_response('No file provided', 400)
        
        file = request.files['file']
        if file.filename == '':
            return create_error_response('No file selected', 400)
        
        if not allowed_file(file.filename):
            return create_error_response(f'File type not allowed. Supported: {", ".join(ALLOWED_EXTENSIONS)}', 400)
        
        # Create unique filename to avoid conflicts
        unique_filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        file.save(file_path)
        
        try:
            # Extract text content
            text_content = extract_text_from_file(file_path, file.filename)
            
            if not text_content.strip():
                # Clean up file and return error
                os.remove(file_path)
                return create_error_response('No text content found in file', 400)
            
            # Store document info in agent record (simplified, no Pinecone for now)
            document_info = {
                'id': str(uuid.uuid4()),
                'filename': file.filename,
                'stored_filename': unique_filename,
                'file_size': os.path.getsize(file_path),
                'file_path': file_path,
                'upload_date': datetime.now().isoformat(),
                'file_type': file.filename.split('.')[-1].lower() if '.' in file.filename else 'unknown',
                'text_preview': text_content[:200] + "..." if len(text_content) > 200 else text_content,
                'character_count': len(text_content)
            }
            
            # Add document to agent
            Agent.add_document(agent_id, document_info)
            
            return create_success_response(
                {
                    'agent_id': agent_id,
                    'filename': file.filename,
                    'document_info': document_info
                },
                f"Document '{file.filename}' uploaded successfully!"
            )
                
        except Exception as e:
            # Clean up temporary file if extraction fails
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e
            
    except Exception as e:
        print(f"Error uploading agent document: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>/chat', methods=['POST'])
def chat_with_agent(agent_id):
    """Chat with a specific agent using RAG"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        data = request.get_json()
        message = data.get('message')
        
        if not message:
            return create_error_response('Message is required', 400)
        
        # Get agent
        agent = Agent.get_by_id(agent_id)
        if not agent:
            return create_error_response('Agent not found', 404)
        
        # Generate response using agent's knowledge base and system prompt
        response = generate_brain_response(
            brain_id=agent['brain_id'], 
            user_message=message, 
            brain_prompt=agent['system_prompt']
        )
        
        # Log conversation
        conversation_entry = {
            'type': 'chat',
            'user_message': message,
            'agent_response': response,
            'response_time': 1.2  # You could measure actual response time
        }
        Agent.log_conversation(agent_id, conversation_entry)
        
        # Update performance metrics
        metrics = agent.get('performance_metrics', {})
        metrics['total_interactions'] = metrics.get('total_interactions', 0) + 1
        metrics['last_active'] = datetime.now().isoformat()
        Agent.update_performance_metrics(agent_id, metrics)
        
        return create_success_response({
            'agent_id': agent_id,
            'agent_name': agent['agent_name'],
            'message': message,
            'response': response,
            'timestamp': datetime.now().isoformat()
        }, "Chat response generated successfully")
        
    except Exception as e:
        print(f"Error chatting with agent: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>/communicate', methods=['POST'])
def initiate_agent_communication(agent_id):
    """Initiate communication between agents in the same brain"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        data = request.get_json()
        to_agent_id = data.get('to_agent_id')
        message = data.get('message')
        task_context = data.get('task_context')
        
        if not to_agent_id or not message:
            return create_error_response('to_agent_id and message are required', 400)
        
        # Initiate communication
        communication = Agent.initiate_agent_communication(
            from_agent_id=agent_id,
            to_agent_id=to_agent_id,
            message=message,
            task_context=task_context
        )
        
        return create_success_response(communication, "Agent communication initiated successfully")
        
    except Exception as e:
        print(f"Error initiating agent communication: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/brains/<brain_id>/agents/communicate', methods=['GET'])
def get_brain_agents_for_communication(brain_id):
    """Get all agents in a brain for communication purposes"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        exclude_agent_id = request.args.get('exclude_agent_id')
        agents = Agent.get_brain_agents_for_communication(brain_id, exclude_agent_id)
        
        return create_success_response(agents, f"Found {len(agents)} agents available for communication")
        
    except Exception as e:
        print(f"Error getting brain agents for communication: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>/communications', methods=['GET'])
def get_agent_communications(agent_id):
    """Get communication history for an agent"""
    try:
        if not mongo or not mongo.db:
            return create_error_response('Database not available', 500)
            
        # Get communications where this agent is involved
        communications = list(mongo.db.agent_communications.find({
            '$or': [
                {'from_agent_id': agent_id},
                {'to_agent_id': agent_id}
            ]
        }).sort('timestamp', -1).limit(50))
        
        # Convert ObjectId to string
        for comm in communications:
            comm['_id'] = str(comm['_id'])
        
        return create_success_response(communications, f"Found {len(communications)} communications")
        
    except Exception as e:
        print(f"Error getting agent communications: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>/performance', methods=['GET'])
def get_agent_performance(agent_id):
    """Get performance metrics for an agent"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        agent = Agent.get_by_id(agent_id)
        if not agent:
            return create_error_response('Agent not found', 404)
        
        performance_data = {
            'agent_id': agent_id,
            'agent_name': agent['agent_name'],
            'performance_metrics': agent.get('performance_metrics', {}),
            'status': agent.get('status', 'unknown'),
            'capabilities': agent.get('capabilities', {}),
            'document_count': len(agent.get('documents', [])),
            'last_updated': agent.get('updated_at')
        }
        
        return create_success_response(performance_data, "Performance metrics retrieved successfully")
        
    except Exception as e:
        print(f"Error getting agent performance: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/brains/<brain_id>/collaborative-task', methods=['POST'])
def execute_collaborative_task(brain_id):
    """Execute a collaborative task using multiple agents in a brain"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        data = request.get_json()
        task_description = data.get('task_description')
        agent_ids = data.get('agent_ids', [])
        
        if not task_description:
            return create_error_response('task_description is required', 400)
        
        if not agent_ids or len(agent_ids) < 2:
            return create_error_response('At least 2 agents are required for collaboration', 400)
        
        # Get all agents involved
        agents = []
        for agent_id in agent_ids:
            agent = Agent.get_by_id(agent_id)
            if agent and agent['brain_id'] == brain_id:
                agents.append(agent)
        
        if len(agents) != len(agent_ids):
            return create_error_response('One or more agents not found or not in the specified brain', 400)
        
        # Create collaboration record
        collaboration = {
            'collaboration_id': str(ObjectId()),
            'brain_id': brain_id,
            'task_description': task_description,
            'participating_agents': [
                {
                    'agent_id': agent['_id'],
                    'agent_name': agent['agent_name'],
                    'role': agent['role_description']
                } for agent in agents
            ],
            'status': 'initiated',
            'created_at': datetime.now(),
            'messages': []
        }
        
        # Store collaboration
        result = mongo.db.collaborations.insert_one(collaboration)
        collaboration['_id'] = str(result.inserted_id)
        
        # Log collaboration initiation for all agents
        for agent in agents:
            log_entry = {
                'type': 'collaboration_initiated',
                'collaboration_id': collaboration['collaboration_id'],
                'task_description': task_description,
                'participating_agents': [a['agent_name'] for a in agents if a['_id'] != agent['_id']]
            }
            Agent.log_conversation(agent['_id'], log_entry)
        
        return create_success_response(collaboration, "Collaborative task initiated successfully")
        
    except Exception as e:
        print(f"Error executing collaborative task: {e}")
        return create_error_response(str(e), 500)

# Add utility routes for agent management
@agent_routes.route('/api/agents/search', methods=['GET'])
def search_agents():
    """Search agents across all brains"""
    try:
        if not mongo or not mongo.db:
            return create_error_response('Database not available', 500)
            
        query = request.args.get('q', '')
        brain_id = request.args.get('brain_id')
        
        # Build search query
        search_query = {}
        if brain_id:
            search_query['brain_id'] = brain_id
            
        if query:
            search_query['$or'] = [
                {'agent_name': {'$regex': query, '$options': 'i'}},
                {'role_description': {'$regex': query, '$options': 'i'}}
            ]
        
        agents = list(mongo.db.agents.find(search_query).limit(20))
        
        # Convert ObjectId to string
        for agent in agents:
            agent['_id'] = str(agent['_id'])
        
        return create_success_response(agents, f"Found {len(agents)} agents")
        
    except Exception as e:
        print(f"Error searching agents: {e}")
        return create_error_response(str(e), 500)

@agent_routes.route('/api/agents/<agent_id>/documents/<document_id>', methods=['DELETE'])
def delete_agent_document(agent_id, document_id):
    """Delete a document from an agent's knowledge base"""
    try:
        if not Agent:
            return create_error_response('Agent model not available', 500)
            
        # Verify agent exists
        agent = Agent.get_by_id(agent_id)
        if not agent:
            return create_error_response('Agent not found', 404)
        
        # Remove document from agent's record
        success = Agent.remove_document(agent_id, document_id)
        if not success:
            return create_error_response('Document not found or failed to remove', 404)
        
        try:
            # Delete related vectors from Pinecone (if implemented)
            # This would require querying Pinecone for vectors with matching document_id metadata
            # and then deleting them. Implementation depends on your Pinecone setup.
            pass
        except Exception as e:
            print(f"Warning: Failed to delete document vectors from Pinecone: {e}")
        
        return create_success_response(
            {'agent_id': agent_id, 'document_id': document_id},
            "Document deleted successfully"
        )
        
    except Exception as e:
        print(f"Error deleting agent document: {e}")
        return create_error_response(str(e), 500)
