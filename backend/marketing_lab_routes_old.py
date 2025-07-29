"""
Marketing AI Tasks Lab Routes
Handles multi-agent marketing task execution with real AI, Pinecone, and MongoDB integration
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import traceback
import random
import os

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

# Import AI and vector store utilities
try:
    from pinecone_utils import store_text_in_pinecone, query_pinecone, generate_brain_response
    from ai.semantic_memory import SemanticMemoryEngine
    import openai
    openai.api_key = os.getenv('OPENAI_API_KEY')
    AI_AVAILABLE = True
except ImportError as e:
    print(f"[MARKETING LAB] Warning: AI utilities not available: {e}")
    AI_AVAILABLE = False

# Initialize semantic memory for marketing content
try:
    marketing_memory = SemanticMemoryEngine()
    MEMORY_AVAILABLE = True
except Exception as e:
    print(f"[MARKETING LAB] Warning: Semantic memory not available: {e}")
    MEMORY_AVAILABLE = False

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
    Process marketing content using real AI agents with Pinecone memory integration
    """
    if not AI_AVAILABLE:
        return simulate_mock_agent_processing(agent_name, task_data, previous_output)
    
    try:
        # Create agent context from task data
        campaign_name = task_data.get('campaign_name', 'Campaign')
        description = task_data.get('description', '')
        target_audience = task_data.get('target_audience', 'professionals')
        tone = task_data.get('tone', 'professional')
        platform = task_data.get('platform', 'LinkedIn')
        
        # Retrieve relevant knowledge from Pinecone for context
        search_query = f"marketing content {platform} {target_audience} {tone}"
        relevant_context = ""
        
        if MEMORY_AVAILABLE:
            try:
                # Search for relevant marketing knowledge
                context_results = marketing_memory.search_memories(
                    query=search_query,
                    namespace="marketing",
                    top_k=3
                )
                if context_results:
                    relevant_context = "\n".join([result.get('content', '') for result in context_results])
            except Exception as e:
                print(f"[MARKETING LAB] Failed to retrieve context from Pinecone: {e}")
        
        # Define specialized agent prompts
        agent_prompts = {
            "ContentWriterAgent": f"""You are a professional marketing content writer specializing in {platform} content for {target_audience}.

TASK: Create compelling marketing content for:
- Campaign: {campaign_name}
- Description: {description}
- Target Audience: {target_audience}
- Tone: {tone}
- Platform: {platform}

RELEVANT CONTEXT: {relevant_context}

Create original, engaging content that:
1. Captures attention with a strong hook
2. Addresses the target audience's pain points
3. Presents the solution clearly
4. Includes a compelling call-to-action
5. Follows {platform} best practices

Return only the marketing content, optimized for {platform}.""",

            "EditorAgent": f"""You are a professional marketing editor who refines content for maximum impact.

PREVIOUS CONTENT: {previous_output}

TASK: Polish and refine this content for:
- Platform: {platform}
- Audience: {target_audience}
- Tone: {tone}

RELEVANT CONTEXT: {relevant_context}

Improve the content by:
1. Enhancing clarity and readability
2. Strengthening the call-to-action
3. Optimizing for {platform} engagement
4. Ensuring consistent {tone} tone
5. Adding persuasive elements

Return the refined content only.""",

            "InspectorAgent": f"""You are a quality assurance specialist for marketing content.

CONTENT TO REVIEW: {previous_output}

REQUIREMENTS:
- Platform: {platform}
- Audience: {target_audience}
- Tone: {tone}
- Campaign: {campaign_name}

RELEVANT CONTEXT: {relevant_context}

Perform final quality check and optimization:
1. Verify content meets platform best practices
2. Ensure tone matches requirements
3. Check audience alignment
4. Add performance optimization elements
5. Final polish for maximum impact

Return the final, optimized content."""
        }
        
        # Get the appropriate prompt for this agent
        prompt = agent_prompts.get(agent_name, f"Process this marketing content: {previous_output}")
        
        # Generate AI response using OpenAI
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Process this marketing task: {description}"}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            output = response.choices[0].message.content.strip()
            
            # Store the agent's work in Pinecone for future context
            if MEMORY_AVAILABLE:
                try:
                    agent_memory = {
                        'content': output,
                        'agent_name': agent_name,
                        'campaign_name': campaign_name,
                        'platform': platform,
                        'audience': target_audience,
                        'tone': tone,
                        'timestamp': datetime.now().isoformat(),
                        'type': 'agent_output'
                    }
                    
                    marketing_memory.store_memory(
                        content=output,
                        metadata=agent_memory,
                        namespace="marketing"
                    )
                except Exception as e:
                    print(f"[MARKETING LAB] Failed to store agent output in Pinecone: {e}")
            
            # Log to MongoDB
            if mongo is not None and mongo.db is not None:
                try:
                    agent_log = {
                        'agent_name': agent_name,
                        'input_data': task_data,
                        'previous_output': previous_output,
                        'ai_output': output,
                        'timestamp': datetime.now(),
                        'campaign_name': campaign_name,
                        'platform': platform,
                        'audience': target_audience
                    }
                    mongo.db.marketing_agent_logs.insert_one(agent_log)
                except Exception as e:
                    print(f"[MARKETING LAB] Failed to log to MongoDB: {e}")
            
            return output
            
        except Exception as ai_error:
            print(f"[MARKETING LAB] AI processing failed: {ai_error}")
            return simulate_mock_agent_processing(agent_name, task_data, previous_output)
            
    except Exception as e:
        print(f"[MARKETING LAB] Agent processing error: {e}")
        return simulate_mock_agent_processing(agent_name, task_data, previous_output)

