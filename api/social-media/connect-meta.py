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
    Handle Meta (Facebook/Instagram) OAuth connection
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
        
        # Generate Meta OAuth URL
        auth_url = generate_meta_auth_url(user_id)
        
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
                'message': 'Error generating Meta auth URL'
            })
        }

def generate_meta_auth_url(user_id):
    """
    Generate Meta OAuth authorization URL
    """
    
    # Meta OAuth parameters
    client_id = os.getenv('META_CLIENT_ID')
    redirect_uri = os.getenv('META_REDIRECT_URI', 'https://your-domain.com/auth/meta/callback')
    state = f"user_{user_id}_{datetime.now().timestamp()}"
    
    # Meta OAuth scopes for ads and pages
    scope = "ads_management,ads_read,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish"
    
    # Build authorization URL
    base_url = "https://www.facebook.com/v18.0/dialog/oauth"
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': scope,
        'response_type': 'code',
        'state': state
    }
    
    # Store state for verification
    social_connections.update_one(
        {'userId': user_id},
        {
            '$set': {
                'meta.state': state,
                'meta.connecting': True,
                'meta.timestamp': datetime.now()
            }
        },
        upsert=True
    )
    
    # Generate full URL
    auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    return auth_url
