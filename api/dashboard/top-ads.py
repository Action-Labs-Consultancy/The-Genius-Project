import json
import os
from datetime import datetime, timedelta

def handler(request):
    """Top ads data endpoint"""
    
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
    
    # Real top ads data - replace with actual TikTok API calls
    top_ads = [
        {
            'id': 'AD001',
            'thumbnail': 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=150&h=150&fit=crop',
            'caption': 'Summer vibes with our new collection! 🌞 #SummerSale #Fashion',
            'views': 125000,
            'ctr': 3.2,
            'conversions': 450
        },
        {
            'id': 'AD002', 
            'thumbnail': 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=150&h=150&fit=crop',
            'caption': 'Transform your space with our premium decor ✨ #HomeDecor #Interior',
            'views': 98000,
            'ctr': 2.8,
            'conversions': 320
        },
        {
            'id': 'AD003',
            'thumbnail': 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=150&h=150&fit=crop',
            'caption': 'Fitness goals made easy! Join thousands of happy customers 💪 #Fitness',
            'views': 87000,
            'ctr': 2.5,
            'conversions': 280
        }
    ]
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(top_ads)
    }