def simulate_mock_agent_processing(agent_name, task_data, previous_output=None):
    """
    Enhanced mock processing with realistic marketing content when AI is not available
    """
    campaign_name = task_data.get('campaign_name', 'Campaign')
    description = task_data.get('description', '')
    target_audience = task_data.get('target_audience', 'professionals')
    tone = task_data.get('tone', 'professional')
    platform = task_data.get('platform', 'LinkedIn')
    
    # Log the mock processing to MongoDB for demonstration
    if mongo is not None and mongo.db is not None:
        try:
            mock_log = {
                'agent_name': agent_name,
                'processing_type': 'mock',
                'input_data': task_data,
                'previous_output': previous_output,
                'timestamp': datetime.now(),
                'note': 'AI API keys not configured - using enhanced mock processing'
            }
            mongo.db.marketing_agent_logs.insert_one(mock_log)
        except Exception as e:
            print(f"[MARKETING LAB] Failed to log mock processing: {e}")
    
    if agent_name == "ContentWriterAgent":
        # Create professional marketing content
        hooks = {
            'LinkedIn': get_linkedin_hook(tone, target_audience),
            'Instagram': get_instagram_hook(tone, target_audience),
            'Twitter': get_twitter_hook(tone, target_audience),
            'Facebook': get_facebook_hook(tone, target_audience),
            'TikTok': get_tiktok_hook(tone),
            'Email': get_email_hook(tone, target_audience)
        }
        
        hook = hooks.get(platform, f"Attention {target_audience}!")
        content_body = generate_platform_content(platform, description, target_audience, tone)
        cta = generate_platform_cta(platform, campaign_name)
        hashtags = generate_hashtags(platform, description, target_audience)
        
        output = f"""{hook}

{content_body}

{cta}

{hashtags}"""

    elif agent_name == "EditorAgent":
        # Enhance and refine the content
        enhanced_content = enhance_with_marketing_psychology(previous_output, task_data)
        refined_copy = apply_copywriting_principles(enhanced_content, task_data)
        output = optimize_for_platform(refined_copy, task_data)

    elif agent_name == "InspectorAgent":
        # Final QA and optimization
        final_content = apply_final_optimizations(previous_output, task_data)
        performance_insights = generate_performance_insights(final_content, task_data)
        
        # Combine content with performance insights
        output = f"""{final_content}

📈 PERFORMANCE OPTIMIZATION:
{performance_insights}"""

    else:
        output = f"Processed by {agent_name}: {previous_output or 'Initial processing complete'}"
    
    return output

