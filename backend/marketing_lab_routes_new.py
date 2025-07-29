"""
Marketing AI Tasks Lab Routes - REAL AI IMPLEMENTATION
Handles multi-agent marketing task execution with local Llama, Pinecone RAG, and MongoDB logging
NO TEMPLATES - ALL REAL AI GENERATED CONTENT
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import traceback
import json

# Import the new AI service
from ai_service import get_ai_service, get_pinecone_service, get_mongodb_service, get_service_status

marketing_lab_routes = Blueprint('marketing_lab_routes', __name__)

# Initialize services
ai_service = get_ai_service()
pinecone_service = get_pinecone_service()
mongodb_service = get_mongodb_service()

class MarketingAgent:
    """Real AI Marketing Agent with Pinecone RAG and MongoDB logging"""
    
    def __init__(self, name: str, role: str, system_prompt: str):
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.conversation_history = []
    
    def process_task(self, task_data: dict, context: str = "") -> dict:
        """Process marketing task with real AI"""
        try:
            # Get relevant context from Pinecone
            rag_context = self._get_rag_context(task_data)
            
            # Build comprehensive prompt
            prompt = self._build_prompt(task_data, context, rag_context)
            
            # Log input to MongoDB
            self._log_to_mongodb("INPUT", prompt, task_data)
            
            # Generate with real AI
            response = ai_service.generate_text(
                prompt=prompt,
                system_prompt=self.system_prompt,
                max_tokens=800,
                temperature=0.7
            )
            
            # Log output to MongoDB
            self._log_to_mongodb("OUTPUT", response, task_data)
            
            # Store result in Pinecone for future RAG
            self._store_in_pinecone(response, task_data)
            
            return {
                'agent': self.name,
                'input': prompt,
                'output': response,
                'status': 'completed',
                'timestamp': datetime.now().isoformat(),
                'has_rag_context': bool(rag_context),
                'context_sources': len(rag_context) if rag_context else 0
            }
            
        except Exception as e:
            error_msg = f"Agent {self.name} failed: {str(e)}"
            self._log_to_mongodb("ERROR", error_msg, task_data)
            return {
                'agent': self.name,
                'error': error_msg,
                'status': 'failed',
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_rag_context(self, task_data: dict) -> str:
        """Get relevant context from Pinecone"""
        try:
            # Build search query based on task
            search_terms = [
                task_data.get('platform', ''),
                task_data.get('target_audience', ''),
                task_data.get('tone', ''),
                task_data.get('campaign_name', ''),
                self.role
            ]
            query = f"marketing content {' '.join(filter(None, search_terms))}"
            
            # Search Pinecone
            results = pinecone_service.search_content(
                query=query,
                top_k=3,
                filter_dict={'agent_type': 'marketing'}
            )
            
            if results:
                context_pieces = []
                for result in results:
                    if result['score'] > 0.5:  # Only use relevant results
                        context_pieces.append(result['content'])
                return "\n\n".join(context_pieces)
            
            return ""
            
        except Exception as e:
            print(f"[RAG] Error retrieving context: {e}")
            return ""
    
    def _build_prompt(self, task_data: dict, context: str, rag_context: str) -> str:
        """Build comprehensive prompt for the agent"""
        
        base_info = f"""
CAMPAIGN: {task_data.get('campaign_name', 'New Campaign')}
PLATFORM: {task_data.get('platform', 'LinkedIn')}
TARGET AUDIENCE: {task_data.get('target_audience', 'professionals')}
TONE: {task_data.get('tone', 'professional')}
DESCRIPTION: {task_data.get('description', 'marketing content')}
"""
        
        # Add previous agent context if available
        previous_context = ""
        if context:
            previous_context = f"\n\nPREVIOUS AGENT OUTPUT:\n{context}\n"
        
        # Add RAG context if available
        knowledge_context = ""
        if rag_context:
            knowledge_context = f"\n\nRELEVANT KNOWLEDGE FROM PAST CAMPAIGNS:\n{rag_context}\n"
        
        # Agent-specific instructions
        agent_instructions = {
            "ContentWriterAgent": f"""
Your task: Create original marketing content based on the information provided.

{base_info}{previous_context}{knowledge_context}

Create compelling, original marketing content that:
1. Speaks directly to the target audience
2. Matches the specified tone and platform
3. Incorporates the campaign description naturally
4. Is unique and engaging (no templates!)
5. Includes relevant hashtags if appropriate

Generate fresh, creative content that stands out.""",

            "EditorAgent": f"""
Your task: Review and enhance the marketing content created by the Content Writer.

{base_info}{previous_context}{knowledge_context}

Review the content and:
1. Improve clarity and flow
2. Enhance engagement and call-to-action
3. Optimize for the specific platform
4. Ensure consistency with brand tone
5. Add strategic improvements
6. Make it more compelling and effective

Provide the enhanced version with your improvements.""",

            "InspectorAgent": f"""
Your task: Final quality check and optimization of the marketing content.

{base_info}{previous_context}{knowledge_context}

