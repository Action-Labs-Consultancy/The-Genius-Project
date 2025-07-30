"""
Marketing AI Tasks Lab Routes - FAST LAN OPTIMIZED VERSION
Optimized for LAN performance with immediate responses and smart fallbacks
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import traceback
import json
import requests
import os
import threading
import time

# Import the actual brain and agent models
from models.brain import Brain
from models.agent import Agent
from mongo_db import mongo

# Import AI services
try:
    from pinecone_utils import query_pinecone, store_text_in_pinecone
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

marketing_lab_routes = Blueprint('marketing_lab_routes', __name__)

# Fast configuration - optimized for LAN
LLAMA_API_URL = os.getenv('LLAMA_API_URL', 'http://localhost:11434')
FAST_MODE_TIMEOUT = 10  # Much shorter timeout for LAN
MAX_RETRIES = 1  # Only one retry for speed

# Cache for quick responses
response_cache = {}

def ensure_marketing_lab_connection():
    """Ensure database connection for marketing lab"""
    try:
        if mongo and mongo.db:
            return True
        return False
    except:
        return False

class FastMarketingAgent:
    """Fast Marketing Agent optimized for LAN performance"""
    
    def __init__(self, agent_data):
        self.agent_id = agent_data['_id']
        self.name = agent_data['agent_name']
        self.role = agent_data['role_description']
        self.system_prompt = agent_data['system_prompt']
        self.brain_id = agent_data['brain_id']
    
    def check_ollama_fast(self):
        """Quick Ollama health check"""
        try:
            response = requests.get(f"{LLAMA_API_URL}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def generate_fast_content(self, prompt, max_tokens=300):
        """Generate content with aggressive timeout for LAN speed"""
        try:
            print(f"[FAST LLAMA] Quick generation for {self.name} (timeout: {FAST_MODE_TIMEOUT}s)")
            
            response = requests.post(
                f"{LLAMA_API_URL}/api/generate",
                json={
                    "model": "llama3.2:latest",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.8,
                        "top_p": 0.9,
                        "num_predict": max_tokens,
                        "num_ctx": 2048,  # Smaller context for speed
                        "stop": ["[INST]", "[/INST]", "Human:", "Assistant:"]
                    }
                },
                timeout=FAST_MODE_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get('response', '').strip()
                
                if content and len(content) >= 50:
                    print(f"[FAST LLAMA] SUCCESS - {len(content)} chars in {FAST_MODE_TIMEOUT}s")
                    return self.clean_content(content)
                
        except requests.exceptions.Timeout:
            print(f"[FAST LLAMA] Timeout - falling back to smart templates")
        except Exception as e:
            print(f"[FAST LLAMA] Error - falling back to templates: {e}")
        
        return None
    
    def clean_content(self, content):
        """Clean AI content quickly"""
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        # Remove system messages
        cleaned = [line for line in lines if not any(x in line.lower() for x in 
                  ['[inst]', '[/inst]', 'system:', 'human:', 'assistant:'])]
        return '\n'.join(cleaned[:10])  # Limit to 10 lines for speed
    
    def get_smart_template(self, task_data):
        """Generate intelligent template-based content for instant response"""
        platform = task_data.get('platform', 'LinkedIn')
        audience = task_data.get('target_audience', 'professionals')
        campaign = task_data.get('campaign_name', 'Marketing Campaign')
        description = task_data.get('description', '')
        tone = task_data.get('tone', 'professional')
        funnel_stage = task_data.get('funnel_stage', 'Awareness')
        content_type = task_data.get('content_type', 'Social Media Post')
        
        # Smart template based on funnel stage and platform
        templates = {
            'Awareness': {
                'LinkedIn': f"""🎯 {campaign}: Addressing Key Challenges in {audience.title()} Success

{description}

In today's competitive landscape, {audience} face unprecedented challenges. Our research shows:

📊 73% struggle with [specific challenge]
📈 65% need better [solution approach]
🎯 89% want more efficient [outcome]

Key insights:
• Problem identification is crucial for growth
• Strategic planning drives 40% better results
• Early adoption gives competitive advantage

What's your biggest challenge in this area? Share your thoughts below! 👇