def generate_platform_content(platform, description, audience, tone):
    """Generate platform-specific content body"""
    if platform == "LinkedIn":
        return get_linkedin_format(description, audience)
    elif platform == "Instagram":
        return get_instagram_format(description, audience)
    elif platform == "Twitter":
        return get_twitter_format(description, audience)
    elif platform == "Facebook":
        return get_facebook_format(description, audience)
    elif platform == "TikTok":
        return get_tiktok_format(description)
    elif platform == "Email":
        return get_email_format(description, audience)
    else:
        return f"""Transform your {audience.lower()} experience with {description}.

Our solution addresses the key challenges facing {audience.lower()} today:
• Streamlined processes that save time
• Data-driven insights for better decisions  
• Scalable solutions that grow with you

Join thousands of {audience.lower()} who've already made the switch."""

def generate_platform_cta(platform, campaign_name):
    """Generate platform-specific call-to-action"""
    ctas = {
        'LinkedIn': get_linkedin_cta(campaign_name),
        'Instagram': get_instagram_cta(),
        'Twitter': get_twitter_cta(),
        'Facebook': get_facebook_cta(),
        'TikTok': get_tiktok_cta(),
        'Email': get_email_cta(campaign_name)
    }
    return ctas.get(platform, f"Learn more about {campaign_name} →")

def generate_hashtags(platform, description, audience):
    """Generate relevant hashtags for the platform"""
    base_tags = {
        'LinkedIn': ['#productivity', '#business', '#growth', '#innovation', '#leadership'],
        'Instagram': ['#business', '#entrepreneur', '#success', '#motivation', '#growth'],
        'Twitter': ['#business', '#productivity', '#tech', '#innovation'],
        'Facebook': ['#business', '#community', '#growth', '#success'],
        'TikTok': ['#business', '#entrepreneur', '#productivity', '#success', '#growth'],
        'Email': []  # No hashtags for email
    }
    
    tags = base_tags.get(platform, [])
    
    # Add audience-specific tags
    audience_tags = {
        'entrepreneurs': ['#entrepreneur', '#startup', '#founder'],
        'marketers': ['#marketing', '#digitalmarketing', '#strategy'],
        'executives': ['#leadership', '#management', '#strategy'],
        'professionals': ['#professional', '#career', '#workplace']
    }
    
    tags.extend(audience_tags.get(audience.lower(), []))
    
    # Add description-based tags
    if 'automation' in description.lower():
        tags.append('#automation')
    if 'ai' in description.lower():
        tags.append('#ai')
    if 'productivity' in description.lower():
        tags.append('#productivity')
    
    # Format for platform
    if platform == "Email":
        return ""
    elif len(tags) > 5:
        tags = tags[:5]
    
    return " ".join(tags)

def generate_performance_insights(content, task_data):
    """Generate realistic performance optimization insights"""
    platform = task_data.get('platform', 'LinkedIn')
    audience = task_data.get('target_audience', 'professionals')
    
    insights = []
    
    # Posting time recommendations
    optimal_time = get_optimal_posting_time(platform)
    insights.append(f"📅 Optimal posting time: {optimal_time}")
    
    # Engagement predictions
    engagement = get_engagement_prediction(platform)
    insights.append(f"📊 Expected engagement rate: {engagement}")
    
    # Platform-specific boosts
    boost = get_boost_suggestion(platform)
    insights.append(f"🚀 Performance boost: {boost}")
    
    # A/B testing suggestions
    ab_test = get_ab_test_suggestion(task_data)
    insights.append(f"🧪 A/B test idea: {ab_test}")
    
    # Audience-specific insights
    if audience.lower() == 'entrepreneurs':
        insights.append("💡 Entrepreneurs respond well to data-driven success stories")
    elif audience.lower() == 'marketers':
        insights.append("📈 Marketing professionals prefer actionable tactics over theory")
    elif audience.lower() == 'executives':
        insights.append("⚡ Executives value ROI-focused messaging and time efficiency")
    
    return "\n".join(insights)
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

