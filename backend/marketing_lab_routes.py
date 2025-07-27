"""
Marketing AI Tasks Lab Routes
Handles multi-agent marketing task execution and demonstration
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import traceback
import random

# Import models
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))
try:
    from agent import Agent
    from brain import Brain
except ImportError:
    print("[MARKETING LAB] Warning: Could not import Agent or Brain model")
    Agent = None
    Brain = None

try:
    from mongo_db import mongo
except ImportError:
    print("[MARKETING LAB] Warning: Could not import mongo from mongo_db")
    mongo = None

marketing_lab_routes = Blueprint('marketing_lab_routes', __name__)

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

def simulate_agent_processing(agent_name, task_data, previous_output=None):
    """
    Simulate professional marketing agent processing with real marketing expertise
    """
    import time
    import random
    time.sleep(1)  # Simulate processing time
    
    platform = task_data['platform']
    tone = task_data['tone']
    audience = task_data['target_audience']
    campaign_name = task_data['campaign_name']
    description = task_data['description']
    
    if agent_name == "ContentWriterAgent":
        # Platform-specific content strategies
        if platform == "LinkedIn":
            hook = get_linkedin_hook(tone, audience)
            format_strategy = get_linkedin_format(description, audience)
            cta = get_linkedin_cta(campaign_name)
            hashtags = "#Innovation #Business #Leadership #Growth #Technology"
            
        elif platform == "Instagram":
            hook = get_instagram_hook(tone, audience)
            format_strategy = get_instagram_format(description, audience)
            cta = get_instagram_cta()
            hashtags = "#startup #innovation #businesstips #entrepreneur #techlife"
            
        elif platform == "Twitter":
            hook = get_twitter_hook(tone, audience)
            format_strategy = get_twitter_format(description, audience)
            cta = get_twitter_cta()
            hashtags = "#startup #innovation #tech"
            
        elif platform == "Facebook":
            hook = get_facebook_hook(tone, audience)
            format_strategy = get_facebook_format(description, audience)
            cta = get_facebook_cta()
            hashtags = "#business #innovation #community"
            
        elif platform == "TikTok":
            hook = get_tiktok_hook(tone)
            format_strategy = get_tiktok_format(description)
            cta = get_tiktok_cta()
            hashtags = "#businesstips #innovation #entrepreneur #startup"
            
        else:  # Email
            hook = get_email_hook(tone, audience)
            format_strategy = get_email_format(description, audience)
            cta = get_email_cta(campaign_name)
            hashtags = ""
        
        output = f"""{hook}

{format_strategy}

{cta}

{hashtags}"""

    elif agent_name == "EditorAgent":
        # Enhanced editing with marketing psychology
        enhanced_content = enhance_with_marketing_psychology(previous_output, task_data)
        refined_copy = apply_copywriting_principles(enhanced_content, task_data)
        output = optimize_for_platform(refined_copy, task_data)

    elif agent_name == "InspectorAgent":
        # Final quality assurance with marketing best practices
        final_content = apply_final_optimizations(previous_output, task_data)
        result = add_performance_insights(final_content, task_data)
        # Return just the content for agent output, performance data will be handled separately
        output = result['content']

    else:
        output = f"Processed by {agent_name}: {previous_output or 'Initial processing complete'}"
    
    return output

def get_linkedin_hook(tone, audience):
    hooks = {
        'professional': [
            f"3 game-changing insights every {audience.lower()} should know:",
            f"The future of {audience.lower()} success starts with this one shift:",
            f"Why 87% of {audience.lower()} are missing this critical opportunity:"
        ],
        'casual': [
            f"Here's what {audience.lower()} wish they knew 5 years ago:",
            f"Plot twist: {audience.lower()} don't need more tools. They need this:",
            f"Controversial take: Most {audience.lower()} are solving the wrong problem."
        ],
        'creative': [
            f"Imagine if {audience.lower()} could 10x their impact overnight...",
            f"The secret weapon {audience.lower()} use to dominate their market:",
            f"While others struggle, {audience.lower()} who do THIS are thriving:"
        ]
    }
    return random.choice(hooks.get(tone, hooks['professional']))

def get_linkedin_format(description, audience):
    insights = generate_business_insights(description, audience)
    return f"""{insights}

💡 The reality? Most {audience.lower()} are still operating with outdated methods.

