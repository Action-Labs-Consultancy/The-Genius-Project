from datetime import datetime
import json
import os
from pymongo import MongoClient
from bson import ObjectId
import urllib.parse

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['the_genius_project']
social_connections = db['social_connections']

def handler(request):
    """
    Handle TikTok OAuth connection
    """
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'user_id is required'
                })
            }
        
        # Generate TikTok OAuth URL
        auth_url = generate_tiktok_auth_url(user_id)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({
                'authUrl': auth_url
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Error generating TikTok auth URL'
            })
        }

def generate_tiktok_auth_url(user_id):
    """
    Generate TikTok OAuth authorization URL
    """
    
    # TikTok OAuth parameters
    client_id = os.getenv('TIKTOK_CLIENT_ID')
    redirect_uri = os.getenv('TIKTOK_REDIRECT_URI', 'https://your-domain.com/auth/tiktok/callback')
    state = f"user_{user_id}_{datetime.now().timestamp()}"
    
    # TikTok OAuth scopes
    scope = "user.info.basic,video.list,video.upload"
    
    # Build authorization URL
    base_url = "https://www.tiktok.com/v2/auth/authorize"
    params = {
        'client_key': client_id,
        'scope': scope,
        'response_type': 'code',
        'redirect_uri': redirect_uri,
        'state': state
    }
    
    # Store state for verification
    social_connections.update_one(
        {'userId': user_id},
        {
            '$set': {
                'tiktok.state': state,
                'tiktok.connecting': True,
                'tiktok.timestamp': datetime.now()
            }
        },
        upsert=True
    )
    
    # Generate full URL
    auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    return auth_url