@marketing_lab_routes.route('/api/marketing-lab/recommendations', methods=['POST'])
def get_posting_recommendations():
    """Get optimal posting recommendations for platform and audience"""
    try:
        data = request.get_json()
        platform = data.get('platform', 'LinkedIn')
        target_audience = data.get('target_audience', 'professionals')
        
        # Generate data-driven recommendations
        recommendations = generate_posting_recommendations(platform, target_audience)
        
        # Store recommendations in MongoDB for analytics
        if mongo is not None and mongo.db is not None:
            try:
                rec_log = {
                    'platform': platform,
                    'target_audience': target_audience,
                    'recommendations': recommendations,
                    'timestamp': datetime.now(),
                    'request_id': str(uuid.uuid4())
                }
                mongo.db.marketing_recommendations.insert_one(rec_log)
            except Exception as e:
                print(f"[MARKETING LAB] Failed to log recommendations: {e}")
        
        return create_success_response(recommendations, "Recommendations generated successfully")
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return create_error_response(str(e), 500)

def generate_posting_recommendations(platform, target_audience):
    """Generate intelligent posting recommendations based on platform and audience"""
    
    # Platform-specific optimal times and frequency
    platform_data = {
        'LinkedIn': {
            'best_days': ['Tuesday', 'Wednesday', 'Thursday'],
            'best_times': ['8:00-10:00 AM', '12:00-2:00 PM'],
            'frequency': 'Daily (weekdays only)',
            'engagement_peak': 'Tuesday at 10:00 AM',
            'content_length': '1,300 characters optimal',
            'hashtags': '3-5 relevant hashtags',
            'rationale': f'{target_audience} check LinkedIn during business hours and lunch breaks. B2B audiences are most active mid-week.'
        },
        'Instagram': {
            'best_days': ['Wednesday', 'Friday', 'Saturday'],
            'best_times': ['11:00 AM-1:00 PM', '7:00-9:00 PM'],
            'frequency': '1-2 times daily',
            'engagement_peak': 'Friday at 8:00 PM',
            'content_length': '125-150 characters in caption',
            'hashtags': '10-15 trending hashtags',
            'rationale': f'{target_audience} scroll Instagram during lunch breaks and evening leisure time.'
        },
        'Twitter': {
            'best_days': ['Tuesday', 'Wednesday', 'Friday'],
            'best_times': ['8:00-10:00 AM', '7:00-9:00 PM'],
            'frequency': '3-5 times daily',
            'engagement_peak': 'Wednesday at 9:00 AM',
            'content_length': '71-100 characters for optimal engagement',
            'hashtags': '1-2 hashtags maximum',
            'rationale': f'{target_audience} use Twitter for real-time updates during commutes and breaks.'
        },
        'Facebook': {
            'best_days': ['Thursday', 'Friday', 'Saturday'],
            'best_times': ['1:00-3:00 PM', '7:00-9:00 PM'],
            'frequency': '1 time daily or 5-6 times weekly',
            'engagement_peak': 'Thursday at 3:00 PM',
            'content_length': '40-80 characters for highest engagement',
            'hashtags': '1-2 hashtags',
            'rationale': f'{target_audience} use Facebook for social connection during afternoon breaks and evenings.'
        },
        'TikTok': {
            'best_days': ['Tuesday', 'Thursday', 'Friday'],
            'best_times': ['6:00-10:00 AM', '7:00-9:00 PM'],
            'frequency': '1-4 times daily',
            'engagement_peak': 'Friday at 8:00 PM',
            'content_length': '15-60 second videos',
            'hashtags': '3-5 trending hashtags',
            'rationale': f'{target_audience} watch TikTok during morning routines and evening relaxation.'
        },
        'Email': {
            'best_days': ['Tuesday', 'Wednesday', 'Thursday'],
            'best_times': ['10:00 AM-12:00 PM', '2:00-4:00 PM'],
            'frequency': '1-2 times weekly',
            'engagement_peak': 'Tuesday at 10:00 AM',
            'content_length': '50-125 characters subject line',
            'subject_tips': 'Personalized, urgency, clear benefit',
            'rationale': f'{target_audience} check email during work hours, avoiding Monday morning and Friday afternoon overload.'
        }
    }
    
    # Get platform-specific data
    platform_info = platform_data.get(platform, platform_data['LinkedIn'])
    
    # Audience-specific adjustments
    audience_adjustments = get_audience_adjustments(target_audience)
    
    # Apply audience adjustments to platform data
    adjusted_recommendations = apply_audience_adjustments(platform_info, audience_adjustments)
    
    # Add performance insights
    performance_metrics = {
        'expected_reach': get_expected_reach(platform, target_audience),
        'engagement_rate': get_expected_engagement(platform, target_audience),
        'best_content_types': get_best_content_types(platform, target_audience),
        'growth_strategy': get_growth_strategy(platform, target_audience)
    }
    
    return {
        'platform': platform,
        'target_audience': target_audience,
        'optimal_posting': adjusted_recommendations,
        'performance_insights': performance_metrics,
        'generated_at': datetime.now().isoformat(),
        'confidence_score': calculate_confidence_score(platform, target_audience)
    }