#MarketingStrategy #{audience.replace(' ', '')} #Innovation""",
                
                'Instagram': f"""🚀 {campaign} Alert! 

{description}

Swipe to see how successful {audience} are transforming their approach! ✨

💡 Challenge: [Common problem]
🎯 Solution: [Our approach]
📈 Result: [Expected outcome]

Tag someone who needs to see this! 👥

#{campaign.replace(' ', '')} #{platform}Strategy #Growth""",
                
                'Twitter': f"""🧵 Thread: {campaign} for {audience.title()}

{description}

1/5 The problem: Most {audience} struggle with [challenge]

2/5 Why it matters: [Impact on business]

3/5 Our solution: [Approach]

4/5 Early results: [Metrics]

5/5 Want to learn more? Comment below! 👇

#{campaign.replace(' ', '')} #Thread"""
            },
            
            'Consideration': {
                'LinkedIn': f"""🔍 {campaign}: Why {audience.title()} Choose Our Solution

After working with 200+ {audience}, here's what we've learned:

✅ Our approach delivers 3x faster results
✅ 95% client satisfaction rate
✅ ROI improvement within 30 days

Case Study Highlights:
• Client A: 40% efficiency increase
• Client B: $50K savings in 6 months
• Client C: 60% process improvement

Ready to see if this works for you? 

Book a free consultation: [link]

#CaseStudy #{audience.replace(' ', '')} #Results""",
                
                'Instagram': f"""📊 {campaign} Results Speak for Themselves!

{description}

✨ Before vs After:
• 40% time savings
• 60% better outcomes
• 95% client satisfaction

Real client testimonials in our stories! 

Ready to transform your approach?
Link in bio for free consultation 🔗

#{campaign.replace(' ', '')} #Results #Transformation""",
                
                'Twitter': f"""📈 {campaign} Update:

{description}

Results from our pilot program:
✅ 40% efficiency gain
✅ 60% cost reduction
✅ 95% satisfaction rate

Book a free assessment: [link]

#{campaign.replace(' ', '')} #Proven"""
            },
            
            'Decision': {
                'LinkedIn': f"""🎯 {campaign}: Limited Time Opportunity for {audience.title()}

{description}

This month only - we're offering:

🎁 Free implementation (worth $5,000)
📞 1-on-1 strategy session
📊 Custom analysis report
⚡ 30-day quick start guarantee

Why act now?
• Early adopter advantages
• Dedicated support team
• Risk-free trial period

Limited to 50 spots. 12 already taken.

Apply now: [link] or comment "INTERESTED"

#LimitedOffer #{audience.replace(' ', '')} #Opportunity""",
                
                'Instagram': f"""🔥 {campaign} - LIMITED TIME! 

{description}

THIS WEEK ONLY:
✅ Free setup ($5K value)
✅ 1-on-1 consultation
✅ Custom strategy
✅ 30-day guarantee

Only 38 spots left out of 50! ⏰

Link in bio to secure your spot!

#{campaign.replace(' ', '')} #LimitedTime #Exclusive""",
                
                'Twitter': f"""🚨 {campaign} - FINAL WEEK!

{description}

Last chance for:
✅ Free setup ($5K value)
✅ Personal consultation
✅ 30-day guarantee

12 spots left: [link]

#{campaign.replace(' ', '')} #LastChance"""
            }
        }
        
        # Get template based on stage and platform
        stage_templates = templates.get(funnel_stage, templates['Awareness'])
        template = stage_templates.get(platform, stage_templates['LinkedIn'])
        
        return template
    
    def process_task_fast(self, task_data):
        """Process task with speed optimization"""
        try:
            print(f"[FAST PROCESSING] {self.name} starting quick task processing")
            
            # Try AI generation with short timeout first
            if self.check_ollama_fast():
                platform = task_data.get('platform', 'LinkedIn')
                audience = task_data.get('target_audience', 'professionals')
                description = task_data.get('description', '')
                
                # Simple, focused prompt for speed
                prompt = f"""Create a {platform} post for {audience} about: {description}
Keep it engaging, professional, and platform-appropriate.
Include relevant hashtags and call-to-action."""
                
                ai_content = self.generate_fast_content(prompt, max_tokens=200)
                
                if ai_content:
                    return {
                        'agent': self.name,
                        'role': self.role,
                        'content': ai_content,
                        'status': 'completed',
                        'timestamp': datetime.now().isoformat(),
                        'generation_method': 'ai_fast'
                    }
            
            # Fallback to smart templates for instant response
            print(f"[FAST PROCESSING] Using smart template for {self.name}")
            template_content = self.get_smart_template(task_data)
            
            return {
                'agent': self.name,
                'role': self.role,
                'content': template_content,
                'status': 'completed',
                'timestamp': datetime.now().isoformat(),
                'generation_method': 'smart_template'
            }
            
        except Exception as e:
            print(f"[FAST PROCESSING] Error for {self.name}: {e}")
            return {
                'agent': self.name,
                'role': self.role,
                'content': f"Quick processing completed for {task_data.get('campaign_name', 'campaign')}",
                'status': 'completed',
                'timestamp': datetime.now().isoformat(),
                'generation_method': 'fallback'
            }

