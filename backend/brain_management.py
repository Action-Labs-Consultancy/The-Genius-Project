"""
Comprehensive Brain Management Routes
Handles brain creation, document upload, embedding, and chat functionality
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF for PDF processing
import docx  # python-docx for Word documents
from bson import ObjectId

# Import our utilities
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))
try:
    from brain import Brain
except ImportError:
    print("[BRAIN MANAGEMENT] Warning: Could not import Brain model")
    Brain = None
try:
    from mongo_db import mongo
except ImportError:
    print("[BRAIN MANAGEMENT] Warning: Could not import mongo from mongo_db")
    mongo = None
from pinecone_utils import (
    store_text_in_pinecone, 
    query_pinecone, 
    generate_brain_response,
    chunk_document_text,
    delete_brain_vectors
)

brain_api = Blueprint('brain_api', __name__)

def get_mongo():
    """Get mongo connection"""
    return mongo

# Configure upload settings
UPLOAD_FOLDER = 'uploads/knowledge_base'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'md'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if uploaded file has allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path, filename):
    """Extract text content from uploaded files."""
    try:
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        if file_ext == 'txt' or file_ext == 'md':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        
        elif file_ext == 'pdf':
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        
        elif file_ext in ['doc', 'docx']:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        
        else:
            return ""
            
    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
        return ""

def create_success_response(data, message="Success", status_code=200):
    """Create standardized success response."""
    return jsonify({
        'success': True,
        'message': message,
        'data': data
    }), status_code

def create_error_response(message, status_code=400, details=None):
    """Create standardized error response."""
    response = {
        'success': False,
        'error': message
    }
    if details:
        response['details'] = details
    return jsonify(response), status_code

def log_brain_activity(action, brain_id, brain_name, user_id=None, details=None):
    """Log brain-related activities"""
    try:
        if mongo is None or mongo.db is None:
            return
            
        log_entry = {
            'timestamp': datetime.now(),
            'event_type': 'brain_management',
            'action': action,
            'user': user_id or 'system',
            'role': 'admin',
            'project': 'AI Brains System',
            'task': f'{action} brain',
            'details': details or f'Brain: {brain_name} (ID: {brain_id})',
            'brain_id': brain_id,
            'brain_name': brain_name,
            'status': 'completed',
            'metadata': {
                'system': 'brain_management',
                'version': '1.0'
            }
        }
        
        mongo.db.task_events.insert_one(log_entry)
        print(f"[BRAIN LOG] {action}: {brain_name}")
        
    except Exception as e:
        print(f"[BRAIN LOG ERROR] Failed to log activity: {e}")

@brain_api.route('/api/brains', methods=['GET'])
def get_brains():
    """Get all brains with document counts."""
    try:
        if mongo is None or mongo.db is None:
            return create_error_response('Database not available', 500)
            
        brains = list(mongo.db.brains.find())
        
        # Convert ObjectId to string and add document counts
        for brain in brains:
            brain['_id'] = str(brain['_id'])
            # Convert datetime objects to ISO strings
            if 'created_at' in brain and brain['created_at']:
                brain['created_at'] = brain['created_at'].isoformat() if hasattr(brain['created_at'], 'isoformat') else str(brain['created_at'])
            if 'updated_at' in brain and brain['updated_at']:
                brain['updated_at'] = brain['updated_at'].isoformat() if hasattr(brain['updated_at'], 'isoformat') else str(brain['updated_at'])
            
            # Add document count
            brain['document_count'] = len(brain.get('knowledge_base', []))
            
            # Ensure knowledge_base exists
            if 'knowledge_base' not in brain:
                brain['knowledge_base'] = []
            
            # Ensure usage_stats exists
            if 'usage_stats' not in brain:
                brain['usage_stats'] = {
                    'total_conversations': 0,
                    'total_messages': 0,
                    'last_used': None
                }
        
        return create_success_response(brains, "Brains retrieved successfully")
    
    except Exception as e:
        print(f"Error fetching brains: {e}")
        return create_error_response(f"Failed to fetch brains: {str(e)}", 500)

@brain_api.route('/api/brains', methods=['POST'])
def create_brain():
    """Create a new brain with embedding storage."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'name' not in data:
            return create_error_response('Brain name is required', 400)
        
        if not data['name'].strip():
            return create_error_response('Brain name cannot be empty', 400)
        
        # Prepare brain data
        brain_data = {
            'name': data['name'].strip(),
            'description': data.get('description', '').strip(),
            'personality': data.get('personality', 'assistant'),
            'system_prompt': data.get('system_prompt', data.get('prompt', 'You are a helpful AI assistant. Provide accurate, concise, and helpful responses based on the knowledge base and context provided.')).strip(),
            'knowledge_base': [],
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'usage_stats': {
                'total_conversations': 0,
                'total_messages': 0,
                'last_used': None
            }
        }
        
        # Create brain in MongoDB
        if mongo is None or mongo.db is None:
            return create_error_response('Database not available', 500)
            
        result = mongo.db.brains.insert_one(brain_data)
        brain_id = str(result.inserted_id)
        
        # Store brain prompt in Pinecone for RAG if provided
        if brain_data['system_prompt'] and brain_data['system_prompt'].strip():
            try:
                metadata = [{
                    'id': f"brain_prompt_{brain_id}",
                    'brain_id': brain_id,
                    'type': 'brain_prompt',
                    'filename': f"brain_prompt_{brain_data['name']}.txt",
                    'created_at': datetime.now().isoformat()
                }]
                
                success = store_text_in_pinecone([brain_data['system_prompt']], metadata)
                if success:
                    print(f"Stored brain prompt in Pinecone for brain {brain_id}")
                else:
                    print(f"Warning: Failed to store brain prompt in Pinecone for brain {brain_id}")
            
            except Exception as e:
                print(f"Warning: Failed to store brain prompt in Pinecone: {e}")
        
        # Prepare response data
        response_brain = brain_data.copy()
        response_brain['_id'] = brain_id
        response_brain['created_at'] = response_brain['created_at'].isoformat()
        response_brain['updated_at'] = response_brain['updated_at'].isoformat()
        response_brain['document_count'] = 0
        
        log_brain_activity('create', brain_id, brain_data['name'])
        
        return create_success_response(response_brain, "Brain created successfully", 201)
    
    except Exception as e:
        print(f"Error creating brain: {e}")
        return create_error_response(f"Failed to create brain: {str(e)}", 500)

