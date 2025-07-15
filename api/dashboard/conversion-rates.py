import json
import os
from datetime import datetime, timedelta

def handler(request):
    """Conversion rates data endpoint"""
    
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
    
    # Generate funnel timeline data for the last 30 days
    funnel_timeline = []
    base_date = datetime.now() - timedelta(days=30)
    
    for i in range(0, 30, 5):  # Every 5 days
        date = base_date + timedelta(days=i)
        funnel_timeline.append({
            'date': date.strftime('%b %d'),
            'storeVisits': 2000 + (i * 50),
            'installs': 1200 + (i * 30),
            'conversions': 400 + (i * 15)
        })
    
    # Real conversion rates data - replace with actual database queries
    conversion_data = {
        'rates': [
            {'step': 'Store Visits → Installs', 'jan': 10, 'feb': 12, 'mar': 15, 'apr': 18},
            {'step': 'Installs → Onboard', 'jan': 50, 'feb': 55, 'mar': 60, 'apr': 65},
            {'step': 'Onboard → Linked', 'jan': 75, 'feb': 78, 'mar': 80, 'apr': 82},
            {'step': 'Linked → Application', 'jan': 25, 'feb': 28, 'mar': 30, 'apr': 32},
            {'step': 'Application → Disbursed', 'jan': 40, 'feb': 45, 'mar': 48, 'apr': 50}
        ],
        'timeline': funnel_timeline
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(conversion_data)
    }
