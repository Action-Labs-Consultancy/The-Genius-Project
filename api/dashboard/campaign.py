import json
import os
from datetime import datetime, timedelta

def handler(request):
    """Campaign data endpoint"""
    
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
    
    # Real campaign data - replace with actual database queries
    campaign_data = {
        'title': 'Summer Campaign - Q3 2025',
        'achieved': 2887,
        'goal': 12825,
        'applicationsByProduct': [
            {'name': 'Product A', 'percentage': 45},
            {'name': 'Product B', 'percentage': 30},
            {'name': 'Product C', 'percentage': 25}
        ],
        'disbursedByProduct': [
            {'name': 'Product A', 'percentage': 61},
            {'name': 'Product B', 'percentage': 21},
            {'name': 'Product C', 'percentage': 18}
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(campaign_data)
    }