Perform final review and:
1. Check for grammar and spelling
2. Verify platform optimization
3. Ensure target audience alignment
4. Validate tone consistency
5. Suggest any final improvements
6. Provide quality score and recommendations

Give the final polished content with quality assessment."""
        }
        
        return agent_instructions.get(self.name, f"Process this marketing task: {base_info}")
    
    def _log_to_mongodb(self, log_type: str, content: str, task_data: dict):
        """Log agent activity to MongoDB"""
        try:
            log_data = {
                'agent_name': self.name,
                'agent_role': self.role,
                'log_type': log_type,
                'content': content,
                'task_data': task_data,
                'timestamp': datetime.now(),
                'session_id': task_data.get('session_id', str(uuid.uuid4()))
            }
            mongodb_service.save_marketing_content(log_data)
        except Exception as e:
            print(f"[MONGODB] Logging error for {self.name}: {e}")
    
    def _store_in_pinecone(self, content: str, task_data: dict):
        """Store successful output in Pinecone for future RAG"""
        try:
            metadata = {
                'agent_type': 'marketing',
                'agent_name': self.name,
                'platform': task_data.get('platform', ''),
                'audience': task_data.get('target_audience', ''),
                'tone': task_data.get('tone', ''),
                'campaign': task_data.get('campaign_name', ''),
                'created_at': datetime.now().isoformat()
            }
            pinecone_service.store_content(content, metadata)
        except Exception as e:
            print(f"[PINECONE] Storage error for {self.name}: {e}")

# Initialize Marketing Agents
agents = {
    "ContentWriterAgent": MarketingAgent(
        name="ContentWriterAgent",
        role="Content Creation",
        system_prompt="""You are a professional marketing content writer with expertise in creating engaging, platform-specific content. 
You create original, compelling marketing content that resonates with target audiences. 
You never use templates - every piece is uniquely crafted for the specific campaign and audience.
You focus on authenticity, engagement, and conversion optimization."""
    ),
    
    "EditorAgent": MarketingAgent(
        name="EditorAgent", 
        role="Content Enhancement",
        system_prompt="""You are an expert marketing editor who transforms good content into exceptional content.
You enhance clarity, impact, and engagement while maintaining the original voice.
You optimize content for specific platforms and audiences.
You focus on improving flow, persuasion, and call-to-action effectiveness."""
    ),
    
    "InspectorAgent": MarketingAgent(
        name="InspectorAgent",
        role="Quality Assurance", 
        system_prompt="""You are a marketing quality inspector who ensures content meets the highest standards.
You provide final polish, error correction, and strategic recommendations.
You verify platform optimization and audience alignment.
You give quality scores and actionable improvement suggestions."""
    )
}

@marketing_lab_routes.route('/api/marketing-lab/health', methods=['GET'])
def health_check():
    """Enhanced health check with detailed service status"""
    try:
        status = get_service_status()
        
        # Test AI generation
        test_prompt = "Generate a short test message"
        test_response = ai_service.generate_text(test_prompt, max_tokens=50)
        ai_test_successful = len(test_response) > 10
        
        return jsonify({
            'success': True,
            'message': 'Health check completed',
            'data': {
                **status,
                'ai_test_successful': ai_test_successful,
                'test_response_length': len(test_response) if test_response else 0,
                'agents_available': len(agents),
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Health check failed: {str(e)}',
            'data': get_service_status()
        }), 500

@marketing_lab_routes.route('/api/marketing-lab/process', methods=['POST'])
def process_marketing_task():
    """Process marketing task with real AI agents - NO TEMPLATES!"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Add session ID for tracking
        session_id = str(uuid.uuid4())
        data['session_id'] = session_id
        
        # Validate required fields
        required_fields = ['campaign_name', 'description', 'target_audience', 'tone', 'platform']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Process through agent pipeline
        agent_results = []
        current_context = ""
        
        # Step 1: Content Writer Agent
        print(f"[MARKETING LAB] Processing with ContentWriterAgent...")
        writer_result = agents["ContentWriterAgent"].process_task(data, current_context)
        agent_results.append(writer_result)
        
        if writer_result.get('status') == 'completed':
            current_context = writer_result['output']
        else:
            return jsonify({
                'success': False,
                'error': 'Content Writer Agent failed',
                'agent_results': agent_results
            }), 500
        
        # Step 2: Editor Agent
        print(f"[MARKETING LAB] Processing with EditorAgent...")
        editor_result = agents["EditorAgent"].process_task(data, current_context)
        agent_results.append(editor_result)
        
        if editor_result.get('status') == 'completed':
            current_context = editor_result['output']
        else:
            return jsonify({
                'success': False,
                'error': 'Editor Agent failed',
                'agent_results': agent_results
            }), 500
        
        # Step 3: Inspector Agent
        print(f"[MARKETING LAB] Processing with InspectorAgent...")
        inspector_result = agents["InspectorAgent"].process_task(data, current_context)
        agent_results.append(inspector_result)
        
        # Final result
        final_content = inspector_result.get('output', current_context)
        
        # Save final result to MongoDB
        final_result = {
            'session_id': session_id,
            'campaign_name': data['campaign_name'],
            'platform': data['platform'],
            'target_audience': data['target_audience'],
            'tone': data['tone'],
            'description': data['description'],
            'final_content': final_content,
            'agent_pipeline': agent_results,
            'created_at': datetime.now(),
            'type': 'final_marketing_content'
        }
        
        result_id = mongodb_service.save_marketing_content(final_result)
        
        return jsonify({
            'success': True,
            'message': 'Marketing content generated successfully with real AI',
            'data': {
                'session_id': session_id,
                'result_id': result_id,
                'final_content': final_content,
                'agent_results': agent_results,
                'pipeline_completed': True,
                'agents_used': len(agent_results),
                'real_ai_generated': True,
                'template_used': False
            }
        })
        
    except Exception as e:
        error_msg = f"Marketing task processing failed: {str(e)}"
        print(f"[MARKETING LAB] {error_msg}")
        print(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'real_ai_attempted': True
        }), 500

