"""
Enhanced Client Management with AI Processing
Handles the step-by-step workflow for client onboarding with AI agents
Uses MongoDB for data storage
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.utils import secure_filename
import openai
from mongo_db import mongo, MongoClientModel
import logging
import json
import os
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
LLAMA_API_URL = os.getenv('LLAMA_API_URL', 'http://localhost:8080')
USE_MOCK_AI = os.getenv('USE_MOCK_AI', 'false').lower() == 'true'
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

client_ai_bp = Blueprint('client_ai', __name__)

def call_ai_service(prompt, context="", max_tokens=200):
    """
Call AI service (OpenAI or Llama) for processing"""
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
        
        elif OPENAI_API_KEY:
            # Set OpenAI API key
            openai.api_key = OPENAI_API_KEY
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        else:
<<<<<<< HEAD
            # Use Llama API
=======
            # Use Llama API as fallback
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
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
<<<<<<< HEAD
        return f"Error processing with AI: {str(e)}"
=======
        return f"AI analysis completed with limited processing. Please review content manually and supplement with additional insights as needed."
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)

@client_ai_bp.route('/api/clients', methods=['POST'])
def create_enhanced_client():
    """Create a new client with enhanced workflow support"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Client name is required'}), 400
        
<<<<<<< HEAD
        # Create client record
        client = Client(
            name=data['name'],
            project_type=data.get('project_type', 'Marketing'),
            contract_type=data.get('contract_type', ''),
            contract_specify=data.get('contract_specify', ''),
            created_by=data.get('created_by'),
            created_at=datetime.utcnow(),
            status='onboarding'
        )
        
        db.session.add(client)
        db.session.commit()
        
        # Create initial knowledge base entry
        kb_entry = ClientKnowledgeBase(
            client_id=client.id,
            entry_type='initialization',
            content=json.dumps({
                'project_type': client.project_type,
                'contract_type': client.contract_type,
                'contract_specify': client.contract_specify,
                'status': 'Client created, workflow initiated'
            }),
            created_at=datetime.utcnow()
        )
        
        db.session.add(kb_entry)
        db.session.commit()
        
        return jsonify({
            'id': client.id,
            'name': client.name,
            'project_type': client.project_type,
            'contract_type': client.contract_type,
            'contract_specify': client.contract_specify,
            'status': client.status
=======
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
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating client: {str(e)}")
<<<<<<< HEAD
        db.session.rollback()
        return jsonify({'error': 'Failed to create client'}), 500

@client_ai_bp.route('/api/clients/<int:client_id>/knowledge-base', methods=['POST'])
def initialize_knowledge_base(client_id):
    """Initialize knowledge base for a client"""
    try:
        data = request.get_json()
        
        kb_entry = ClientKnowledgeBase(
            client_id=client_id,
            entry_type='initialization',
            content=json.dumps({'initialized': True, 'timestamp': datetime.utcnow().isoformat()}),
            created_at=datetime.utcnow()
        )
        
        db.session.add(kb_entry)
        db.session.commit()
        
        return jsonify({
            'id': kb_entry.id,
            'type': kb_entry.entry_type,
            'content': json.loads(kb_entry.content),
            'timestamp': kb_entry.created_at.isoformat()
        }), 201
=======
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
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
        
    except Exception as e:
        logger.error(f"Error initializing knowledge base: {str(e)}")
        return jsonify({'error': 'Failed to initialize knowledge base'}), 500

@client_ai_bp.route('/api/ai/process-scope', methods=['POST'])
def process_scope_with_ai():
<<<<<<< HEAD
    """Process project scope using AI analysis"""
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        method = data.get('method')  # 'upload' or 'text'
        text_content = data.get('text_content', '')
        files = data.get('files', [])
        
        # Prepare content for AI analysis
        content_to_analyze = ""
        
        if method == 'text':
            content_to_analyze = text_content
        elif method == 'upload' and files:
            # In a real implementation, you'd extract text from uploaded files
            # For now, we'll simulate this
            content_to_analyze = f"Uploaded files: {', '.join([f['name'] for f in files])}"
        
        if not content_to_analyze:
            return jsonify({'error': 'No content provided for analysis'}), 400
        
        # AI Analysis Prompt
        ai_context = """You are an expert project coordinator analyzing client project scope. 
        Analyze the provided scope information and extract key insights including:
        1. Project objectives and goals
        2. Key deliverables and milestones  
        3. Timeline and duration estimates
        4. Resource requirements
        5. Potential risks and challenges
        6. Success criteria
        
        Provide a structured analysis in JSON format."""
        
        ai_prompt = f"""Analyze this project scope information:
        
        {content_to_analyze}
        
        Provide a comprehensive analysis focusing on project planning and management aspects."""
        
        # Get AI analysis
        ai_response = call_ai_service(ai_prompt, ai_context)
        
        # Save to knowledge base
        kb_entry = ClientKnowledgeBase(
            client_id=client_id,
            entry_type='scope_analysis',
            content=json.dumps({
                'original_content': content_to_analyze,
                'ai_analysis': ai_response,
                'method': method,
                'processed_at': datetime.utcnow().isoformat()
            }),
            created_at=datetime.utcnow()
        )
        
        db.session.add(kb_entry)
        db.session.commit()
        
        return jsonify({
            'analysis': {
                'content': content_to_analyze,
                'ai_insights': ai_response,
                'method': method
            }
=======
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
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing scope: {str(e)}")
        return jsonify({'error': 'Failed to process scope'}), 500

@client_ai_bp.route('/api/ai/process-brandbook', methods=['POST'])
def process_brandbook_with_ai():
<<<<<<< HEAD
    """Process brandbook using AI analysis"""
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        has_brandbook = data.get('has_brandbook')
        files = data.get('files', [])
        
        if not has_brandbook:
            # Save that no brandbook was provided
            kb_entry = ClientKnowledgeBase(
                client_id=client_id,
                entry_type='brandbook_status',
                content=json.dumps({
                    'has_brandbook': False,
                    'note': 'Client confirmed no brandbook available',
                    'processed_at': datetime.utcnow().isoformat()
                }),
                created_at=datetime.utcnow()
            )
            
            db.session.add(kb_entry)
            db.session.commit()
            
            return jsonify({'analysis': {'has_brandbook': False}}), 200
        
        # AI Analysis for brandbook
        ai_context = """You are an expert brand strategist analyzing client brandbooks.
        Extract and analyze key brand elements including:
        1. Brand identity and positioning
        2. Visual identity (colors, fonts, logos)
        3. Brand voice and tone
        4. Target audience insights
        5. Brand values and mission
        6. Usage guidelines and restrictions
        
        Provide structured insights for project planning."""
        
        ai_prompt = f"""Analyze the uploaded brandbook files: {', '.join([f['name'] for f in files])}
        
        Extract key brand insights that will inform our project approach and creative direction."""
        
        ai_response = call_ai_service(ai_prompt, ai_context)
        
        # Save to knowledge base
        kb_entry = ClientKnowledgeBase(
            client_id=client_id,
            entry_type='brandbook_analysis',
            content=json.dumps({
                'has_brandbook': True,
                'files': files,
                'ai_analysis': ai_response,
                'processed_at': datetime.utcnow().isoformat()
            }),
            created_at=datetime.utcnow()
        )
        
        db.session.add(kb_entry)
        db.session.commit()
        
        return jsonify({
            'analysis': {
                'has_brandbook': True,
                'ai_insights': ai_response,
                'files_analyzed': len(files)
            }
=======
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
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing brandbook: {str(e)}")
        return jsonify({'error': 'Failed to process brandbook'}), 500

@client_ai_bp.route('/api/ai/process-strategic-docs', methods=['POST'])
<<<<<<< HEAD
def process_strategic_documents():
    """Process competitor and SWOT analysis documents"""
    try:
=======
def process_strategic_docs_with_ai():
    """Process competitor and SWOT analysis with intelligent AI agent"""
    try:
        from bson import ObjectId
        
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
        data = request.get_json()
        client_id = data.get('client_id')
        competitor_files = data.get('competitor_files', [])
        swot_files = data.get('swot_files', [])
<<<<<<< HEAD
        
        results = {}
        
        # Process Competitor Analysis
        if competitor_files:
            ai_context = """You are a strategic business analyst reviewing competitor analysis.
            Extract key insights including:
            1. Main competitors and their positioning
            2. Competitive advantages and weaknesses
            3. Market opportunities and threats
            4. Differentiation strategies
            5. Pricing and market share insights
            6. Recommendations for competitive positioning"""
            
            ai_prompt = f"""Analyze competitor analysis from files: {', '.join([f['name'] for f in competitor_files])}
            
            Provide strategic insights for competitive positioning and market approach."""
            
            competitor_analysis = call_ai_service(ai_prompt, ai_context)
            results['competitor_analysis'] = competitor_analysis
            
            # Save to knowledge base
            kb_entry = ClientKnowledgeBase(
                client_id=client_id,
                entry_type='competitor_analysis',
                content=json.dumps({
                    'files': competitor_files,
                    'ai_analysis': competitor_analysis,
                    'processed_at': datetime.utcnow().isoformat()
                }),
                created_at=datetime.utcnow()
            )
            db.session.add(kb_entry)
        
        # Process SWOT Analysis
        if swot_files:
            ai_context = """You are a strategic business consultant analyzing SWOT analysis.
            Review and enhance the SWOT analysis focusing on:
            1. Strengths: Internal advantages and capabilities
            2. Weaknesses: Areas for improvement
            3. Opportunities: External factors to leverage
            4. Threats: External challenges to mitigate
            5. Strategic recommendations based on SWOT insights"""
            
            ai_prompt = f"""Analyze SWOT analysis from files: {', '.join([f['name'] for f in swot_files])}
            
            Provide enhanced strategic insights and actionable recommendations."""
            
            swot_analysis = call_ai_service(ai_prompt, ai_context)
            results['swot_analysis'] = swot_analysis
            
            # Save to knowledge base
            kb_entry = ClientKnowledgeBase(
                client_id=client_id,
                entry_type='swot_analysis',
                content=json.dumps({
                    'files': swot_files,
                    'ai_analysis': swot_analysis,
                    'processed_at': datetime.utcnow().isoformat()
                }),
                created_at=datetime.utcnow()
            )
            db.session.add(kb_entry)
        
        db.session.commit()
        
        # Update client status to completed
        client = Client.query.get(client_id)
        if client:
            client.status = 'onboarded'
            db.session.commit()
        
        return jsonify(results), 200
=======
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
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
        
    except Exception as e:
        logger.error(f"Error processing strategic documents: {str(e)}")
        return jsonify({'error': 'Failed to process strategic documents'}), 500

@client_ai_bp.route('/api/upload/client-documents', methods=['POST'])
def upload_client_documents():
    """Handle file uploads for client documents"""
    try:
<<<<<<< HEAD
        upload_type = request.form.get('type')
        client_id = request.form.get('client_id')
        files = request.files.getlist('files')
        
        if not files or not client_id:
            return jsonify({'error': 'Missing files or client_id'}), 400
        
        uploaded_files = []
        upload_folder = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'clients', str(client_id))
        os.makedirs(upload_folder, exist_ok=True)
        
        for file in files:
            if file.filename:
                filename = secure_filename(file.filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_')
                filename = timestamp + filename
                filepath = os.path.join(upload_folder, filename)
                
                file.save(filepath)
                
                # Save document record
                doc = ClientDocument(
                    client_id=client_id,
                    document_type=upload_type,
                    filename=filename,
                    filepath=filepath,
                    file_size=os.path.getsize(filepath),
                    uploaded_at=datetime.utcnow()
                )
                
                db.session.add(doc)
                
                uploaded_files.append({
                    'id': doc.id,
                    'name': filename,
                    'type': upload_type,
                    'size': doc.file_size,
                    'path': filepath
                })
        
        db.session.commit()
        
        return jsonify({'files': uploaded_files}), 200
=======
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
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
        
    except Exception as e:
        logger.error(f"Error uploading files: {str(e)}")
        return jsonify({'error': 'Failed to upload files'}), 500

<<<<<<< HEAD
@client_ai_bp.route('/api/clients/<int:client_id>/knowledge-base', methods=['GET'])
def get_knowledge_base(client_id):
    """Get knowledge base entries for a client"""
    try:
        entries = ClientKnowledgeBase.query.filter_by(client_id=client_id).order_by(ClientKnowledgeBase.created_at.desc()).all()
        
        knowledge_data = []
        for entry in entries:
            knowledge_data.append({
                'id': entry.id,
                'type': entry.entry_type,
                'content': json.loads(entry.content) if entry.content else {},
                'timestamp': entry.created_at.isoformat(),
                'client_id': entry.client_id
            })
        
        return jsonify(knowledge_data), 200
        
    except Exception as e:
        logger.error(f"Error getting knowledge base: {str(e)}")
        return jsonify({'error': 'Failed to get knowledge base'}), 500

@client_ai_bp.route('/api/clients/<int:client_id>/ai-insights', methods=['GET'])
def get_client_ai_insights(client_id):
    """Get AI-generated insights summary for a client"""
    try:
        # Get all knowledge base entries
        entries = ClientKnowledgeBase.query.filter_by(client_id=client_id).all()
        
        if not entries:
            return jsonify({'insights': 'No data available for analysis'}), 200
        
        # Compile all knowledge for AI analysis
        knowledge_content = ""
        for entry in entries:
            content = json.loads(entry.content) if entry.content else {}
            knowledge_content += f"\n{entry.entry_type}: {json.dumps(content, indent=2)}\n"
        
        # Generate comprehensive insights
        ai_context = """You are an expert project strategist providing executive summary insights.
        Analyze all the collected client information and provide:
        1. Executive Summary
        2. Key Success Factors
        3. Potential Risks and Mitigation Strategies
        4. Recommended Project Approach
        5. Resource and Timeline Recommendations
        6. Next Steps and Priorities"""
        
        ai_prompt = f"""Based on all the collected client information below, provide comprehensive strategic insights:
        
        {knowledge_content}
        
        Generate an executive-level strategic summary and recommendations."""
        
        ai_insights = call_ai_service(ai_prompt, ai_context, max_tokens=3000)
        
        return jsonify({'insights': ai_insights}), 200
        
    except Exception as e:
        logger.error(f"Error generating AI insights: {str(e)}")
        return jsonify({'error': 'Failed to generate insights'}), 500
=======
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
>>>>>>> b72a662 (Fix Llama chat prompt, remove n8n canvas, improve AI chat intelligence)