📊 Smart {audience.lower()} are already leveraging:
→ Data-driven decision making
→ Automation for repetitive tasks  
→ AI-powered insights for competitive advantage

The gap between leaders and laggards is widening fast."""

def get_linkedin_cta(campaign_name):
    ctas = [
        f"Ready to transform your approach? {campaign_name} is changing the game.",
        f"Don't get left behind. See how {campaign_name} can accelerate your growth.",
        f"Join the {campaign_name} revolution. Your future self will thank you."
    ]
    return random.choice(ctas)

def get_instagram_hook(tone, audience):
    hooks = {
        'professional': f"Why every {audience.lower()} needs to see this 👇",
        'casual': f"This just changed everything for {audience.lower()} 🤯",
        'creative': f"Plot twist that {audience.lower()} never saw coming ✨"
    }
    return hooks.get(tone, hooks['professional'])

def get_instagram_format(description, audience):
    return f"""[CAROUSEL POST CONCEPT]

Slide 1: Problem that {audience.lower()} face daily
Slide 2: The hidden cost of ignoring this
Slide 3: What industry leaders do differently  
Slide 4: Your 3-step action plan
Slide 5: Real results you can expect

💬 Save this for later & share with someone who needs to see it!"""

def get_instagram_cta():
    return "Double-tap if this resonates! 💫\nTag a friend who needs this insight 👥"

def get_twitter_hook(tone, audience):
    hooks = {
        'professional': f"Thread: Why {audience.lower()} are rethinking everything 🧵",
        'casual': f"Hot take: {audience.lower()} have been doing this all wrong",
        'creative': f"Mind = blown. {audience.lower()} need to see this 🤯"
    }
    return hooks.get(tone, hooks['professional'])

def get_twitter_format(description, audience):
    return f"""1/ The problem: 90% of {audience.lower()} are stuck in old patterns

2/ The cost: Losing 3-5 hours/week on tasks that could be automated

3/ The solution: Smart {audience.lower()} are shifting to...

4/ Results: 40% faster execution, 60% better outcomes

5/ How to start: [practical first step]"""

def get_twitter_cta():
    return "Retweet if you found this valuable 🔄\nWhat's your biggest challenge? Reply below 👇"

def get_facebook_hook(tone, audience):
    return f"Community question: What's the #1 challenge facing {audience.lower()} right now?"

def get_facebook_format(description, audience):
    return f"""I've been working with {audience.lower()} for years, and I keep seeing the same pattern...

They start with high hopes, work incredibly hard, but hit the same invisible barriers.

Here's what I've learned:

🔍 The real problem isn't lack of effort
📈 It's not even about having the right strategy  
⚡ It's about having the right SYSTEM

When you have a system that works, everything changes:
• Less stress, more results
• Clear path forward
• Predictable growth

The {audience.lower()} who figure this out early? They're the ones who succeed long-term."""

def get_facebook_cta():
    return "What systems have made the biggest difference in your business? Share in the comments! 👇"

def get_tiktok_hook(tone):
    hooks = {
        'professional': "POV: You're finally doing business the smart way",
        'casual': "This is why your business isn't growing (and how to fix it)",
        'creative': "Tell me you're an entrepreneur without telling me..."
    }
    return hooks.get(tone, hooks['casual'])

def get_tiktok_format(description):
    return f"""[VIDEO CONCEPT]
Scene 1: Show the old way (struggling, complicated)
Scene 2: Transition moment (realization)  
Scene 3: Show the new way (smooth, efficient)
Scene 4: Results reveal

Text overlay: "Before vs After using the right system"
Voiceover: Quick, punchy explanation"""

def get_tiktok_cta():
    return "Follow for more business tips that actually work! ✨"

def get_email_hook(tone, audience):
    hooks = {
        'professional': f"Subject: Critical update for {audience.lower()}",
        'casual': f"Subject: This changes everything (5-min read)",
        'creative': f"Subject: The secret {audience.lower()} don't want you to know"
    }
    return hooks.get(tone, hooks['professional'])

