@marketing_lab_routes.route('/funnel-content', methods=['POST'])
def generate_funnel_content():
    """Generate specialized marketing funnel content using the brain/agent system"""
    try:
        # Ensure connection first (like the working execute-quick endpoint)
        if not ensure_marketing_lab_connection():
            return jsonify({
                'success': False,
                'error': 'Database connection failed - unable to access marketing agents'
            }), 500
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided',
                'message': 'Request body is required'
            }), 400
        
        # Validate required fields
        required_fields = ['product_name', 'target_audience', 'description', 'funnel_stage', 'content_type', 'platform', 'time_option']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'message': 'All fields are required for funnel content generation'
            }), 400
        
        # Extract funnel-specific data
        product_name = data['product_name']
        target_audience = data['target_audience']
        description = data['description']
        funnel_stage = data['funnel_stage']
        content_type = data['content_type']
        platform = data['platform']
        time_option = data['time_option']
        tone = data.get('tone', 'professional')
        
        print(f"[FUNNEL CONTENT] Generating {content_type} for {funnel_stage} stage targeting {target_audience}")
        
        # Create specialized funnel prompts based on stage
        stage_objectives = {
            'Awareness': {
                'goal': 'Create awareness about problems and introduce solutions',
                'focus': 'Problem identification, brand introduction, educational content',
                'cta_type': 'Learn more, read article, follow for insights'
            },
            'Consideration': {
                'goal': 'Help prospects evaluate solutions and build trust',
                'focus': 'Solution comparison, benefits demonstration, credibility building',
                'cta_type': 'Download guide, book consultation, view demo'
            },
            'Conversion': {
                'goal': 'Convert prospects into customers with compelling offers',
                'focus': 'Clear value proposition, urgency, social proof, direct action',
                'cta_type': 'Buy now, start trial, schedule call, get quote'
            },
            'Loyalty': {
                'goal': 'Retain customers and encourage advocacy',
                'focus': 'Success stories, additional value, community building, referrals',
                'cta_type': 'Share experience, refer friends, upgrade, join community'
            }
        }
        
        stage_info = stage_objectives.get(funnel_stage, stage_objectives['Awareness'])
        
        # Get marketing brain and agents (using the WORKING system)
        brain = get_or_create_marketing_brain()
        if not brain:
            return jsonify({
                'success': False,
                'error': 'Marketing brain not available - cannot process task'
            }), 500
        
        agents = get_or_create_marketing_agents(brain['_id'])
        if not agents:
            return jsonify({
                'success': False,
                'error': 'No marketing agents available - cannot process task'
            }), 500
        
        # Use the Content Creator agent for funnel content generation
        content_creator = next((agent for agent in agents if agent.get('agent_name') == 'Content Creator'), agents[0])
        
        execution_id = str(uuid.uuid4())
        print(f"[FUNNEL CONTENT] Using {content_creator.get('agent_name')} for {funnel_stage} stage content")
        
        # Create funnel-specific task data for the agent
        funnel_task_data = {
            'campaign_name': product_name,
            'description': f"""FUNNEL STAGE: {funnel_stage} - {stage_info['goal']}

Create a {content_type.lower()} for {product_name} targeting {target_audience} on {platform}.
Timeline: {time_option}
Tone: {tone}

Product Details: {description}

Focus Areas: {stage_info['focus']}
Appropriate CTAs: {stage_info['cta_type']}

Generate specific, actionable {content_type.lower()} content optimized for the {funnel_stage.lower()} stage of the marketing funnel.""",
            'target_audience': target_audience,
            'platform': platform,
            'tone': tone,
            'funnel_stage': funnel_stage,
            'content_type': content_type,
            'time_option': time_option
        }
        
        try:
            # Create agent instance and process task (same as working execute-quick)
            agent = RealMarketingAgent(content_creator)
            result = agent.process_task_fast(funnel_task_data)
            
            print(f"[FUNNEL CONTENT] Agent completed: {result.get('status')}")
            
        except Exception as e:
            print(f"[FUNNEL CONTENT] Agent failed: {e}")
            return jsonify({
                'success': False,
                'error': f'Agent processing failed: {str(e)}',
                'message': 'Failed to generate funnel content using AI agent'
            }), 500
        
        # Check if agent generated content successfully
        if result.get('status') != 'completed' or not result.get('content'):
            return jsonify({
                'success': False,
                'error': 'Agent failed to generate content',
                'message': 'AI agent was unable to generate adequate funnel content'
            }), 500
        
        # Create execution record for tracking
        execution_data = {
            'execution_id': execution_id,
            'type': 'funnel_content',
            'product_name': product_name,
            'target_audience': target_audience,
            'funnel_stage': funnel_stage,
            'content_type': content_type,
            'platform': platform,
            'time_option': time_option,
            'tone': tone,
            'generated_content': result.get('content'),
            'agent_used': content_creator.get('agent_name'),
            'brain_id': brain['_id'],
            'timestamp': datetime.now().isoformat(),
            'status': 'completed'
        }
        
        # Store in MongoDB if available
        try:
            db = mongo.get_db()
            db.funnel_executions.insert_one(execution_data)
            print(f"[FUNNEL CONTENT] Stored execution {execution_id} in MongoDB")
        except Exception as e:
            print(f"[FUNNEL CONTENT] MongoDB storage failed: {e}")
        
        return jsonify({
            'success': True,
            'data': {
                'execution_id': execution_id,
                'funnel_stage': funnel_stage,
                'content_type': content_type,
                'platform': platform,
                'time_option': time_option,
                'generated_content': result.get('content'),
                'stage_objective': stage_info['goal'],
                'agent_used': content_creator.get('agent_name'),
                'timestamp': datetime.now().isoformat()
            },
            'message': f'Funnel content generated successfully for {funnel_stage} stage using {content_creator.get("agent_name")}'
        })
        
    except Exception as e:
        print(f"[FUNNEL CONTENT] Error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate funnel content'
        }), 500
