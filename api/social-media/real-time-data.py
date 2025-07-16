from datetime import datetime, timedelta
import json
import os
import requests
from pymongo import MongoClient
import asyncio
import aiohttp

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['the_genius_project']
social_media_data = db['social_media_data']

# API credentials (should be stored in environment variables)
TIKTOK_API_KEY = os.getenv('TIKTOK_API_KEY')
FACEBOOK_API_TOKEN = os.getenv('FACEBOOK_API_TOKEN')
INSTAGRAM_API_TOKEN = os.getenv('INSTAGRAM_API_TOKEN')

async def fetch_tiktok_data():
    """Fetch TikTok ads and content performance data"""
    try:
        headers = {
            'Authorization': f'Bearer {TIKTOK_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        # TikTok Business API endpoints
        ads_url = 'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/'
        content_url = 'https://business-api.tiktok.com/open_api/v1.3/ad/get/'
        
        async with aiohttp.ClientSession() as session:
            # Fetch ads performance
            ads_params = {
                'advertiser_id': os.getenv('TIKTOK_ADVERTISER_ID'),
                'report_type': 'BASIC',
                'data_level': 'AUCTION_AD',
                'start_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                'end_date': datetime.now().strftime('%Y-%m-%d'),
                'metrics': [
                    'impressions', 'clicks', 'ctr', 'conversions', 
                    'cost_per_conversion', 'spend', 'reach'
                ]
            }
            
            async with session.get(ads_url, headers=headers, params=ads_params) as response:
                if response.status == 200:
                    ads_data = await response.json()
                    
                    processed_ads = []
                    if ads_data.get('data') and ads_data['data'].get('list'):
                        for ad in ads_data['data']['list']:
                            processed_ads.append({
                                'id': ad.get('ad_id'),
                                'name': ad.get('ad_name', 'Unknown Ad'),
                                'views': ad.get('impressions', 0),
                                'clicks': ad.get('clicks', 0),
                                'ctr': ad.get('ctr', 0),
                                'conversions': ad.get('conversions', 0),
                                'spend': ad.get('spend', 0),
                                'reach': ad.get('reach', 0),
                                'cpi': ad.get('cost_per_conversion', 0),
                                'platform': 'tiktok',
                                'last_updated': datetime.now()
                            })
                    
                    return processed_ads
                else:
                    print(f"TikTok API error: {response.status}")
                    return []
                    
    except Exception as e:
        print(f"Error fetching TikTok data: {e}")
        return []

async def fetch_facebook_data():
    """Fetch Facebook/Meta ads and content performance data"""
    try:
        # Facebook Marketing API
        base_url = 'https://graph.facebook.com/v18.0'
        
        async with aiohttp.ClientSession() as session:
            # Get account insights
            insights_url = f'{base_url}/act_{os.getenv("FACEBOOK_AD_ACCOUNT_ID")}/insights'
            params = {
                'access_token': FACEBOOK_API_TOKEN,
                'fields': 'impressions,clicks,ctr,conversions,spend,reach,ad_id,ad_name',
                'level': 'ad',
                'time_range': json.dumps({
                    'since': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                    'until': datetime.now().strftime('%Y-%m-%d')
                })
            }
            
            async with session.get(insights_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    processed_ads = []
                    if data.get('data'):
                        for ad in data['data']:
                            processed_ads.append({
                                'id': ad.get('ad_id'),
                                'name': ad.get('ad_name', 'Unknown Ad'),
                                'views': int(ad.get('impressions', 0)),
                                'clicks': int(ad.get('clicks', 0)),
                                'ctr': float(ad.get('ctr', 0)),
                                'conversions': int(ad.get('conversions', 0)),
                                'spend': float(ad.get('spend', 0)),
                                'reach': int(ad.get('reach', 0)),
                                'cpi': float(ad.get('spend', 0)) / max(int(ad.get('conversions', 1)), 1),
                                'platform': 'facebook',
                                'last_updated': datetime.now()
                            })
                    
                    return processed_ads
                else:
                    print(f"Facebook API error: {response.status}")
                    return []
                    
    except Exception as e:
        print(f"Error fetching Facebook data: {e}")
        return []

async def fetch_instagram_data():
    """Fetch Instagram content performance data"""
    try:
        base_url = 'https://graph.facebook.com/v18.0'
        
        async with aiohttp.ClientSession() as session:
            # Get Instagram business account media
            media_url = f'{base_url}/{os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")}/media'
            params = {
                'access_token': INSTAGRAM_API_TOKEN,
                'fields': 'id,media_type,caption,like_count,comments_count,impressions,reach,saved'
            }
            
            async with session.get(media_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    processed_content = []
                    if data.get('data'):
                        for post in data['data']:
                            processed_content.append({
                                'id': post.get('id'),
                                'type': post.get('media_type', 'unknown').lower(),
                                'caption': post.get('caption', '')[:100] + '...' if post.get('caption') else 'No caption',
                                'likes': post.get('like_count', 0),
                                'comments': post.get('comments_count', 0),
                                'impressions': post.get('impressions', 0),
                                'reach': post.get('reach', 0),
                                'saves': post.get('saved', 0),
                                'platform': 'instagram',
                                'last_updated': datetime.now()
                            })
                    
                    return processed_content
                else:
                    print(f"Instagram API error: {response.status}")
                    return []
                    
    except Exception as e:
        print(f"Error fetching Instagram data: {e}")
        return []

def calculate_engagement_metrics(data):
    """Calculate engagement metrics for social media content"""
    metrics = {
        'total_reach': 0,
        'total_impressions': 0,
        'total_engagement': 0,
        'average_ctr': 0,
        'top_performing_platform': None,
        'engagement_rate': 0
    }
    
    platform_performance = {}
    
    for item in data:
        platform = item.get('platform', 'unknown')
        
        if platform not in platform_performance:
            platform_performance[platform] = {
                'reach': 0,
                'impressions': 0,
                'engagement': 0,
                'count': 0
            }
        
        # Calculate engagement
        engagement = (item.get('likes', 0) + 
                     item.get('comments', 0) + 
                     item.get('saves', 0) + 
                     item.get('clicks', 0))
        
        platform_performance[platform]['reach'] += item.get('reach', 0)
        platform_performance[platform]['impressions'] += item.get('impressions', 0)
        platform_performance[platform]['engagement'] += engagement
        platform_performance[platform]['count'] += 1
        
        metrics['total_reach'] += item.get('reach', 0)
        metrics['total_impressions'] += item.get('impressions', 0)
        metrics['total_engagement'] += engagement
    
    # Calculate averages and find top platform
    if platform_performance:
        top_platform = max(platform_performance.items(), 
                          key=lambda x: x[1]['engagement'])
        metrics['top_performing_platform'] = top_platform[0]
        
        if metrics['total_impressions'] > 0:
            metrics['engagement_rate'] = (metrics['total_engagement'] / metrics['total_impressions']) * 100
    
    return metrics

async def handler(event, context):
    try:
        # Fetch data from all platforms concurrently
        tiktok_data, facebook_data, instagram_data = await asyncio.gather(
            fetch_tiktok_data(),
            fetch_facebook_data(),
            fetch_instagram_data()
        )
        
        # Combine all data
        all_ads = tiktok_data + facebook_data
        all_content = instagram_data
        
        # Calculate engagement metrics
        engagement_metrics = calculate_engagement_metrics(all_ads + all_content)
        
        # Store in MongoDB
        social_media_record = {
            'timestamp': datetime.now(),
            'ads_data': all_ads,
            'content_data': all_content,
            'engagement_metrics': engagement_metrics,
            'platforms': ['tiktok', 'facebook', 'instagram']
        }
        
        # Update or insert the latest data
        social_media_data.update_one(
            {'date': datetime.now().strftime('%Y-%m-%d')},
            {'$set': social_media_record},
            upsert=True
        )
        
        # Sort ads by performance
        top_ads = sorted(all_ads, key=lambda x: x.get('conversions', 0), reverse=True)[:10]
        top_content = sorted(all_content, key=lambda x: x.get('likes', 0), reverse=True)[:10]
        
        response_data = {
            'success': True,
            'data': {
                'top_ads': top_ads,
                'top_content': top_content,
                'engagement_metrics': engagement_metrics,
                'platform_summary': {
                    'tiktok': {
                        'ads_count': len(tiktok_data),
                        'total_spend': sum(ad.get('spend', 0) for ad in tiktok_data),
                        'total_reach': sum(ad.get('reach', 0) for ad in tiktok_data)
                    },
                    'facebook': {
                        'ads_count': len(facebook_data),
                        'total_spend': sum(ad.get('spend', 0) for ad in facebook_data),
                        'total_reach': sum(ad.get('reach', 0) for ad in facebook_data)
                    },
                    'instagram': {
                        'content_count': len(instagram_data),
                        'total_reach': sum(content.get('reach', 0) for content in instagram_data),
                        'total_engagement': sum(content.get('likes', 0) + content.get('comments', 0) 
                                                for content in instagram_data)
                    }
                }
            },
            'last_updated': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(response_data, default=str)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'An error occurred while fetching social media data'
            })
        }

# For testing purposes - sample data generator
def generate_sample_social_data():
    """Generate sample social media data for testing"""
    sample_ads = [
        {
            'id': 'TT001',
            'name': 'Summer Campaign Video',
            'views': 125000,
            'clicks': 4000,
            'ctr': 3.2,
            'conversions': 450,
            'spend': 1200,
            'reach': 89000,
            'cpi': 2.67,
            'platform': 'tiktok',
            'last_updated': datetime.now()
        },
        {
            'id': 'FB001',
            'name': 'Product Launch Campaign',
            'views': 98000,
            'clicks': 2744,
            'ctr': 2.8,
            'conversions': 320,
            'spend': 980,
            'reach': 67000,
            'cpi': 3.06,
            'platform': 'facebook',
            'last_updated': datetime.now()
        }
    ]
    
    sample_content = [
        {
            'id': 'IG001',
            'type': 'video',
            'caption': 'Behind the scenes of our product development',
            'likes': 4500,
            'comments': 890,
            'impressions': 78000,
            'reach': 56000,
            'saves': 340,
            'platform': 'instagram',
            'last_updated': datetime.now()
        }
    ]
    
    return sample_ads, sample_content
