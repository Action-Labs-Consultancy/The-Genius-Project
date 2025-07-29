"""Brain management routes"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from models.brain import Brain
from config.mongodb import get_mongo
from bson import ObjectId
from pinecone_utils import store_text_in_pinecone, query_pinecone, generate_brain_response
import uuid
import fitz  # PyMuPDF for PDF processing
import docx  # python-docx for Word documents

brain_routes = Blueprint('brain_routes', __name__)

# Configure upload settings
UPLOAD_FOLDER = 'uploads/knowledge_base'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'md'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path, filename):
    """Extract text content from uploaded files"""
    try:
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        if file_ext == 'txt' or file_ext == 'md':
            with open(file_path, 'r', encoding='utf-8') as f:
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

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into overlapping chunks for better embedding"""
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to break at sentence boundary
        if end < len(text):
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)
            
            if break_point > start + chunk_size // 2:
                chunk = text[start:break_point + 1]
                end = break_point + 1
        
        chunks.append(chunk.strip())
        start = end - overlap
        
        if start >= len(text):
            break
    
    return chunks

@brain_routes.route('/api/brains', methods=['GET'])
def get_brains():
    """Get all brains with cross-LAN visibility"""
    try:
        # Ensure MongoDB connection for cross-LAN brain visibility
        from mongo_db import mongo
        if not mongo.db:
            mongodb_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI')
            if mongodb_uri:
                mongo.connect(mongodb_uri)
                print("[BRAINS] Reconnected to MongoDB for cross-LAN access")
        
        if not mongo.db:
            return jsonify({
                'error': 'Database not available',
                'message': 'MongoDB connection required for cross-LAN brain visibility',
                'brains': []
            }), 503
        
        # Get all brains from shared MongoDB
        brains = Brain.get_all()
        
        # Add debug info for LAN troubleshooting
        response_data = {
            'success': True,
            'message': 'Brains retrieved successfully',
            'data': brains,
            'debug': {
                'brain_count': len(brains),
                'database_connected': bool(mongo.db),
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"[BRAINS] Error fetching brains: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve brains',
            'brains': []
        }), 500

@brain_routes.route('/api/brains', methods=['POST'])
def create_brain():
    """Create a new brain with proper MongoDB saving"""
    try:
        # Ensure MongoDB connection
        from mongo_db import mongo
        if not mongo.db:
            mongodb_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI')
            if mongodb_uri:
                mongo.connect(mongodb_uri)
        
        if not mongo.db:
            return jsonify({'error': 'Database not available for brain creation'}), 503
        
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400
        
        # Create brain with proper field mapping
        brain = Brain.create(
            name=data['name'],
            description=data.get('description', f"A brain with {data.get('tone', 'professional')} personality"),
            system_prompt=data.get('prompt', data.get('system_prompt', 'You are a helpful AI assistant.')),
            user_id=data.get('user_id')
        )
        
        # Store brain prompt in Pinecone if provided
        if brain and data.get('prompt'):
            try:
                metadata = [{
                    'brain_id': str(brain['_id']),
                    'user_id': data.get('user_id'),
                    'type': 'brain_prompt',
                    'created_at': datetime.now().isoformat()
                }]
                
                store_text_in_pinecone(
                    texts=[data['prompt']], 
                    metadata_list=metadata
                )
                print(f"[BRAIN] Stored brain prompt in Pinecone for brain {brain['_id']}")
            except Exception as e:
                print(f"[BRAIN] Warning: Failed to store brain prompt in Pinecone: {e}")
        
        print(f"[BRAIN] Successfully created brain: {brain['name']} with ID: {brain['_id']}")
        return jsonify({
            'success': True,
            'message': 'Brain created successfully',
            'brain': brain
        }), 201
        
    except Exception as e:
        print(f"[BRAIN] Error creating brain: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to create brain'
        }), 500