def get_audience_adjustments(target_audience):
    """Get audience-specific timing and frequency adjustments"""
    audience_data = {
        'entrepreneurs': {
            'time_shift': 'early_morning',  # Earlier times
            'frequency_modifier': 1.2,  # More frequent
            'weekend_activity': True
        },
        'marketers': {
            'time_shift': 'business_hours',
            'frequency_modifier': 1.1,
            'weekend_activity': False
        },
        'executives': {
            'time_shift': 'early_morning',
            'frequency_modifier': 0.8,  # Less frequent, higher quality
            'weekend_activity': False
        },
        'students': {
            'time_shift': 'evening',
            'frequency_modifier': 1.3,
            'weekend_activity': True
        },
        'professionals': {
            'time_shift': 'business_hours',
            'frequency_modifier': 1.0,
            'weekend_activity': False
        }
    }
    
    return audience_data.get(target_audience.lower(), audience_data['professionals'])

def apply_audience_adjustments(platform_info, adjustments):
    """Apply audience-specific adjustments to platform recommendations"""
    adjusted = platform_info.copy()
    
    # Adjust frequency
    if 'daily' in adjusted['frequency'].lower():
        if adjustments['frequency_modifier'] > 1.1:
            adjusted['frequency'] += ' (Consider 2x daily for high engagement audiences)'
        elif adjustments['frequency_modifier'] < 0.9:
            adjusted['frequency'] += ' (Reduce to 3-4x weekly for executive audiences)'
    
    # Add audience-specific rationale
    audience_note = f" {adjustments.get('special_note', '')}"
    adjusted['rationale'] += audience_note
    
    return adjusted

def get_expected_reach(platform, audience):
    """Calculate expected reach based on platform and audience"""
    base_reach = {
        'LinkedIn': 1500,
        'Instagram': 2000,
        'Twitter': 800,
        'Facebook': 1200,
        'TikTok': 5000,
        'Email': 300
    }
    
    audience_multiplier = {
        'entrepreneurs': 1.2,
        'marketers': 1.3,
        'executives': 0.8,
        'students': 1.5,
        'professionals': 1.0
    }
    
    base = base_reach.get(platform, 1000)
    multiplier = audience_multiplier.get(audience.lower(), 1.0)
    
    return int(base * multiplier)

