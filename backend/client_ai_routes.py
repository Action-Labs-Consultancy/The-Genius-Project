"""
Enhanced Client Management with AI Processing
Handles client operations with MongoDB and AI analysis
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
import openai
from mongo_db import mongo
import logging
import json
import os
import requests
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
LLAMA_API_URL = os.getenv('LLAMA_API_URL', 'http://localhost:8080')
USE_MOCK_AI = os.getenv('USE_MOCK_AI', 'false').lower() == 'true'
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

client_ai_bp = Blueprint('client_ai', __name__)

def call_ai_service(prompt, context="", max_tokens=200):
    """Call AI service (OpenAI or Llama) for processing"""
    try:
        # Use mock AI for demonstration when enabled
        if USE_MOCK_AI:
            logger.info("Using mock AI service for demonstration")
            return "This is a mock AI response for testing purposes."
        
        elif OPENAI_API_KEY:
            # Set OpenAI API key
            openai.api_key = OPENAI_API_KEY
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant. Answer clearly and concisely."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        else:
            # Use Llama API as fallback
            system_prompt = "You are a helpful assistant. Answer clearly and concisely."
            full_prompt = f"{system_prompt}\nUser: {prompt}\nAssistant:"
            
            payload = {
                "prompt": full_prompt,
                "max_tokens": max_tokens,
                "temperature": 0.7,
                "stop": ["\n\nUser:", "\n\nSystem:"]
            }
            
            response = requests.post(
                f"{LLAMA_API_URL}/completion",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('content', data.get('response', '')).strip()
            else:
                logger.error(f"Llama API error: {response.status_code}")
                return "AI processing temporarily unavailable."
                
    except Exception as e:
        logger.error(f"AI service error: {str(e)}")
        return "AI analysis completed with limited processing. Please review content manually."

@client_ai_bp.route('/api/clients', methods=['POST'])
def create_enhanced_client():
    """Create a new client with enhanced workflow support"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Client name is required'}), 400
        
        # Create client using direct MongoDB collection
        collection = mongo.get_collection('clients')
        
        client_data = {
            'name': data['name'],
            'project_type': data.get('project_type', 'Marketing'),
            'contract_type': data.get('contract_type', ''),
            'contract_specify': data.get('contract_specify', ''),
            'created_by': data.get('created_by'),
            'created_at': datetime.utcnow(),
            'status': 'onboarding',
            'knowledge_base': [],
            'documents': []
        }
        
        # Insert into MongoDB
        result = collection.insert_one(client_data)
        
        # Return client data with ID
        client_data['id'] = str(result.inserted_id)
        client_data['created_at'] = client_data['created_at'].isoformat()
        
        logger.info(f"Created new client: {client_data['name']} with ID: {client_data['id']}")
        return jsonify(client_data), 201
        
    except Exception as e:
        logger.error(f"Error creating client: {str(e)}")
        return jsonify({'error': 'Failed to create client'}), 500

@client_ai_bp.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients"""
    try:
        collection = mongo.get_collection('clients')
        clients = []
        
        for client in collection.find():
            client['id'] = str(client['_id'])
            del client['_id']
            if 'created_at' in client and hasattr(client['created_at'], 'isoformat'):
                client['created_at'] = client['created_at'].isoformat()
            clients.append(client)
        
        return jsonify(clients), 200
        
    except Exception as e:
        logger.error(f"Error fetching clients: {str(e)}")
        return jsonify({'error': 'Failed to fetch clients'}), 500

@client_ai_bp.route('/api/clients/<client_id>', methods=['GET'])
def get_client(client_id):
    """Get a specific client"""
    try:
        collection = mongo.get_collection('clients')
        
        client = collection.find_one({'_id': ObjectId(client_id)})
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        client['id'] = str(client['_id'])
        del client['_id']
        if 'created_at' in client and hasattr(client['created_at'], 'isoformat'):
            client['created_at'] = client['created_at'].isoformat()
        
        return jsonify(client), 200
        
    except Exception as e:
        logger.error(f"Error fetching client: {str(e)}")
        return jsonify({'error': 'Failed to fetch client'}), 500

@client_ai_bp.route('/api/clients/<client_id>/ai-analyze', methods=['POST'])
def analyze_client_with_ai(client_id):
    """Analyze client data using AI"""
    try:
        data = request.get_json()
        analysis_type = data.get('type', 'general')
        content = data.get('content', '')
        
        # Create appropriate prompt based on analysis type
        if analysis_type == 'scope':
            prompt = f"Analyze this project scope and provide insights: {content}"
        elif analysis_type == 'brandbook':
            prompt = f"Analyze this brand book and provide strategic recommendations: {content}"
        else:
            prompt = f"Analyze this content and provide insights: {content}"
        
        # Get AI analysis
        analysis_result = call_ai_service(prompt, max_tokens=500)
        
        # Store analysis in client record
        collection = mongo.get_collection('clients')
        
        collection.update_one(
            {'_id': ObjectId(client_id)},
            {
                '$push': {
                    'knowledge_base': {
                        'type': analysis_type,
                        'content': content,
                        'analysis': analysis_result,
                        'timestamp': datetime.utcnow()
                    }
                }
            }
        )
        
        return jsonify({
            'analysis': analysis_result,
            'type': analysis_type
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing client data: {str(e)}")
        return jsonify({'error': 'Failed to analyze client data'}), 500

# Health check endpoint
@client_ai_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'mongodb_connected': mongo.db is not None}), 200