@brain_routes.route('/api/brains/<brain_id>/knowledge-base/upload', methods=['POST'])
def upload_to_knowledge_base(brain_id):
    """Upload a file to a brain's knowledge base and store in Pinecone"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Verify brain exists
        brain = Brain.get_by_id(brain_id)
        if not brain:
            return jsonify({'error': 'Brain not found'}), 404
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Extract text content
        text_content = extract_text_from_file(file_path, filename)
        if not text_content.strip():
            return jsonify({'error': 'No text content could be extracted from the file'}), 400
        
        # Chunk the text for better embedding
        text_chunks = chunk_text(text_content)
        
        # Prepare metadata for each chunk
        metadata_list = []
        chunk_ids = []
        
        for i, chunk in enumerate(text_chunks):
            chunk_id = f"{brain_id}_{unique_filename}_{i}"
            chunk_ids.append(chunk_id)
            
            metadata_list.append({
                'id': chunk_id,
                'brain_id': brain_id,
                'user_id': brain.get('user_id'),
                'filename': filename,
                'file_path': file_path,
                'chunk_index': i,
                'total_chunks': len(text_chunks),
                'type': 'knowledge_base_document',
                'created_at': datetime.now().isoformat()
            })
        
        # Store in Pinecone
        success = store_text_in_pinecone(text_chunks, metadata_list)
        
        if not success:
            return jsonify({'error': 'Failed to store document in knowledge base'}), 500
        
        # Update brain's knowledge base record in MongoDB
        mongo = get_mongo()
        document_record = {
            'filename': filename,
            'file_path': file_path,
            'chunk_count': len(text_chunks),
            'chunk_ids': chunk_ids,
            'uploaded_at': datetime.now(),
            'text_preview': text_content[:500] + '...' if len(text_content) > 500 else text_content
        }
        
        mongo.db.brains.update_one(
            {'_id': ObjectId(brain_id)},
            {
                '$push': {'knowledge_base': document_record},
                '$set': {'updated_at': datetime.now()}
            }
        )
        
        return jsonify({
            'message': 'File uploaded and processed successfully',
            'filename': filename,
            'chunks_created': len(text_chunks),
            'text_preview': text_content[:500] + '...' if len(text_content) > 500 else text_content
        })
        
    except Exception as e:
        print(f"Error uploading to knowledge base: {e}")
        return jsonify({'error': str(e)}), 500

@brain_routes.route('/api/brains/<brain_id>/chat', methods=['POST'])
def chat_with_brain(brain_id):
    """Chat with a brain using its knowledge base and prompt"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message']
        user_id = data.get('user_id')
        
        # Verify brain exists
        brain = Brain.get_by_id(brain_id)
        if not brain:
            return jsonify({'error': 'Brain not found'}), 404
        
        # Query Pinecone for relevant context
        relevant_docs = query_pinecone(
            question=user_message,
            brain_id=brain_id,
            user_id=user_id,
            top_k=5
        )
        
        # Generate response using brain's prompt and context
        brain_prompt = brain.get('prompt', '')
        response_data = generate_brain_response(
            question=user_message,
            context_docs=relevant_docs,
            brain_prompt=brain_prompt
        )
        
        # Save conversation to MongoDB
        mongo = get_mongo()
        conversation_record = {
            'brain_id': brain_id,
            'user_id': user_id,
            'user_message': user_message,
            'ai_response': response_data['response'],
            'context_used': response_data['context_used'],
            'sources': response_data['sources'],
            'timestamp': datetime.now()
        }
        
        mongo.db.conversations.insert_one(conversation_record)
        
        return jsonify({
            'response': response_data['response'],
            'context_used': response_data['context_used'],
            'sources': len(response_data['sources']),
            'brain_name': brain['name']
        })
        
    except Exception as e:
        print(f"Error in brain chat: {e}")
        return jsonify({'error': str(e)}), 500
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        file.save(file_path)
        file_size = os.path.getsize(file_path)

        success = Brain.add_to_knowledge_base(
            brain_id=brain_id,
            file_info={
                'filename': filename,
                'path': file_path,
                'size': file_size,
                'uploaded_at': datetime.now()
            }
        )

        if not success:
            os.remove(file_path)
            return jsonify({'error': 'Failed to update brain'}), 500

        return jsonify({
            'message': 'File uploaded successfully',
            'file': {
                'name': filename,
                'size': file_size,
                'uploaded_at': datetime.now().isoformat()
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@brain_routes.route('/api/brains/<brain_id>', methods=['GET'])
def get_brain(brain_id):
    """Get a specific brain"""
    try:
        brain = Brain.get_by_id(brain_id)
        if not brain:
            return jsonify({'error': 'Brain not found'}), 404
        return jsonify(brain)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@brain_routes.route('/api/brains/<brain_id>', methods=['PUT'])
def update_brain(brain_id):
    """Update a brain"""
    try:
        data = request.get_json()
        brain = Brain.update(brain_id, data)
        if not brain:
            return jsonify({'error': 'Brain not found'}), 404
        return jsonify(brain)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@brain_routes.route('/api/brains/<brain_id>', methods=['DELETE'])
def delete_brain(brain_id):
    """Delete a brain"""
    try:
        if Brain.delete(brain_id):
            return jsonify({'message': 'Brain deleted successfully'})
        return jsonify({'error': 'Brain not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@brain_routes.route('/api/brains/<brain_id>/documents', methods=['GET'])
def get_brain_documents(brain_id):
    """Get all documents for a brain"""
    try:
        docs = Brain.get_knowledge_base(brain_id)
        # Format for frontend
        documents = []
        for doc in docs:
            documents.append({
                'name': doc.get('filename'),
                'size': doc.get('size'),
                'uploaded_at': doc.get('uploaded_at'),
                'path': doc.get('path')
            })
        return jsonify({'documents': documents})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@brain_routes.route('/api/brains/<brain_id>/documents/<filename>', methods=['DELETE'])
def delete_brain_document(brain_id, filename):
    """Delete a document from a brain's knowledge base"""
    try:
        docs = Brain.get_knowledge_base(brain_id)
        doc_to_delete = next((d for d in docs if d.get('filename') == filename), None)
        if not doc_to_delete:
            return jsonify({'error': 'Document not found'}), 404
        # Remove file from disk
        try:
            os.remove(doc_to_delete['path'])
        except Exception:
            pass
        # Remove from MongoDB
        mongo = get_mongo()
        result = mongo.db.brains.update_one(
            {'_id': ObjectId(brain_id)},
            {'$pull': {'knowledge_base': {'filename': filename}}}
        )
        if result.modified_count > 0:
            return jsonify({'message': 'Document deleted'})
        else:
            return jsonify({'error': 'Failed to delete document'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@brain_routes.route('/api/brains/<brain_id>/upload', methods=['POST'])
def upload_to_knowledge_base_alias(brain_id):
    return upload_to_knowledge_base(brain_id)
