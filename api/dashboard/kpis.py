import json
import os
from datetime import datetime, timedelta
import random

def handler(request):
    """Dashboard KPIs endpoint"""
    
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
    
    # In a real implementation, this would fetch from your database
    # For now, we'll use real-time calculations or API calls
    
    # Sample real data structure - replace with actual database queries
    kpi_data = {
        'premisesDisbursed': 470,
        'achievementRatio': 21.76,
        'cac': 14.23,
        'cpa': 2.32,
        'spendAmount': 2670,
        'tvSpend': 1200,
        'tvReach': 45000,
        'lastMonth': {
            'achievementRatio': 74.96,
            'financeBehavior': 1057,
            'gc': 6300,
            'cac': 14.90
        }
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(kpi_data)
    }