def get_email_format(description, audience):
    return f"""Hi [Name],

Quick question: What if I told you that 73% of {audience.lower()} are missing a massive opportunity that's hiding in plain sight?

Here's what I discovered after analyzing 500+ successful businesses:

The ones that thrive don't just work harder—they work with better systems.

While others are burning out trying to do everything manually, smart {audience.lower()} have cracked the code on:

✓ Automating their most time-consuming tasks
✓ Making data-driven decisions in minutes, not hours  
✓ Scaling without sacrificing quality

The result? They're growing 3x faster while working 20% fewer hours.

P.S. I'm hosting a free workshop next week where I'll show you exactly how they do it. Interested?"""

def get_email_cta(campaign_name):
    return f"[REPLY YES] to secure your spot in the {campaign_name} workshop (limited to 50 participants)"

def enhance_with_marketing_psychology(content, task_data):
    """Apply marketing psychology principles"""
    audience = task_data['target_audience']
    platform = task_data['platform']
    
    # Add social proof
    if "LinkedIn" in platform:
        social_proof = f"\n\n📊 Join 10,000+ {audience.lower()} who've already transformed their approach"
    elif "Instagram" in platform:
        social_proof = f"\n\n👥 Trusted by 10K+ {audience.lower()} worldwide"
    else:
        social_proof = f"\n\n✅ Proven by thousands of {audience.lower()}"
    
    # Add urgency/scarcity
    urgency_phrases = [
        "\n⏰ The window for early adoption is closing fast",
        "\n🚀 While your competitors catch up, you could be 6 months ahead",
        "\n⚡ The cost of waiting? Watching others capture the opportunities you miss"
    ]
    
    urgency = random.choice(urgency_phrases)
    
    return content + social_proof + urgency

def apply_copywriting_principles(content, task_data):
    """Apply proven copywriting techniques"""
    tone = task_data['tone']
    platform = task_data['platform']
    
    # Add power words based on tone
    if tone == 'professional':
        power_words = ["breakthrough", "proven", "strategic", "results-driven"]
    elif tone == 'creative':
        power_words = ["revolutionary", "game-changing", "innovative", "transformative"]
    else:
        power_words = ["simple", "effective", "practical", "actionable"]
    
    # Enhance with emotional triggers
    emotional_triggers = {
        'fear': "Don't let your competitors get ahead while you're still figuring this out",
        'greed': "Unlock revenue streams you never knew existed",
        'curiosity': "The surprising truth about why most businesses plateau at $1M"
    }
    
    # Platform-specific optimizations
    if platform == "LinkedIn":
        enhanced = add_thought_leadership_angle(content)
    elif platform == "Instagram":
        enhanced = add_visual_storytelling_cues(content)
    elif platform == "Twitter":
        enhanced = optimize_for_virality(content)
    else:
        enhanced = content
    
    return enhanced

def optimize_for_platform(content, task_data):
    """Final platform-specific optimizations"""
    platform = task_data['platform']
    
    if platform == "LinkedIn":
        # Add engagement boosters
        content += "\n\n💭 What's your experience? Share your thoughts below"
        content += "\n🔔 Follow me for more insights on business growth"
        
    elif platform == "Instagram":
        # Add Instagram-specific elements
        content += "\n\n📌 Save this post for later!"
        content += "\n👥 Tag someone who needs to see this"
        content += "\n🔥 More tips in my stories"
        
    elif platform == "Twitter":
        # Optimize for retweets
        content += "\n\n🔄 RT if this resonates"
        content += "\n💬 What's your take? Reply below"
        
    return content

def apply_final_optimizations(content, task_data):
    """Apply final marketing optimizations"""
    platform = task_data['platform']
    audience = task_data['target_audience']
    
    # Add final credibility boost
    credibility = f"\n\n🎯 Specifically designed for {audience.lower()} who want real results, not just hype"
    
    # Platform-specific character optimization
    if platform == "Twitter" and len(content) > 280:
        content = content[:250] + "... [Thread continues] 🧵"
    
    # Add final CTA optimization
    if platform == "LinkedIn":
        final_cta = f"\n\n👉 Ready to join the {audience.lower()} who are already ahead? Let's connect."
    elif platform == "Email":
        final_cta = "\n\n[BUTTON] Get Instant Access →"
    else:
        final_cta = f"\n\n✨ Follow for more {audience.lower()} success strategies"
    
    return content + credibility + final_cta

