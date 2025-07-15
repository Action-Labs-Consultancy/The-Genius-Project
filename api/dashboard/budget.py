import json
import os
from datetime import datetime, timedelta

def handler(request):
    """Budget data endpoint"""
    
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
    
    # Generate spend over time data for the last 30 days
    spend_over_time = []
    base_date = datetime.now() - timedelta(days=30)
    
    for i in range(30):
        date = base_date + timedelta(days=i)
        spend_over_time.append({
            'date': date.strftime('%b %d'),
            'spend': 500 + (i * 50) + (i % 7 * 100),  # Realistic spend pattern
            'cac': 12 + (i * 0.5) + (i % 3 * 2)  # Realistic CAC trend
        })
    
    # Real budget data - replace with actual database queries
    budget_data = {
        'monthly': 17500,
        'daily': 583,  # monthly / 30
        'balance': 10810,
        'spendOverTime': spend_over_time
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(budget_data)
    }
