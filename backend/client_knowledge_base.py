"""
Enhanced Client Management with AI Agents and Knowledge Base
Handles client onboarding workflow with AI-powered analysis
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import os
import hashlib
from werkzeug.utils import secure_filename

client_kb_bp = Blueprint('client_kb', __name__)

# Mock AI Analysis Functions (Replace with actual RAG/Llama integration)
def analyze_document_with_ai(file_path, document_type):
    """
    Mock function for AI document analysis
    In production, this would integrate with your RAG + Llama setup
    """
    analyses = {
        'scope': {
            'summary': 'AI has analyzed the project scope and identified key deliverables, timeline requirements, and resource needs.',
            'key_points': [
                'Clear project objectives defined',
                'Timeline requirements identified',
                'Resource allocation needs assessed',
                'Risk factors highlighted'
            ],
            'recommendations': [
                'Define milestone checkpoints',
                'Establish clear communication protocols',
                'Prepare contingency plans for identified risks'
            ]
        },
        'brandbook': {
            'brand_colors': ['#1E40AF', '#10B981', '#F59E0B'],
            'typography': 'Sans-serif, modern, clean lines',
            'tone': 'Professional, approachable, innovative',
            'target_audience': 'Millennials and Gen-Z professionals',
            'key_elements': [
                'Minimalist design approach',
                'Strong emphasis on sustainability',
                'Digital-first brand presence'
            ]
        },
        'competitor': {
            'top_competitors': ['Competitor A', 'Competitor B', 'Competitor C'],
            'market_position': 'Mid-tier with growth potential',
            'key_differentiators': [
                'Superior customer service',
                'Competitive pricing strategy',
                'Strong digital presence'
            ],
            'opportunities': [
                'Emerging market penetration',
                'Product line extension',
                'Strategic partnerships'
            ],
            'threats': [
                'New market entrants',
                'Price competition',
                'Technology disruption'
            ]
        },
        'swot': {
            'strengths': [
                'Strong brand recognition',
                'Customer loyalty',
                'Experienced team',
                'Financial stability'
            ],
            'weaknesses': [
                'Limited digital marketing presence',
                'Outdated technology infrastructure',
                'Geographic constraints'
            ],
            'opportunities': [
                'Digital transformation',
                'Market expansion',
                'New product development',
                'Strategic partnerships'
            ],
            'threats': [
                'Economic downturn',
                'Increased competition',
                'Regulatory changes',
                'Technology disruption'
            ]
        }
    }
    
    return analyses.get(document_type, {'analysis': 'Document processed successfully'})

def generate_ai_insights(knowledge_base_data):
    """
    Generate comprehensive AI insights from all knowledge base data
    """
    insights = {
        'project_readiness_score': 85,
        'risk_assessment': 'Medium',
        'recommended_timeline': '3-6 months',
        'key_success_factors': [
            'Clear scope definition',
            'Strong brand foundation',
            'Competitive market position',
            'Strategic approach to weaknesses'
        ],
        'action_items': [
            'Finalize project timeline and milestones',
            'Address digital marketing weaknesses',
            'Leverage brand strengths for market positioning',
            'Develop risk mitigation strategies'
        ]
    }
    
    return insights

@client_kb_bp.route('/api/clients/<client_id>/knowledge-base', methods=['GET'])
def get_knowledge_base(client_id):
    """Get client knowledge base"""
    try:
        from app import mongo
        from bson import ObjectId
        
        collection = mongo.get_collection('client_knowledge_base')
        kb = collection.find_one({'client_id': client_id})
        
        if not kb:
            # Return empty knowledge base structure
            return jsonify({
                'client_id': client_id,
                'scope': None,
                'brandbook': None,
                'strategic_analysis': None,
                'project_type': '',
                'contract_type': '',
                'document_count': 0,
                'ai_insights': None,
                'created_at': None,
                'updated_at': None
            })
        
        # Convert ObjectId to string
        kb['_id'] = str(kb['_id'])
        return jsonify(kb)
        
    except Exception as e:
        print(f"Error getting knowledge base: {e}")
        return jsonify({'error': 'Failed to retrieve knowledge base'}), 500

@client_kb_bp.route('/api/clients/<client_id>/knowledge-base', methods=['POST'])
def create_or_update_knowledge_base(client_id):
    """Create or update client knowledge base"""
    try:
        from app import mongo
        from bson import ObjectId
        
        data = request.get_json() or {}
        
        collection = mongo.get_collection('client_knowledge_base')
        
        # Check if knowledge base exists
        existing_kb = collection.find_one({'client_id': client_id})
        
        if existing_kb:
            # Update existing
            update_data = {
                'updated_at': datetime.utcnow(),
                **data
            }
            
            collection.update_one(
                {'client_id': client_id},
                {'$set': update_data}
            )
            
            # Get updated document
            kb = collection.find_one({'client_id': client_id})
        else:
            # Create new
            kb_doc = {
                'client_id': client_id,
                'scope': None,
                'brandbook': None,
                'strategic_analysis': None,
                'project_type': '',
                'contract_type': '',
                'document_count': 0,
                'ai_insights': None,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                **data
            }
            
            result = collection.insert_one(kb_doc)
            kb = collection.find_one({'_id': result.inserted_id})
        
        # Convert ObjectId to string
        kb['_id'] = str(kb['_id'])
        return jsonify(kb)
        
    except Exception as e:
        print(f"Error creating/updating knowledge base: {e}")
        return jsonify({'error': 'Failed to save knowledge base'}), 500

@client_kb_bp.route('/api/clients/<client_id>/knowledge-base/scope', methods=['POST'])
def add_scope_to_knowledge_base(client_id):
    """Add project scope to knowledge base with AI analysis"""
    try:
        from app import mongo
        
        data = request.get_json() or {}
        scope_text = data.get('text', '')
        
        # Simulate AI analysis of scope
        ai_analysis = analyze_document_with_ai(None, 'scope')
        
        scope_data = {
            'text': scope_text,
            'ai_analysis': ai_analysis,
            'processed_at': datetime.utcnow().isoformat()
        }
        
        # Update knowledge base
        collection = mongo.get_collection('client_knowledge_base')
        collection.update_one(
            {'client_id': client_id},
            {
                '$set': {
                    'scope': scope_data,
                    'updated_at': datetime.utcnow()
                },
                '$inc': {'document_count': 1}
            },
            upsert=True
        )
        
        return jsonify({
            'success': True,
            'scope': scope_data,
            'message': 'Scope added and analyzed successfully'
        })
        
    except Exception as e:
        print(f"Error adding scope: {e}")
        return jsonify({'error': 'Failed to process scope'}), 500

@client_kb_bp.route('/api/clients/<client_id>/knowledge-base/brandbook', methods=['POST'])
def add_brandbook_to_knowledge_base(client_id):
    """Add brandbook to knowledge base with AI analysis"""
    try:
        from app import mongo
        
        data = request.get_json() or {}
        has_brandbook = data.get('has_brandbook', False)
        
        if has_brandbook:
            # Simulate AI analysis of brandbook
            ai_analysis = analyze_document_with_ai(None, 'brandbook')
            
            brandbook_data = {
                'has_brandbook': True,
                'ai_analysis': ai_analysis,
                'processed_at': datetime.utcnow().isoformat()
            }
        else:
            brandbook_data = {
                'has_brandbook': False,
                'note': 'No brandbook provided',
                'processed_at': datetime.utcnow().isoformat()
            }
        
        # Update knowledge base
        collection = mongo.get_collection('client_knowledge_base')
        update_data = {
            'brandbook': brandbook_data,
            'updated_at': datetime.utcnow()
        }
        
        if has_brandbook:
            update_data['$inc'] = {'document_count': 1}
        
        collection.update_one(
            {'client_id': client_id},
            {'$set': update_data},
            upsert=True
        )
        
        return jsonify({
            'success': True,
            'brandbook': brandbook_data,
            'message': 'Brandbook processed successfully'
        })
        
    except Exception as e:
        print(f"Error adding brandbook: {e}")
        return jsonify({'error': 'Failed to process brandbook'}), 500

@client_kb_bp.route('/api/clients/<client_id>/knowledge-base/strategic-analysis', methods=['POST'])
def add_strategic_analysis_to_knowledge_base(client_id):
    """Add strategic analysis documents to knowledge base with AI analysis"""
    try:
        from app import mongo
        
        data = request.get_json() or {}
        
        # Simulate AI analysis of both documents
        competitor_analysis = analyze_document_with_ai(None, 'competitor')
        swot_analysis = analyze_document_with_ai(None, 'swot')
        
        strategic_data = {
            'competitor_analysis': competitor_analysis,
            'swot_analysis': swot_analysis,
            'processed_at': datetime.utcnow().isoformat()
        }
        
        # Update knowledge base
        collection = mongo.get_collection('client_knowledge_base')
        collection.update_one(
            {'client_id': client_id},
            {
                '$set': {
                    'strategic_analysis': strategic_data,
                    'updated_at': datetime.utcnow()
                },
                '$inc': {'document_count': 2}
            },
            upsert=True
        )
        
        # Generate comprehensive AI insights
        kb = collection.find_one({'client_id': client_id})
        ai_insights = generate_ai_insights(kb)
        
        # Update with AI insights
        collection.update_one(
            {'client_id': client_id},
            {'$set': {'ai_insights': ai_insights}}
        )
        
        return jsonify({
            'success': True,
            'strategic_analysis': strategic_data,
            'ai_insights': ai_insights,
            'message': 'Strategic analysis completed successfully'
        })
        
    except Exception as e:
        print(f"Error adding strategic analysis: {e}")
        return jsonify({'error': 'Failed to process strategic analysis'}), 500

@client_kb_bp.route('/api/clients/<client_id>/knowledge-base/insights', methods=['GET'])
def get_ai_insights(client_id):
    """Get AI-generated insights for the client"""
    try:
        from app import mongo
        
        collection = mongo.get_collection('client_knowledge_base')
        kb = collection.find_one({'client_id': client_id})
        
        if not kb:
            return jsonify({'error': 'Knowledge base not found'}), 404
        
        # Generate fresh insights if not available
        if not kb.get('ai_insights'):
            ai_insights = generate_ai_insights(kb)
            
            collection.update_one(
                {'client_id': client_id},
                {'$set': {'ai_insights': ai_insights}}
            )
            
            return jsonify(ai_insights)
        
        return jsonify(kb['ai_insights'])
        
    except Exception as e:
        print(f"Error getting AI insights: {e}")
        return jsonify({'error': 'Failed to generate insights'}), 500

@client_kb_bp.route('/api/clients/<client_id>/knowledge-base/export', methods=['GET'])
def export_knowledge_base(client_id):
    """Export complete knowledge base as structured data"""
    try:
        from app import mongo
        from bson import ObjectId
        
        # Get client info
        clients_collection = mongo.get_collection('clients')
        client = clients_collection.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Get knowledge base
        kb_collection = mongo.get_collection('client_knowledge_base')
        kb = kb_collection.find_one({'client_id': client_id})
        
        if not kb:
            return jsonify({'error': 'Knowledge base not found'}), 404
        
        # Prepare export data
        export_data = {
            'client_info': {
                'id': str(client['_id']),
                'name': client.get('name'),
                'project_type': kb.get('project_type'),
                'contract_type': kb.get('contract_type')
            },
            'knowledge_base': {
                'scope': kb.get('scope'),
                'brandbook': kb.get('brandbook'),
                'strategic_analysis': kb.get('strategic_analysis'),
                'ai_insights': kb.get('ai_insights'),
                'document_count': kb.get('document_count', 0),
                'created_at': kb.get('created_at'),
                'updated_at': kb.get('updated_at')
            },
            'export_info': {
                'exported_at': datetime.utcnow().isoformat(),
                'exported_by': 'System'  # Could be updated with actual user info
            }
        }
        
        return jsonify(export_data)
        
    except Exception as e:
        print(f"Error exporting knowledge base: {e}")
        return jsonify({'error': 'Failed to export knowledge base'}), 500

# File upload helper (for future use with actual file uploads)
@client_kb_bp.route('/api/clients/<client_id>/knowledge-base/upload', methods=['POST'])
def upload_document(client_id):
    """Upload and process documents for knowledge base"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        document_type = request.form.get('type', 'general')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Secure filename
        filename = secure_filename(file.filename)
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join('uploads', 'knowledge_base', client_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Process with AI (mock)
        ai_analysis = analyze_document_with_ai(file_path, document_type)
        
        # Store file info and analysis
        file_info = {
            'filename': filename,
            'original_name': file.filename,
            'file_path': file_path,
            'file_size': os.path.getsize(file_path),
            'document_type': document_type,
            'ai_analysis': ai_analysis,
            'uploaded_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'success': True,
            'file_info': file_info,
            'message': 'File uploaded and processed successfully'
        })
        
    except Exception as e:
        print(f"Error uploading document: {e}")
        return jsonify({'error': 'Failed to upload document'}), 500