def add_performance_insights(content, task_data):
    """Add performance optimization insights"""
    platform = task_data['platform']
    
    performance_data = {
        'best_posting_time': get_optimal_posting_time(platform),
        'expected_engagement': get_engagement_prediction(platform),
        'suggested_boost': get_boost_suggestion(platform),
        'ab_test': get_ab_test_suggestion(task_data)
    }
    
    # Return content and performance data separately
    return {
        'content': content,
        'performance_optimization': performance_data
    }

def get_optimal_posting_time(platform):
    times = {
        'LinkedIn': '8-10 AM or 12-2 PM on weekdays',
        'Instagram': '11 AM-1 PM or 7-9 PM',
        'Twitter': '8-10 AM or 7-9 PM',
        'Facebook': '1-3 PM or 7-9 PM',
        'TikTok': '6-10 AM or 7-9 PM',
        'Email': 'Tuesday-Thursday, 10 AM or 2 PM'
    }
    return times.get(platform, '9 AM-12 PM')

def get_engagement_prediction(platform):
    predictions = {
        'LinkedIn': '3-5% engagement rate',
        'Instagram': '1-3% engagement rate',  
        'Twitter': '0.5-1% engagement rate',
        'Facebook': '0.18-0.27% engagement rate',
        'TikTok': '5-9% engagement rate',
        'Email': '18-25% open rate'
    }
    return predictions.get(platform, '2-4% engagement rate')

def get_boost_suggestion(platform):
    suggestions = {
        'LinkedIn': 'Use video or carousel for 2x engagement',
        'Instagram': 'Add trending audio for wider reach',
        'Twitter': 'Create thread for deeper engagement',
        'Facebook': 'Use community groups for organic reach',
        'TikTok': 'Jump on trending hashtag for viral potential',
        'Email': 'Personalize subject line for +15% opens'
    }
    return suggestions.get(platform, 'Add visual elements for better performance')

def get_ab_test_suggestion(task_data):
    tests = [
        f"Test emotional vs rational appeal with {task_data['target_audience']}",
        f"Compare direct vs story-based approach for {task_data['tone']} tone",
        f"Test question vs statement opening for {task_data['platform']} audience"
    ]
    return random.choice(tests)

def generate_business_insights(description, audience):
    insights = [
        f"Here's what most {audience.lower()} get wrong about scaling:",
        f"The hidden bottleneck that's costing {audience.lower()} thousands:",
        f"Why traditional approaches aren't working for {audience.lower()} anymore:"
    ]
    return random.choice(insights)

def add_thought_leadership_angle(content):
    return content.replace("Here's", "After 10+ years in the industry, here's")

def add_visual_storytelling_cues(content):
    return content + "\n\n[Visual: Split-screen showing before/after transformation]"

def optimize_for_virality(content):
    return content + "\n\n🔥 This is blowing up - what do you think?"

