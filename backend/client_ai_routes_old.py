"""
Enhanced Client Management with AI Processing
Handles the step-by-step workflow for client onboarding with AI agents
"""

from flask import Blueprint, request, jsonify, current_app
import os
import json
import requests
from datetime import datetime
from werkzeug.utils import secure_filename
import openai
from mongo_db import mongo, MongoClientModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client_ai_bp = Blueprint('client_ai', __name__)

# AI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
LLAMA_API_URL = os.getenv('LLAMA_API_URL', 'http://localhost:8080')

def get_ai_client():
    """Get AI client (OpenAI or Llama)"""
    if OPENAI_API_KEY:
        openai.api_key = OPENAI_API_KEY
        return 'openai'
    else:
        return 'llama'

def call_ai_service(prompt, context="", max_tokens=2000):
    """
    Call AI service (OpenAI GPT or Llama) for text processing
    """
    try:
        ai_type = get_ai_client()
        
        if ai_type == 'openai' and OPENAI_API_KEY:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        else:
            # Use Llama API
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
        return f"Error processing with AI: {str(e)}"

@client_ai_bp.route('/api/clients', methods=['POST'])
def create_enhanced_client():
    """Create a new client with enhanced workflow support"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Client name is required'}), 400
        
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
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating client: {str(e)}")
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
        
    except Exception as e:
        logger.error(f"Error initializing knowledge base: {str(e)}")
        return jsonify({'error': 'Failed to initialize knowledge base'}), 500

@client_ai_bp.route('/api/ai/process-scope', methods=['POST'])
def process_scope_with_ai():
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
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing scope: {str(e)}")
        return jsonify({'error': 'Failed to process scope'}), 500

@client_ai_bp.route('/api/ai/process-brandbook', methods=['POST'])
def process_brandbook_with_ai():
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
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing brandbook: {str(e)}")
        return jsonify({'error': 'Failed to process brandbook'}), 500

@client_ai_bp.route('/api/ai/process-strategic-docs', methods=['POST'])
def process_strategic_documents():
    """Process competitor and SWOT analysis documents"""
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        competitor_files = data.get('competitor_files', [])
        swot_files = data.get('swot_files', [])
        
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
        
    except Exception as e:
        logger.error(f"Error processing strategic documents: {str(e)}")
        return jsonify({'error': 'Failed to process strategic documents'}), 500

@client_ai_bp.route('/api/upload/client-documents', methods=['POST'])
def upload_client_documents():
    """Handle file uploads for client documents"""
    try:
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
        
    except Exception as e:
        logger.error(f"Error uploading files: {str(e)}")
        return jsonify({'error': 'Failed to upload files'}), 500

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
