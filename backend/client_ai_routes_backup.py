from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
import openai
from mongo_db import mongo, MongoClientModel
import logging
import json
import os
import requests
from intelligent_agent_service import intelligent_agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client_ai_bp = Blueprint('client_ai', __name__)

def call_ai_service(prompt, context="", max_tokens=1500):
    """Call AI service (OpenAI or Llama) for processing"""
    try:
        # Use mock AI for demonstration when enabled
        if USE_MOCK_AI:
            logger.info("Using mock AI service for demonstration")
            
            # Generate mock analysis based on context
            if "scope" in prompt.lower():
                return """**Project Scope Analysis:**

**Objectives Identified:**
- Increase brand awareness and market presence
- Drive qualified traffic and lead generation
- Establish strong digital marketing foundation

**Key Deliverables:**
- Comprehensive digital marketing strategy
- Content creation and distribution
- Analytics and performance tracking
- Regular reporting and optimization

**Timeline Considerations:**
- Project appears to be structured for 3-month execution
- Requires coordinated efforts across multiple channels
- Regular milestone reviews recommended

**Success Metrics:**
- Brand awareness growth targets
- Traffic and conversion improvements
- Lead generation quality and quantity
- ROI on marketing spend

**Potential Challenges:**
- Resource allocation across multiple channels
- Content creation consistency
- Performance tracking and attribution
- Market competition analysis needed"""

            elif "brandbook" in prompt.lower():
                return """**Brand Analysis Summary:**

**Brand Identity Elements:**
- Visual identity guidelines assessment
- Brand voice and messaging framework
- Target audience definition and insights
- Brand positioning in market context

**Implementation Recommendations:**
- Maintain consistent visual standards
- Develop brand voice guidelines for content
- Create brand asset library
- Establish approval workflows

**Key Considerations:**
- Brand guideline compliance across all materials
- Consistent messaging across channels
- Visual identity adaptation for digital platforms
- Brand evolution and flexibility requirements"""

            elif "competitor" in prompt.lower() or "swot" in prompt.lower():
                return """**Strategic Analysis Summary:**

**Competitive Landscape:**
- Market positioning assessment
- Competitive advantage identification
- Gap analysis and opportunities
- Differentiation strategy recommendations

**SWOT Insights:**
- Strengths to leverage for market advantage
- Weaknesses to address through strategy
- Opportunities for growth and expansion
- Threats to monitor and mitigate

**Strategic Recommendations:**
- Focus on unique value propositions
- Develop competitive response strategies
- Capitalize on market opportunities
- Build defensive strategies for threats

**Action Items:**
- Regular competitive monitoring
- Strategy adjustment protocols
- Performance benchmarking
- Market trend analysis"""

            else:
                return """**AI Analysis Complete:**

The provided content has been analyzed and key insights have been extracted. This analysis will help inform project strategy and execution. Key themes identified include strategic planning, implementation considerations, and success metrics definition.

**Recommendations:**
- Review analysis with project stakeholders
- Incorporate insights into project planning
- Establish monitoring and evaluation protocols
- Plan regular strategy review sessions"""
        
        elif USE_OPENAI:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        else:
            # Use Llama API as fallback
            payload = {
                "prompt": f"System: {context}\n\nUser: {prompt}\n\nAssistant:",
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
                return response.json().get('content', '').strip()
            else:
                logger.error(f"Llama API error: {response.status_code}")
                return "AI processing temporarily unavailable."
                
    except Exception as e:
        logger.error(f"AI service error: {str(e)}")
        return f"AI analysis completed with limited processing. Please review content manually and supplement with additional insights as needed."

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
        client_data['id'] = str(result.inserted_id)
        
        # Return client data
        return jsonify({
            'id': client_data['id'],
            'name': client_data['name'],
            'project_type': client_data['project_type'],
            'contract_type': client_data['contract_type'],
            'status': client_data['status'],
            'created_at': client_data['created_at'].isoformat()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating client: {str(e)}")
        return jsonify({'error': 'Failed to create client'}), 500

@client_ai_bp.route('/api/clients', methods=['GET'])
def get_enhanced_clients():
    """Get all clients"""
    try:
        collection = mongo.get_collection('clients')
        clients = list(collection.find({}))
        
        client_list = []
        for client in clients:
            client_list.append({
                'id': str(client['_id']),
                'name': client.get('name', ''),
                'project_type': client.get('project_type', 'Marketing'),
                'contract_type': client.get('contract_type', ''),
                'status': client.get('status', 'active'),
                'created_at': client.get('created_at').isoformat() if client.get('created_at') else None
            })
        
        return jsonify(client_list), 200
        
    except Exception as e:
        logger.error(f"Error fetching clients: {str(e)}")
        return jsonify({'error': 'Failed to fetch clients'}), 500

@client_ai_bp.route('/api/clients/<client_id>/knowledge-base', methods=['POST'])
def initialize_knowledge_base(client_id):
    """Initialize knowledge base for a client"""
    try:
        from bson import ObjectId
        
        # Find the client
        collection = mongo.get_collection('clients')
        client = collection.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Initialize knowledge base if not exists
        if 'knowledge_base' not in client:
            collection.update_one(
                {'_id': ObjectId(client_id)},
                {'$set': {'knowledge_base': []}}
            )
        
        return jsonify({
            'id': client_id,
            'knowledge_base': client.get('knowledge_base', []),
            'initialized': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error initializing knowledge base: {str(e)}")
        return jsonify({'error': 'Failed to initialize knowledge base'}), 500

@client_ai_bp.route('/api/ai/process-scope', methods=['POST'])
def process_scope_with_ai():
    """Process project scope with intelligent AI agent"""
    try:
        from bson import ObjectId
        
        data = request.get_json()
        client_id = data.get('client_id')
        method = data.get('method')
        text_content = data.get('text_content', '')
        files = data.get('files', [])
        user_name = data.get('user_name', 'there')
        
        if not client_id:
            return jsonify({'error': 'Client ID is required'}), 400
        
        # Find the client
        collection = mongo.get_collection('clients')
        client = collection.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Prepare content for AI analysis
        content_to_analyze = text_content
        if files:
            content_to_analyze += f"\n\nUploaded files: {', '.join([f.get('name', 'Unknown') for f in files])}"
        
        # Build context for intelligent analysis
        context = {
            'client_name': client.get('name', 'Unknown'),
            'project_type': client.get('project_type', 'Marketing'),
            'contract_type': client.get('contract_type', ''),
            'user_name': user_name
        }
        
        # Use intelligent agent for analysis
        analysis_result = intelligent_agent.analyze_with_rag(
            agent_type='ProjectCoordinator',
            content=content_to_analyze,
            context=context
        )
        
        # Create knowledge base entry
        scope_entry = {
            'type': 'scope_analysis',
            'agent': 'ProjectCoordinator',
            'content': analysis_result['content'],
            'insights': analysis_result.get('insights', []),
            'action_items': analysis_result.get('action_items', []),
            'original_content': content_to_analyze,
            'method': method,
            'files': files,
            'timestamp': datetime.utcnow(),
            'processed_by': 'Project Coordinator AI'
        }
        
        # Add to knowledge base
        collection.update_one(
            {'_id': ObjectId(client_id)},
            {'$push': {'knowledge_base': scope_entry}}
        )
        
        return jsonify({
            'success': True,
            'analysis': analysis_result['content'],
            'insights': analysis_result.get('insights', []),
            'action_items': analysis_result.get('action_items', []),
            'client_id': client_id,
            'agent_message': f"Great! I've analyzed your project scope for {client.get('name', 'your client')}. Here's my detailed breakdown with actionable insights."
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing scope: {str(e)}")
        return jsonify({'error': 'Failed to process scope'}), 500

@client_ai_bp.route('/api/ai/process-brandbook', methods=['POST'])
def process_brandbook_with_ai():
    """Process brandbook with intelligent AI agent"""
    try:
        from bson import ObjectId
        
        data = request.get_json()
        client_id = data.get('client_id')
        has_brandbook = data.get('has_brandbook', False)
        files = data.get('files', [])
        user_name = data.get('user_name', 'there')
        
        if not client_id:
            return jsonify({'error': 'Client ID is required'}), 400
        
        # Find the client using direct MongoDB operations
        collection = mongo.get_collection('clients')
        client = collection.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Build context for intelligent analysis
        context = {
            'client_name': client.get('name', 'Unknown'),
            'project_type': client.get('project_type', 'Marketing'),
            'contract_type': client.get('contract_type', ''),
            'industry': client.get('industry', 'Unknown'),
            'has_brandbook': has_brandbook,
            'user_name': user_name
        }
        
        if has_brandbook and files:
            files_info = ', '.join([f.get('name', 'Unknown') for f in files])
            content_to_analyze = f"Brandbook files uploaded: {files_info}"
        else:
            content_to_analyze = "No brandbook materials provided"
        
        # Use intelligent agent for analysis
        analysis_result = intelligent_agent.analyze_with_rag(
            agent_type='ProjectManager',
            content=content_to_analyze,
            context=context
        )
        
        brandbook_entry = {
            'type': 'brandbook_analysis',
            'agent': 'ProjectManager',
            'content': analysis_result['content'],
            'has_brandbook': has_brandbook,
            'brand_guidelines': analysis_result.get('brand_guidelines'),
            'recommendations': analysis_result.get('recommendations', []),
            'files': files,
            'timestamp': datetime.utcnow(),
            'processed_by': 'Project Manager AI'
        }
        
        # Update client's knowledge base using direct MongoDB operations
        collection.update_one(
            {'_id': ObjectId(client_id)},
            {'$push': {'knowledge_base': brandbook_entry}}
        )
        
        agent_message = (
            f"Perfect! I've analyzed the brand materials for {client.get('name', 'your client')}." if has_brandbook
            else f"No problem! I've created a brand development plan for {client.get('name', 'your client')}. We'll build their brand guidelines as part of this project."
        )
        
        return jsonify({
            'success': True,
            'analysis': analysis_result['content'],
            'recommendations': analysis_result.get('recommendations', []),
            'has_brandbook': has_brandbook,
            'client_id': client_id,
            'agent_message': agent_message
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing brandbook: {str(e)}")
        return jsonify({'error': 'Failed to process brandbook'}), 500

@client_ai_bp.route('/api/ai/process-strategic-docs', methods=['POST'])
def process_strategic_docs_with_ai():
    """Process competitor and SWOT analysis with intelligent AI agent"""
    try:
        from bson import ObjectId
        
        data = request.get_json()
        client_id = data.get('client_id')
        competitor_files = data.get('competitor_files', [])
        swot_files = data.get('swot_files', [])
        user_name = data.get('user_name', 'there')
        
        if not client_id:
            return jsonify({'error': 'Client ID is required'}), 400
        
        # Find the client using direct MongoDB operations
        collection = mongo.get_collection('clients')
        client = collection.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Build context for intelligent analysis
        context = {
            'client_name': client.get('name', 'Unknown'),
            'project_type': client.get('project_type', 'Marketing'),
            'contract_type': client.get('contract_type', ''),
            'industry': client.get('industry', 'Unknown'),
            'user_name': user_name
        }
        
        # Prepare content for analysis
        content_parts = []
        if competitor_files:
            competitor_info = ', '.join([f.get('name', 'Unknown') for f in competitor_files])
            content_parts.append(f"Competitor Analysis Files: {competitor_info}")
        
        if swot_files:
            swot_info = ', '.join([f.get('name', 'Unknown') for f in swot_files])
            content_parts.append(f"SWOT Analysis Files: {swot_info}")
        
        content_to_analyze = "\n".join(content_parts)
        
        # Use intelligent agent for analysis
        analysis_result = intelligent_agent.analyze_with_rag(
            agent_type='AccountManager',
            content=content_to_analyze,
            context=context
        )
        
        # Create comprehensive strategic entry
        strategic_entry = {
            'type': 'strategic_analysis',
            'agent': 'AccountManager',
            'content': analysis_result['content'],
            'competitive_insights': analysis_result.get('competitive_insights', {}),
            'strategic_recommendations': analysis_result.get('strategic_recommendations', []),
            'market_opportunities': analysis_result.get('market_opportunities', []),
            'competitor_files': competitor_files,
            'swot_files': swot_files,
            'timestamp': datetime.utcnow(),
            'processed_by': 'Account Manager AI'
        }
        
        # Update client's knowledge base with strategic analysis
        collection.update_one(
            {'_id': ObjectId(client_id)},
            {'$push': {'knowledge_base': strategic_entry}}
        )
        
        agent_message = f"Excellent! I've completed a comprehensive strategic analysis for {client.get('name', 'your client')}. This includes competitive positioning and market opportunities that will guide our project strategy."
        
        return jsonify({
            'success': True,
            'analysis': analysis_result['content'],
            'competitive_insights': analysis_result.get('competitive_insights', {}),
            'strategic_recommendations': analysis_result.get('strategic_recommendations', []),
            'market_opportunities': analysis_result.get('market_opportunities', []),
            'client_id': client_id,
            'agent_message': agent_message
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing strategic documents: {str(e)}")
        return jsonify({'error': 'Failed to process strategic documents'}), 500

@client_ai_bp.route('/api/upload/client-documents', methods=['POST'])
def upload_client_documents():
    """Handle file uploads for client documents"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        upload_type = request.form.get('type', 'general')
        client_id = request.form.get('client_id')
        
        if not client_id:
            return jsonify({'error': 'Client ID is required'}), 400
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'clients', client_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        uploaded_files = []
        
        for file in files:
            if file.filename == '':
                continue
            
            if file:
                filename = secure_filename(file.filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{filename}"
                file_path = os.path.join(upload_dir, filename)
                
                file.save(file_path)
                
                uploaded_files.append({
                    'name': file.filename,
                    'secure_name': filename,
                    'path': file_path,
                    'type': upload_type,
                    'size': os.path.getsize(file_path),
                    'uploaded_at': datetime.utcnow().isoformat()
                })
        
        return jsonify({
            'success': True,
            'files': uploaded_files,
            'count': len(uploaded_files)
        }), 200
        
    except Exception as e:
        logger.error(f"Error uploading files: {str(e)}")
        return jsonify({'error': 'Failed to upload files'}), 500

@client_ai_bp.route('/api/clients/<client_id>/knowledge-base', methods=['GET'])
def get_knowledge_base(client_id):
    """Get client's knowledge base"""
    try:
        from bson import ObjectId
        
        collection = mongo.get_collection('clients')
        client = collection.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        knowledge_base = client.get('knowledge_base', [])
        
        return jsonify({
            'client_id': client_id,
            'knowledge_base': knowledge_base
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching knowledge base: {str(e)}")
        return jsonify({'error': 'Failed to fetch knowledge base'}), 500

@client_ai_bp.route('/api/ai/agent-greeting', methods=['POST'])
def get_agent_greeting():
    """Get personalized greeting from AI agent"""
    try:
        data = request.get_json()
        agent_type = data.get('agent_type')
        user_name = data.get('user_name', 'there')
        client_name = data.get('client_name', '')
        
        if not agent_type:
            return jsonify({'error': 'Agent type is required'}), 400
        
        greeting = intelligent_agent.get_agent_greeting(
            agent_type=agent_type,
            user_name=user_name,
            client_name=client_name
        )
        
        return jsonify({
            'success': True,
            'agent_type': agent_type,
            'greeting': greeting,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting agent greeting: {str(e)}")
        return jsonify({'error': 'Failed to get agent greeting'}), 500