@marketing_lab_routes.route('/api/marketing-lab/brains', methods=['GET'])
def get_lab_brains():
    """Get available brains for the marketing lab"""
    try:
        if not Brain:
            return create_error_response('Brain model not available', 500)
        
        # For demo, we'll return a specific brain or create one if it doesn't exist
        brain_name = "LaunchCampaignBrain"
        
        # Try to find the existing brain using the main Brain model
        try:
            existing_brains = Brain.get_all()
            for brain in existing_brains:
                if brain.get('name') == brain_name:
                    return create_success_response([brain], f"Found {brain_name}")
        except Exception as e:
            print(f"Error fetching brains: {e}")
        
        # Create brain using the main Brain model if it doesn't exist
        try:
            # Use the correct parameters for Brain.create
            brain = Brain.create(
                name=brain_name,
                description='Automate marketing content creation based on structured inputs',
                system_prompt='You are a marketing automation brain that coordinates content creation agents to produce high-quality marketing materials.',
                user_id=None
            )
            
            if brain and brain.get('_id'):
                return create_success_response([brain], f"Created {brain_name}")
            
            # Fallback to demo brain if creation fails
            demo_brain = {
                'name': brain_name,
                'description': 'Automate marketing content creation based on structured inputs',
                'system_prompt': 'You are a marketing automation brain that coordinates content creation agents to produce high-quality marketing materials.',
                'personality': 'professional',
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            return create_success_response([demo_brain], f"Demo brain {brain_name} ready")
            
        except Exception as e:
            print(f"Error creating brain: {e}")
            # Return demo brain as fallback
            demo_brain = {
                'name': brain_name,
                'description': 'Automate marketing content creation based on structured inputs',
                'system_prompt': 'You are a marketing automation brain that coordinates content creation agents to produce high-quality marketing materials.',
                'personality': 'professional',
                'agent_count': 3,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            return create_success_response([demo_brain], f"Demo brain {brain_name} ready")
        
    except Exception as e:
        print(f"Error getting lab brains: {e}")
        return create_error_response(str(e), 500)

@marketing_lab_routes.route('/api/marketing-lab/agents', methods=['GET'])
def get_lab_agents():
    """Get the demo agents for the marketing lab"""
    try:
        brain_name = "LaunchCampaignBrain"
        
        # First ensure the brain exists
        try:
            existing_brains = Brain.get_all()
            lab_brain = None
            for brain in existing_brains:
                if brain.get('name') == brain_name:
                    lab_brain = brain
                    break
            
            if not lab_brain:
                return create_error_response(f"Brain {brain_name} not found. Please access the Marketing Lab first.", 404)
            
            brain_id = lab_brain.get('_id')
            
            # Try to get existing agents for this brain
            if Agent and brain_id:
                try:
                    existing_agents = Agent.get_by_brain_id(brain_id)
                    if existing_agents and len(existing_agents) >= 3:
                        return create_success_response(existing_agents, f"Found {len(existing_agents)} lab agents")
                except Exception as e:
                    print(f"Error fetching existing agents: {e}")
                
                # Create the agents if they don't exist
                agent_definitions = [
                    {
                        'agent_name': 'ContentWriterAgent',
                        'role_description': 'Creates initial marketing content drafts based on campaign requirements',
                        'system_prompt': 'You are a creative content writer specializing in marketing copy. Create engaging, persuasive content that captures attention and drives action.',
                        'personality': 'creative',
                        'brain_id': brain_id,
                        'status': 'active',
                        'order': 1
                    },
                    {
                        'agent_name': 'EditorAgent', 
                        'role_description': 'Polishes grammar, tone, and overall content quality',
                        'system_prompt': 'You are a professional editor who refines content for clarity, impact, and brand consistency. Ensure the message is compelling and error-free.',
                        'personality': 'professional',
                        'brain_id': brain_id,
                        'status': 'active',
                        'order': 2
                    },
                    {
                        'agent_name': 'InspectorAgent',
                        'role_description': 'Verifies content meets audience, platform, and tone requirements',
                        'system_prompt': 'You are a quality assurance specialist who ensures content meets all specified requirements and platform best practices.',
                        'personality': 'analytical',
                        'brain_id': brain_id,
                        'status': 'active',
                        'order': 3
                    }
                ]
                
                created_agents = []
                for agent_data in agent_definitions:
                    try:
                        agent_id = Agent.create(agent_data)
                        if agent_id:
                            agent = Agent.get_by_id(agent_id)
                            if agent:
                                created_agents.append(agent)
                    except Exception as e:
                        print(f"Error creating agent {agent_data['agent_name']}: {e}")
                
                if created_agents:
                    return create_success_response(created_agents, f"Created {len(created_agents)} lab agents")
            
        except Exception as e:
            print(f"Error with brain/agent management: {e}")
        
        # Fallback to demo agents
        demo_agents = [
            {
                '_id': 'demo_content_writer',
                'agent_name': 'ContentWriterAgent',
                'role_description': 'Creates initial marketing content drafts based on campaign requirements',
                'system_prompt': 'You are a creative content writer specializing in marketing copy. Create engaging, persuasive content that captures attention and drives action.',
                'personality': 'creative',
                'status': 'active',
                'order': 1
            },
            {
                '_id': 'demo_editor',
                'agent_name': 'EditorAgent', 
                'role_description': 'Polishes grammar, tone, and overall content quality',
                'system_prompt': 'You are a professional editor who refines content for clarity, impact, and brand consistency. Ensure the message is compelling and error-free.',
                'personality': 'professional',
                'status': 'active',
                'order': 2
            },
            {
                '_id': 'demo_inspector',
                'agent_name': 'InspectorAgent',
                'role_description': 'Verifies content meets audience, platform, and tone requirements',
                'system_prompt': 'You are a quality assurance specialist who ensures content meets all specified requirements and platform best practices.',
                'personality': 'analytical',
                'status': 'active',
                'order': 3
            }
        ]
        
        return create_success_response(demo_agents, f"Found {len(demo_agents)} lab agents")
        
    except Exception as e:
        print(f"Error getting lab agents: {e}")
        return create_error_response(str(e), 500)

@marketing_lab_routes.route('/api/marketing-lab/execute', methods=['POST'])
def execute_marketing_task():
    """Execute a marketing task using the multi-agent system"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['campaign_name', 'description', 'target_audience', 'tone', 'platform']
        for field in required_fields:
            if not data.get(field):
                return create_error_response(f'{field} is required', 400)
        
        # Create execution ID for tracking
        execution_id = str(uuid.uuid4())
        
        # Initialize execution log
        execution_log = {
            'execution_id': execution_id,
            'task_data': data,
            'started_at': datetime.now(),
            'status': 'running',
            'agents': [],
            'final_output': None,
            'error': None
        }
        
        # Define agent processing chain
        agent_chain = [
            {'name': 'ContentWriterAgent', 'description': 'Creating initial content draft'},
            {'name': 'EditorAgent', 'description': 'Polishing grammar and tone'},
            {'name': 'InspectorAgent', 'description': 'Verifying quality and requirements'}
        ]
        
        previous_output = None
        
        # Process through each agent
        for i, agent_info in enumerate(agent_chain):
            agent_name = agent_info['name']
            agent_description = agent_info['description']
            
            try:
                # Record agent start
                agent_log = {
                    'agent_name': agent_name,
                    'description': agent_description,
                    'status': 'started',
                    'started_at': datetime.now(),
                    'output': None,
                    'error': None,
                    'order': i + 1
                }
                execution_log['agents'].append(agent_log)
                
                # Simulate agent processing
                output = simulate_agent_processing(agent_name, data, previous_output)
                
                # Record completion
                agent_log['status'] = 'completed'
                agent_log['completed_at'] = datetime.now()
                agent_log['output'] = output
                agent_log['output_preview'] = output[:150] + "..." if len(output) > 150 else output
                
                previous_output = output
                
            except Exception as agent_error:
                agent_log['status'] = 'error'
                agent_log['error'] = str(agent_error)
                agent_log['completed_at'] = datetime.now()
                
                execution_log['status'] = 'error'
                execution_log['error'] = f"Agent {agent_name} failed: {str(agent_error)}"
                break
        
        # Set final output and completion status
        if execution_log['status'] != 'error':
            execution_log['final_output'] = previous_output
            execution_log['status'] = 'completed'
        
        execution_log['completed_at'] = datetime.now()
        
        # Store execution log in MongoDB if available
        if mongo is not None and mongo.db is not None:
            try:
                mongo.db.marketing_lab_executions.insert_one(execution_log.copy())
            except Exception as db_error:
                print(f"Failed to store execution log: {db_error}")
        
        return create_success_response(execution_log, "Marketing task executed successfully")
        
    except Exception as e:
        print(f"Error executing marketing task: {e}")
        print(traceback.format_exc())
        return create_error_response(str(e), 500)

@marketing_lab_routes.route('/api/marketing-lab/executions/<execution_id>', methods=['GET'])
def get_execution_details(execution_id):
    """Get detailed execution results"""
    try:
        if mongo is not None and mongo.db is not None:
            execution = mongo.db.marketing_lab_executions.find_one({'execution_id': execution_id})
            if execution:
                execution['_id'] = str(execution['_id'])
                return create_success_response(execution, "Execution details retrieved")
        
        return create_error_response('Execution not found', 404)
        
    except Exception as e:
        print(f"Error getting execution details: {e}")
        return create_error_response(str(e), 500)

@marketing_lab_routes.route('/api/marketing-lab/executions', methods=['GET'])
def get_recent_executions():
    """Get recent marketing lab executions"""
    try:
        if mongo is not None and mongo.db is not None:
            executions = list(mongo.db.marketing_lab_executions.find()
                            .sort('started_at', -1)
                            .limit(10))
            for execution in executions:
                execution['_id'] = str(execution['_id'])
            
            return create_success_response(executions, f"Found {len(executions)} recent executions")
        
        return create_success_response([], "No executions found")
        
    except Exception as e:
        print(f"Error getting recent executions: {e}")
        return create_error_response(str(e), 500)
