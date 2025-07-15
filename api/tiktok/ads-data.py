import json
import os
import requests
from datetime import datetime, timedelta

def handler(request):
    """TikTok Ads data endpoint"""
    
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
    
    # TikTok API credentials (should be stored in environment variables)
    access_token = os.environ.get('TIKTOK_ACCESS_TOKEN')
    advertiser_id = os.environ.get('TIKTOK_ADVERTISER_ID')
    
    if not access_token or not advertiser_id:
        # Return sample data if TikTok credentials not available
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'campaigns': [
                    {
                        'id': 'camp_001',
                        'name': 'Summer Campaign',
                        'spend': 1250.50,
                        'reach': 45000,
                        'conversions': 88,
                        'ctr': 2.4,
                        'cpm': 12.50
                    },
                    {
                        'id': 'camp_002',
                        'name': 'Product Launch',
                        'spend': 890.25,
                        'reach': 32000,
                        'conversions': 65,
                        'ctr': 2.1,
                        'cpm': 15.20
                    }
                ],
                'topAds': [
                    {
                        'id': 'ad_001',
                        'thumbnail': 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=150&h=150&fit=crop',
                        'caption': 'Summer vibes with our new collection! 🌞',
                        'views': 125000,
                        'ctr': 3.2,
                        'conversions': 450,
                        'spend': 420.50
                    }
                ]
            })
        }
    
    try:
        # Make actual TikTok API calls
        base_url = 'https://business-api.tiktok.com/open_api/v1.3'
        
        # Get campaign data
        campaign_url = f"{base_url}/report/integrated/get/"
        campaign_params = {
            'advertiser_id': advertiser_id,
            'report_type': 'AUCTION',
            'dimensions': ['campaign_id', 'campaign_name'],
            'metrics': ['spend', 'reach', 'conversions', 'ctr', 'cpm'],
            'start_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
            'end_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        campaign_response = requests.get(
            campaign_url,
            params=campaign_params,
            headers={'Access-Token': access_token}
        )
        
        if campaign_response.status_code == 200:
            campaign_data = campaign_response.json()
            
            # Get ad data
            ad_url = f"{base_url}/report/integrated/get/"
            ad_params = {
                'advertiser_id': advertiser_id,
                'report_type': 'AUCTION',
                'dimensions': ['ad_id', 'ad_name'],
                'metrics': ['spend', 'impressions', 'clicks', 'conversions', 'ctr'],
                'start_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                'end_date': datetime.now().strftime('%Y-%m-%d')
            }
            
            ad_response = requests.get(
                ad_url,
                params=ad_params,
                headers={'Access-Token': access_token}
            )
            
            if ad_response.status_code == 200:
                ad_data = ad_response.json()
                
                # Process and format the data
                processed_data = process_tiktok_data(campaign_data, ad_data)
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(processed_data)
                }
        
        # If API calls fail, return error
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to fetch TikTok data'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def process_tiktok_data(campaign_data, ad_data):
    """Process raw TikTok API data into dashboard format"""
    
    campaigns = []
    if campaign_data.get('data', {}).get('list'):
        for item in campaign_data['data']['list']:
            dimensions = item.get('dimensions', {})
            metrics = item.get('metrics', {})
            
            campaigns.append({
                'id': dimensions.get('campaign_id'),
                'name': dimensions.get('campaign_name'),
                'spend': float(metrics.get('spend', 0)),
                'reach': int(metrics.get('reach', 0)),
                'conversions': int(metrics.get('conversions', 0)),
                'ctr': float(metrics.get('ctr', 0)),
                'cpm': float(metrics.get('cpm', 0))
            })
    
    top_ads = []
    if ad_data.get('data', {}).get('list'):
        # Sort by conversions and take top 3
        sorted_ads = sorted(
            ad_data['data']['list'],
            key=lambda x: int(x.get('metrics', {}).get('conversions', 0)),
            reverse=True
        )[:3]
        
        for item in sorted_ads:
            dimensions = item.get('dimensions', {})
            metrics = item.get('metrics', {})
            
            top_ads.append({
                'id': dimensions.get('ad_id'),
                'name': dimensions.get('ad_name'),
                'thumbnail': 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=150&h=150&fit=crop',  # Placeholder
                'caption': dimensions.get('ad_name', 'TikTok Ad'),
                'views': int(metrics.get('impressions', 0)),
                'ctr': float(metrics.get('ctr', 0)),
                'conversions': int(metrics.get('conversions', 0)),
                'spend': float(metrics.get('spend', 0))
            })
    
    return {
        'campaigns': campaigns,
        'topAds': top_ads
    }