def get_expected_engagement(platform, audience):
    """Calculate expected engagement rate"""
    base_engagement = {
        'LinkedIn': 2.5,
        'Instagram': 1.8,
        'Twitter': 0.9,
        'Facebook': 0.2,
        'TikTok': 6.5,
        'Email': 22.0
    }
    
    return f"{base_engagement.get(platform, 2.0)}%"

def get_best_content_types(platform, audience):
    """Get recommended content types for platform and audience"""
    content_types = {
        'LinkedIn': ['Professional insights', 'Industry news', 'Thought leadership', 'Case studies'],
        'Instagram': ['Behind-the-scenes', 'User-generated content', 'Stories', 'Reels'],
        'Twitter': ['News updates', 'Quick tips', 'Threads', 'Live commentary'],
        'Facebook': ['Community posts', 'Event announcements', 'Longer-form content', 'Video'],
        'TikTok': ['Trending challenges', 'Educational content', 'Behind-the-scenes', 'Entertainment'],
        'Email': ['Newsletters', 'Product updates', 'Exclusive offers', 'Educational content']
    }
    
    return content_types.get(platform, ['General content', 'Industry updates'])

def get_growth_strategy(platform, audience):
    """Get growth strategy recommendations"""
    strategies = {
        'LinkedIn': 'Engage with industry leaders, join relevant groups, share valuable insights',
        'Instagram': 'Use trending hashtags, collaborate with influencers, post consistently',
        'Twitter': 'Join conversations, use trending hashtags, retweet relevant content',
        'Facebook': 'Build community groups, run targeted ads, encourage user interaction',
        'TikTok': 'Follow trends, use popular sounds, create shareable content',
        'Email': 'Segment lists, personalize content, optimize send times'
    }
    
    return strategies.get(platform, 'Consistent posting and audience engagement')

def calculate_confidence_score(platform, audience):
    """Calculate confidence score for recommendations"""
    # Base confidence on data availability and platform maturity
    platform_confidence = {
        'LinkedIn': 0.9,
        'Instagram': 0.85,
        'Twitter': 0.8,
        'Facebook': 0.75,
        'TikTok': 0.7,
        'Email': 0.95
    }
    
    return platform_confidence.get(platform, 0.8)

@marketing_lab_routes.route('/api/marketing-lab/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify AI, Pinecone, and MongoDB connections"""
    try:
        health_status = {
            'ai_available': AI_AVAILABLE and bool(os.getenv('OPENAI_API_KEY')),
            'pinecone_available': MEMORY_AVAILABLE and bool(os.getenv('PINECONE_API_KEY')),
            'mongodb_available': mongo is not None and mongo.db is not None,
            'timestamp': datetime.now().isoformat()
        }
        
        # Test connections
        if health_status['ai_available']:
            try:
                openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "test"}],
                    max_tokens=1
                )
                health_status['openai_status'] = 'connected'
            except Exception as e:
                health_status['openai_status'] = f'error: {str(e)}'
                health_status['ai_available'] = False
        
        if health_status['pinecone_available']:
            try:
                # Test Pinecone connection
                marketing_memory.search_memories("test", namespace="marketing", top_k=1)
                health_status['pinecone_status'] = 'connected'
            except Exception as e:
                health_status['pinecone_status'] = f'error: {str(e)}'
                health_status['pinecone_available'] = False
        
        if health_status['mongodb_available']:
            try:
                mongo.db.marketing_health_check.insert_one({
                    'timestamp': datetime.now(),
                    'status': 'test'
                })
                health_status['mongodb_status'] = 'connected'
            except Exception as e:
                health_status['mongodb_status'] = f'error: {str(e)}'
                health_status['mongodb_available'] = False
        
        return create_success_response(health_status, "Health check completed")
        
    except Exception as e:
        return create_error_response(f"Health check failed: {str(e)}", 500)