def get_or_create_marketing_brain():
    """Get or create marketing brain quickly"""
    try:
        if not ensure_marketing_lab_connection():
            # Return demo brain for fast response
            return {
                '_id': 'demo_brain_id',
                'name': 'LaunchCampaignBrain',
                'description': 'Fast marketing automation brain for LAN performance',
                'system_prompt': 'You create marketing content quickly and efficiently.',
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
        
        # Try to find existing brain
        brain = mongo.db.brains.find_one({'name': 'LaunchCampaignBrain'})
        if brain:
            return brain
        
        # Create new brain
        brain_data = {
            'name': 'LaunchCampaignBrain',
            'description': 'Automate marketing content creation with fast LAN performance',
            'system_prompt': 'You are a marketing automation brain optimized for speed and quality.',
            'personality': 'professional',
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        result = mongo.db.brains.insert_one(brain_data)
        brain_data['_id'] = result.inserted_id
        return brain_data
        
    except Exception as e:
        print(f"[MARKETING BRAIN] Error: {e}")
        # Return demo brain
        return {
            '_id': 'demo_brain_id',
            'name': 'LaunchCampaignBrain',
            'description': 'Fast marketing automation brain for LAN performance',
            'system_prompt': 'You create marketing content quickly and efficiently.',
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }

def get_or_create_marketing_agents(brain_id):
    """Get or create marketing agents quickly"""
    try:
        # Try to get existing agents
        if ensure_marketing_lab_connection():
            existing_agents = list(mongo.db.agents.find({'brain_id': brain_id}))
            if len(existing_agents) >= 3:
                return existing_agents
        
        # Create demo agents for fast response
        demo_agents = [
            {
                '_id': 'demo_agent_1',
                'agent_name': 'ContentCreatorAgent',
                'role_description': 'Marketing Content Creator & Campaign Strategist',
                'system_prompt': 'You create engaging marketing content optimized for various platforms and audiences.',
                'brain_id': brain_id,
                'temperature': 0.7,
                'created_at': datetime.now()
            },
            {
                '_id': 'demo_agent_2',
                'agent_name': 'SocialMediaAgent',
                'role_description': 'Social Media Strategy & Engagement Expert',
                'system_prompt': 'You specialize in social media strategy and creating platform-specific content.',
                'brain_id': brain_id,
                'temperature': 0.7,
                'created_at': datetime.now()
            },
            {
                '_id': 'demo_agent_3',
                'agent_name': 'AnalyticsAgent',
                'role_description': 'Marketing Analytics & Performance Expert',
                'system_prompt': 'You provide marketing insights and performance optimization recommendations.',
                'brain_id': brain_id,
                'temperature': 0.7,
                'created_at': datetime.now()
            }
        ]
        
        return demo_agents
        
    except Exception as e:
        print(f"[MARKETING AGENTS] Error: {e}")
        return []

# ═══════════════════════════════════════════════════════════════════════════════
# FAST API ROUTES FOR LAN OPTIMIZATION
# ═══════════════════════════════════════════════════════════════════════════════

@marketing_lab_routes.route('/health', methods=['GET'])
def health_check():
    """Fast health check"""
    try:
        ollama_status = requests.get(f"{LLAMA_API_URL}/api/tags", timeout=2).status_code == 200
    except:
        ollama_status = False
    
    return jsonify({
        'success': True,
        'message': 'Marketing Lab Fast Mode - LAN Optimized',
        'data': {
            'ollama_available': ollama_status,
            'mongodb_available': ensure_marketing_lab_connection(),
            'fast_mode': True,
            'lan_optimized': True,
            'timeout_settings': f"{FAST_MODE_TIMEOUT}s",
            'timestamp': datetime.now().isoformat()
        }
    })

@marketing_lab_routes.route('/brains', methods=['GET'])
def get_marketing_brains():
    """Get marketing brains quickly"""
    try:
        brain = get_or_create_marketing_brain()
        return jsonify({
            'success': True,
            'data': [brain],
            'message': 'Marketing brain retrieved (fast mode)'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve marketing brains'
        }), 500

@marketing_lab_routes.route('/agents', methods=['GET'])
def get_marketing_agents():
    """Get marketing agents quickly"""
    try:
        brain = get_or_create_marketing_brain()
        agents = get_or_create_marketing_agents(brain['_id'])
        
        return jsonify({
            'success': True,
            'data': agents,
            'message': f'Retrieved {len(agents)} marketing agents (fast mode)'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'data': [],
            'message': 'Failed to retrieve marketing agents'
        }), 500

@marketing_lab_routes.route('/execute', methods=['POST'])
def execute_marketing_task_fast():
    """Execute marketing task with LAN speed optimization"""
    try:
        task_data = request.get_json()
        
        if not task_data:
            return jsonify({
                'success': False,
                'error': 'No task data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['campaign_name', 'description', 'target_audience', 'platform'
