import json
import os
from datetime import datetime, timedelta

def handler(request):
    """Funnel data endpoint"""
    
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Get user_id from query parameters
    user_id = request.args.get('user_id', 'default')
    
    # Real funnel data - replace with actual database queries
    funnel_data = {
        'storeVisits': 12000,
        'installs': 8500,
        'onboard': 6200,
        'linked': 4800,
        'disbursed': 3200
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(funnel_data)
    }