@brain_api.route('/api/brains/<brain_id>', methods=['GET'])
def get_brain(brain_id):
    """Get a specific brain by ID."""
    try:
        mongo = get_mongo()
        brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
        
        if not brain:
            return create_error_response('Brain not found', 404)
        
        # Format brain data
        brain['_id'] = str(brain['_id'])
        if 'created_at' in brain and brain['created_at']:
            brain['created_at'] = brain['created_at'].isoformat() if hasattr(brain['created_at'], 'isoformat') else str(brain['created_at'])
        if 'updated_at' in brain and brain['updated_at']:
            brain['updated_at'] = brain['updated_at'].isoformat() if hasattr(brain['updated_at'], 'isoformat') else str(brain['updated_at'])
        
        brain['document_count'] = len(brain.get('knowledge_base', []))
        
        return create_success_response(brain, "Brain retrieved successfully")
    
    except Exception as e:
        print(f"Error fetching brain {brain_id}: {e}")
        return create_error_response(f"Failed to fetch brain: {str(e)}", 500)

@brain_api.route('/api/brains/<brain_id>', methods=['PUT'])
def update_brain(brain_id):
    """Update an existing brain."""
    try:
        data = request.get_json()
        
        if not data:
            return create_error_response('No data provided', 400)
        
        # Prepare update data
        update_data = {'updated_at': datetime.now()}
        
        if 'name' in data and data['name'].strip():
            update_data['name'] = data['name'].strip()
        if 'description' in data:
            update_data['description'] = data['description'].strip()
        if 'personality' in data:
            update_data['personality'] = data['personality']
        if 'system_prompt' in data:
            update_data['system_prompt'] = data['system_prompt'].strip()
        elif 'prompt' in data:  # For backward compatibility
            update_data['system_prompt'] = data['prompt'].strip()
        
        # Update brain in MongoDB
        mongo = get_mongo()
        result = mongo.db.brains.update_one(
            {'_id': ObjectId(brain_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return create_error_response('Brain not found', 404)
        
        # Update brain prompt in Pinecone if prompt was changed
        if 'system_prompt' in update_data and update_data['system_prompt']:
            try:
                metadata = [{
                    'id': f"brain_prompt_{brain_id}",
                    'brain_id': brain_id,
                    'type': 'brain_prompt',
                    'filename': f"brain_prompt_{update_data.get('name', 'unknown')}.txt",
                    'updated_at': datetime.now().isoformat()
                }]
                
                success = store_text_in_pinecone([update_data['system_prompt']], metadata)
                if success:
                    print(f"Updated brain prompt in Pinecone for brain {brain_id}")
                else:
                    print(f"Warning: Failed to update brain prompt in Pinecone for brain {brain_id}")
            
            except Exception as e:
                print(f"Warning: Failed to update brain prompt in Pinecone: {e}")
        
        log_brain_activity('update', brain_id, update_data.get('name', ''), details=str(update_data))
        
        return create_success_response(None, "Brain updated successfully")
    
    except Exception as e:
        print(f"Error updating brain {brain_id}: {e}")
        return create_error_response(f"Failed to update brain: {str(e)}", 500)

@brain_api.route('/api/brains/<brain_id>', methods=['DELETE'])
def delete_brain(brain_id):
    """Delete a brain and all associated data."""
    try:
        mongo = get_mongo()
        
        # Check if brain exists
        brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
        if not brain:
            return create_error_response('Brain not found', 404)
        
        # Delete vectors from Pinecone
        try:
            delete_brain_vectors(brain_id)
            print(f"Deleted vectors for brain {brain_id} from Pinecone")
        except Exception as e:
            print(f"Warning: Failed to delete brain vectors from Pinecone: {e}")
        
        # Delete brain from MongoDB
        result = mongo.db.brains.delete_one({'_id': ObjectId(brain_id)})
        
        if result.deleted_count == 0:
            return create_error_response('Brain not found', 404)
        
        log_brain_activity('delete', brain_id, brain.get('name', ''))
        
        return create_success_response(None, "Brain deleted successfully")
    
    except Exception as e:
        print(f"Error deleting brain {brain_id}: {e}")
        return create_error_response(f"Failed to delete brain: {str(e)}", 500)

@brain_api.route('/api/brains/<brain_id>/upload', methods=['POST'])
def upload_brain_document(brain_id):
    """Upload and process a document for a brain's knowledge base."""
    try:
        # Check if brain exists
        mongo = get_mongo()
        brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
        if not brain:
            return create_error_response('Brain not found', 404)
        
        # Check if file was provided
        if 'file' not in request.files:
            return create_error_response('No file provided', 400)
        
        file = request.files['file']
        if file.filename == '':
            return create_error_response('No file selected', 400)
        
        if not allowed_file(file.filename):
            return create_error_response(f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}', 400)
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # Check file size
        if file_size > MAX_FILE_SIZE:
            os.remove(file_path)
            return create_error_response(f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB', 400)
        
        # Extract text content
        text_content = extract_text_from_file(file_path, filename)
        if not text_content.strip():
            os.remove(file_path)
            return create_error_response('No text content could be extracted from the file', 400)
        
        # Chunk the text for better embedding
        text_chunks = chunk_document_text(text_content)
        
        if not text_chunks:
            os.remove(file_path)
            return create_error_response('Failed to process document content', 400)
        
        # Prepare metadata for each chunk
        document_id = str(uuid.uuid4())
        metadata_list = []
        chunk_ids = []
        
        for i, chunk in enumerate(text_chunks):
            chunk_id = f"{brain_id}_{document_id}_{i}"
            chunk_ids.append(chunk_id)
            
            metadata_list.append({
                'id': chunk_id,
                'brain_id': brain_id,
                'document_id': document_id,
                'filename': filename,
                'chunk_index': i,
                'total_chunks': len(text_chunks),
                'type': 'knowledge_document',
                'created_at': datetime.now().isoformat()
            })
        
        # Try to store in Pinecone (optional - file will still be saved if this fails)
        embedding_success = store_text_in_pinecone(text_chunks, metadata_list)
        
        if not embedding_success:
            print(f"Warning: Failed to store embeddings for {filename}, but file will still be saved")
        
        # Create document record
        document_record = {
            'id': document_id,
            'filename': filename,
            'original_filename': file.filename,
            'file_path': file_path,
            'file_size': file_size,
            'chunk_count': len(text_chunks),
            'chunk_ids': chunk_ids if embedding_success else [],
            'text_preview': text_content[:500] + "..." if len(text_content) > 500 else text_content,
            'uploaded_at': datetime.now(),
            'processed': True,
            'embeddings_stored': embedding_success
        }
        
        # Update brain's knowledge base in MongoDB
        result = mongo.db.brains.update_one(
            {'_id': ObjectId(brain_id)},
            {
                '$push': {'knowledge_base': document_record},
                '$set': {'updated_at': datetime.now()}
            }
        )
        
        if result.modified_count == 0:
            return create_error_response('Failed to update brain knowledge base', 500)
        
        # Prepare response
        response_data = {
            'document_id': document_id,
            'filename': filename,
            'file_size': file_size,
            'chunks_created': len(text_chunks),
            'processing_status': 'completed',
            'embeddings_stored': embedding_success,
            'warning': None if embedding_success else 'File saved but embeddings could not be created (OpenAI API issue)'
        }
        
        log_brain_activity('upload_document', brain_id, brain.get('name', ''), 
                         details=f'Uploaded: {filename} ({file_size} bytes, {len(text_chunks)} chunks)')
        
        return create_success_response(response_data, "Document uploaded and processed successfully", 201)
    
    except Exception as e:
        print(f"Error uploading document to brain {brain_id}: {e}")
        # Clean up file if it exists
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        return create_error_response(f"Failed to upload document: {str(e)}", 500)

@brain_api.route('/api/brains/<brain_id>/chat', methods=['POST'])
def chat_with_brain(brain_id):
    """Chat with a brain using RAG (Retrieval Augmented Generation)."""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return create_error_response('Message is required', 400)
        
        # Get brain information
        mongo = get_mongo()
        brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
        
        if not brain:
            return create_error_response('Brain not found', 404)
        
        # Get the brain's custom system prompt
        brain_prompt = brain.get('system_prompt', brain.get('prompt', 'You are a helpful AI assistant. Provide accurate, concise, and helpful responses based on the knowledge base and context provided.'))
        
        # Generate response using brain's knowledge base and prompt
        ai_response = generate_brain_response(brain_id, message, brain_prompt)
        
        # Update usage stats
        mongo.db.brains.update_one(
            {'_id': ObjectId(brain_id)},
            {
                '$inc': {
                    'usage_stats.total_messages': 1
                },
                '$set': {
                    'usage_stats.last_used': datetime.now()
                }
            }
        )
        
        # Prepare response
        response_data = {
            'response': ai_response,
            'brain_id': brain_id,
            'brain_name': brain.get('name', 'Unknown'),
            'timestamp': datetime.now().isoformat()
        }
        
        return create_success_response(response_data, "Response generated successfully")
    
    except Exception as e:
        print(f"Error in brain chat for {brain_id}: {e}")
        return create_error_response(f"Failed to process chat message: {str(e)}", 500)

@brain_api.route('/api/brains/<brain_id>/documents', methods=['GET'])
def get_brain_documents(brain_id):
    """Get all documents in a brain's knowledge base."""
    try:
        mongo = get_mongo()
        brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
        
        if not brain:
            return create_error_response('Brain not found', 404)
        
        documents = brain.get('knowledge_base', [])
        
        # Format document data
        for doc in documents:
            if 'uploaded_at' in doc and hasattr(doc['uploaded_at'], 'isoformat'):
                doc['uploaded_at'] = doc['uploaded_at'].isoformat()
        
        response_data = {
            'documents': documents,
            'total_count': len(documents),
            'brain_id': brain_id,
            'brain_name': brain.get('name', 'Unknown')
        }
        
        return create_success_response(response_data, "Documents retrieved successfully")
    
    except Exception as e:
        print(f"Error fetching documents for brain {brain_id}: {e}")
        return create_error_response(f"Failed to fetch documents: {str(e)}", 500)

@brain_api.route('/api/brains/<brain_id>/documents/<document_id>', methods=['DELETE'])
def delete_brain_document(brain_id, document_id):
    """Delete a specific document from a brain's knowledge base."""
    try:
        mongo = get_mongo()
        brain = mongo.db.brains.find_one({'_id': ObjectId(brain_id)})
        
        if not brain:
            return create_error_response('Brain not found', 404)
        
        # Find the document in the knowledge base
        knowledge_base = brain.get('knowledge_base', [])
        document_to_delete = None
        
        for doc in knowledge_base:
            if doc.get('id') == document_id:
                document_to_delete = doc
                break
        
        if not document_to_delete:
            return create_error_response('Document not found', 404)
        
        # Delete from Pinecone using chunk IDs
        try:
            chunk_ids = document_to_delete.get('chunk_ids', [])
            if chunk_ids:
                import pinecone
                from pinecone import Pinecone
                
                if os.environ.get("PINECONE_API_KEY") and os.environ.get("PINECONE_INDEX_NAME"):
                    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
                    index = pc.Index(os.environ["PINECONE_INDEX_NAME"])
                    index.delete(ids=chunk_ids)
                    print(f"Deleted {len(chunk_ids)} chunks from Pinecone")
        except Exception as e:
            print(f"Warning: Failed to delete document from Pinecone: {e}")
        
        # Delete file from filesystem
        try:
            file_path = document_to_delete.get('file_path')
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                print(f"Deleted file: {file_path}")
        except Exception as e:
            print(f"Warning: Failed to delete file: {e}")
        
        # Remove document from brain's knowledge base
        result = mongo.db.brains.update_one(
            {'_id': ObjectId(brain_id)},
            {
                '$pull': {'knowledge_base': {'id': document_id}},
                '$set': {'updated_at': datetime.now()}
            }
        )
        
        if result.modified_count == 0:
            return create_error_response('Failed to remove document from brain', 500)
        
        return create_success_response(None, "Document deleted successfully")
    
    except Exception as e:
        print(f"Error deleting document {document_id} from brain {brain_id}: {e}")
        return create_error_response(f"Failed to delete document: {str(e)}", 500)

# Health check endpoint
@brain_api.route('/api/brains/health', methods=['GET'])
def health_check():
    """Health check for brain system."""
    try:
        # Check MongoDB connection
        mongo = get_mongo()
        mongo.db.command('ismaster')
        mongodb_status = "connected"
    except Exception as e:
        mongodb_status = f"error: {str(e)}"
    
    # Check Pinecone configuration
    pinecone_configured = bool(
        os.environ.get("PINECONE_API_KEY") and 
        os.environ.get("PINECONE_INDEX_NAME")
    )
    
    # Check OpenAI configuration
    openai_configured = bool(os.environ.get("OPENAI_API_KEY"))
    
    health_data = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'mongodb': mongodb_status,
            'pinecone_configured': pinecone_configured,
            'openai_configured': openai_configured
        }
    }
    
    return create_success_response(health_data, "Health check completed")
