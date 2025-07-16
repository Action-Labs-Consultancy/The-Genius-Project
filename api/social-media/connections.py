from datetime import datetime
import json
import os
from pymongo import MongoClient
from bson import ObjectId

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['the_genius_project']
social_connections = db['social_connections']

def handler(request):
    """
    Handle social media connections endpoint
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
        
        # Check social media connections for the user
        connections = check_user_connections(user_id)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(connections)
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
                'message': 'Error checking social connections'
            })
        }

def check_user_connections(user_id):
    """
    Check which social media platforms are connected for a user
    """
    
    # Find user's social connections
    user_connections = social_connections.find_one({
        'userId': user_id
    })
    
    if not user_connections:
        return {
            'tiktok': False,
            'meta': False,
            'instagram': False
        }
    
    return {
        'tiktok': user_connections.get('tiktok', {}).get('connected', False),
        'meta': user_connections.get('meta', {}).get('connected', False),
        'instagram': user_connections.get('instagram', {}).get('connected', False)
    }