@marketing_lab_routes.route('/api/marketing-lab/recommendations', methods=['POST'])
def get_recommendations():
    """Generate posting recommendations using real AI"""
    try:
        data = request.get_json()
        platform = data.get('platform', 'LinkedIn')
        target_audience = data.get('target_audience', 'professionals')
        campaign_name = data.get('campaign_name', 'Campaign')
        
        # Build prompt for recommendations
        prompt = f"""
Generate optimal posting recommendations for:
PLATFORM: {platform}
AUDIENCE: {target_audience}
CAMPAIGN: {campaign_name}

Provide specific recommendations for:
1. Best posting times (include timezone considerations)
2. Posting frequency and cadence
3. Content optimization tips
4. Engagement strategies
5. Platform-specific best practices

Be specific and actionable, not generic."""
        
        # Generate recommendations with AI
        recommendations = ai_service.generate_text(
            prompt=prompt,
            system_prompt="You are a social media strategy expert providing data-driven recommendations.",
            max_tokens=600,
            temperature=0.6
        )
        
        # Log to MongoDB
        rec_data = {
            'type': 'recommendations',
            'platform': platform,
            'target_audience': target_audience,
            'campaign_name': campaign_name,
            'recommendations': recommendations,
            'generated_at': datetime.now(),
            'ai_generated': True
        }
        
        rec_id = mongodb_service.save_marketing_content(rec_data)
        
        return jsonify({
            'success': True,
            'message': 'Recommendations generated successfully',
            'data': {
                'recommendations': recommendations,
                'platform': platform,
                'target_audience': target_audience,
                'campaign_name': campaign_name,
                'generated_at': datetime.now().isoformat(),
                'result_id': rec_id,
                'ai_generated': True
            }
        })
        
    except Exception as e:
        error_msg = f"Recommendations generation failed: {str(e)}"
        print(f"[MARKETING LAB] {error_msg}")
        
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@marketing_lab_routes.route('/api/marketing-lab/history', methods=['GET'])
def get_marketing_history():
    """Get marketing content history from MongoDB"""
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 20))
        campaign = request.args.get('campaign')
        platform = request.args.get('platform')
        
        # Build filter
        filters = {'type': 'final_marketing_content'}
        if campaign:
            filters['campaign_name'] = campaign
        if platform:
            filters['platform'] = platform
        
        # Get from MongoDB
        results = mongodb_service.get_marketing_content(filters)
        
        # Limit results
        results = results[:limit]
        
        return jsonify({
            'success': True,
            'message': f'Retrieved {len(results)} marketing content items',
            'data': {
                'content_items': results,
                'total_retrieved': len(results),
                'filters_applied': filters
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve history: {str(e)}'
        }), 500

@marketing_lab_routes.route('/api/marketing-lab/agents', methods=['GET'])
def get_agents_info():
    """Get information about available marketing agents"""
    return jsonify({
        'success': True,
        'message': 'Marketing agents information',
        'data': {
            'agents': [
                {
                    'name': agent.name,
                    'role': agent.role,
                    'system_prompt': agent.system_prompt[:200] + "..." if len(agent.system_prompt) > 200 else agent.system_prompt
                }
                for agent in agents.values()
            ],
            'total_agents': len(agents),
            'pipeline_order': ['ContentWriterAgent', 'EditorAgent', 'InspectorAgent']
        }
    })

# Test endpoint for AI functionality
@marketing_lab_routes.route('/api/marketing-lab/test-ai', methods=['POST'])
def test_ai_functionality():
    """Test AI functionality with a simple prompt"""
    try:
        data = request.get_json()
        test_prompt = data.get('prompt', 'Generate a short marketing message for LinkedIn professionals.')
        
        # Test AI service
        response = ai_service.generate_text(
            prompt=test_prompt,
            system_prompt="You are a helpful marketing assistant.",
            max_tokens=200,
            temperature=0.7
        )
        
        return jsonify({
            'success': True,
            'message': 'AI test completed successfully',
            'data': {
                'prompt': test_prompt,
                'response': response,
                'response_length': len(response),
                'ai_service_status': get_service_status(),
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'AI test failed: {str(e)}',
            'service_status': get_service_status()
        }), 500
