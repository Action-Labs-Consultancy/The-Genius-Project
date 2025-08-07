import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import urllib.parse
import secrets
import logging

logger = logging.getLogger(__name__)

class OAuthService:
    """Service for handling OAuth2 flows for different social media platforms"""
    
    def __init__(self):
        self.platforms = {
            'facebook': FacebookOAuth(),
            'instagram': InstagramOAuth(), 
            'linkedin': LinkedInOAuth(),
            'twitter': TwitterOAuth()
        }
    
    def get_auth_url(self, platform: str, user_id: str, redirect_uri: str) -> str:
        """Get OAuth authorization URL for platform"""
        if platform not in self.platforms:
            raise ValueError(f"Platform {platform} not supported")
        
        return self.platforms[platform].get_auth_url(user_id, redirect_uri)
    
    def exchange_code(self, platform: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        if platform not in self.platforms:
            raise ValueError(f"Platform {platform} not supported")
        
        return self.platforms[platform].exchange_code(code, redirect_uri)
    
    def refresh_token(self, platform: str, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        if platform not in self.platforms:
            raise ValueError(f"Platform {platform} not supported")
        
        return self.platforms[platform].refresh_token(refresh_token)
    
    def publish_content(self, platform: str, access_token: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to platform"""
        if platform not in self.platforms:
            raise ValueError(f"Platform {platform} not supported")
        
        return self.platforms[platform].publish_content(access_token, content_data)


class FacebookOAuth:
    """Facebook OAuth implementation"""
    
    def __init__(self):
        self.client_id = os.getenv('FACEBOOK_CLIENT_ID')
        self.client_secret = os.getenv('FACEBOOK_CLIENT_SECRET')
        self.base_url = 'https://www.facebook.com/v18.0/dialog/oauth'
        self.token_url = 'https://graph.facebook.com/v18.0/oauth/access_token'
        self.api_url = 'https://graph.facebook.com/v18.0'
    
    def get_auth_url(self, user_id: str, redirect_uri: str) -> str:
        """Generate Facebook OAuth URL"""
        state = secrets.token_urlsafe(32)
        # Store state for verification (in production, use Redis or database)
        
        params = {
            'client_id': self.client_id,
            'redirect_uri': redirect_uri,
            'scope': 'pages_manage_posts,pages_read_engagement,publish_to_groups',
            'response_type': 'code',
            'state': state
        }
        
        return f"{self.base_url}?{urllib.parse.urlencode(params)}"
    
    def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange code for access token"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'redirect_uri': redirect_uri,
            'code': code
        }
        
        response = requests.post(self.token_url, data=data)
        if response.status_code != 200:
            raise Exception(f"Facebook token exchange failed: {response.text}")
        
        token_data = response.json()
        
        # Get user info
        user_response = requests.get(
            f"{self.api_url}/me",
            params={'access_token': token_data['access_token'], 'fields': 'id,name,picture'}
        )
        
        if user_response.status_code == 200:
            user_info = user_response.json()
            token_data.update({
                'account_id': user_info['id'],
                'account_name': user_info['name'],
                'profile_picture': user_info.get('picture', {}).get('data', {}).get('url')
            })
        
        return token_data
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Facebook uses long-lived tokens, implement token extension"""
        data = {
            'grant_type': 'fb_exchange_token',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'fb_exchange_token': refresh_token
        }
        
        response = requests.post(self.token_url, data=data)
        if response.status_code != 200:
            raise Exception(f"Facebook token refresh failed: {response.text}")
        
        return response.json()
    
    def publish_content(self, access_token: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to Facebook"""
        # For Facebook pages, you need page access token
        # This is a simplified implementation
        endpoint = f"{self.api_url}/me/feed"
        
        post_data = {
            'message': content_data.get('text', ''),
            'access_token': access_token
        }
        
        # Add image if provided
        if content_data.get('image_url'):
            post_data['link'] = content_data['image_url']
        
        response = requests.post(endpoint, data=post_data)
        
        if response.status_code != 200:
            raise Exception(f"Facebook post failed: {response.text}")
        
        return response.json()


class InstagramOAuth:
    """Instagram OAuth implementation (requires Facebook Business account)"""
    
    def __init__(self):
        self.client_id = os.getenv('FACEBOOK_CLIENT_ID')  # Instagram uses Facebook OAuth
        self.client_secret = os.getenv('FACEBOOK_CLIENT_SECRET')
        self.base_url = 'https://www.facebook.com/v18.0/dialog/oauth'
        self.token_url = 'https://graph.facebook.com/v18.0/oauth/access_token'
        self.api_url = 'https://graph.facebook.com/v18.0'
    
    def get_auth_url(self, user_id: str, redirect_uri: str) -> str:
        """Generate Instagram OAuth URL"""
        state = secrets.token_urlsafe(32)
        
        params = {
            'client_id': self.client_id,
            'redirect_uri': redirect_uri,
            'scope': 'instagram_basic,instagram_content_publish',
            'response_type': 'code',
            'state': state
        }
        
        return f"{self.base_url}?{urllib.parse.urlencode(params)}"
    
    def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange code for access token"""
        # Similar to Facebook implementation
        return FacebookOAuth().exchange_code(code, redirect_uri)
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh Instagram token"""
        return FacebookOAuth().refresh_token(refresh_token)
    
    def publish_content(self, access_token: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to Instagram"""
        # Instagram requires media container creation first
        # This is a simplified implementation
        
        # Step 1: Create media container
        container_data = {
            'image_url': content_data.get('image_url'),
            'caption': content_data.get('text', ''),
            'access_token': access_token
        }
        
        # This would need the Instagram Business Account ID
        # endpoint = f"{self.api_url}/{instagram_account_id}/media"
        # For now, return a mock response
        return {'id': 'mock_instagram_post_id', 'status': 'published'}


class LinkedInOAuth:
    """LinkedIn OAuth implementation"""
    
    def __init__(self):
        self.client_id = os.getenv('LINKEDIN_CLIENT_ID')
        self.client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')
        self.base_url = 'https://www.linkedin.com/oauth/v2/authorization'
        self.token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
        self.api_url = 'https://api.linkedin.com/v2'
    
    def get_auth_url(self, user_id: str, redirect_uri: str) -> str:
        """Generate LinkedIn OAuth URL"""
        state = secrets.token_urlsafe(32)
        
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': redirect_uri,
            'state': state,
            'scope': 'r_liteprofile r_emailaddress w_member_social'
        }
        
        return f"{self.base_url}?{urllib.parse.urlencode(params)}"
    
    def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange code for access token"""
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(self.token_url, data=data)
        if response.status_code != 200:
            raise Exception(f"LinkedIn token exchange failed: {response.text}")
        
        token_data = response.json()
        
        # Get user profile
        headers = {'Authorization': f"Bearer {token_data['access_token']}"}
        profile_response = requests.get(f"{self.api_url}/people/~", headers=headers)
        
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            token_data.update({
                'account_id': profile_data.get('id'),
                'account_name': f"{profile_data.get('firstName', {}).get('localized', {}).get('en_US', '')} {profile_data.get('lastName', {}).get('localized', {}).get('en_US', '')}"
            })
        
        return token_data
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """LinkedIn doesn't provide refresh tokens in v2 API"""
        raise NotImplementedError("LinkedIn OAuth2 v2 does not support refresh tokens")
    
    def publish_content(self, access_token: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to LinkedIn"""
        headers = {
            'Authorization': f"Bearer {access_token}",
            'Content-Type': 'application/json'
        }
        
        post_data = {
            'author': f"urn:li:person:{content_data.get('person_id')}",
            'lifecycleState': 'PUBLISHED',
            'specificContent': {
                'com.linkedin.ugc.ShareContent': {
                    'shareCommentary': {
                        'text': content_data.get('text', '')
                    },
                    'shareMediaCategory': 'NONE'
                }
            },
            'visibility': {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        }
        
        response = requests.post(f"{self.api_url}/ugcPosts", headers=headers, json=post_data)
        
        if response.status_code not in [200, 201]:
            raise Exception(f"LinkedIn post failed: {response.text}")
        
        return response.json()


class TwitterOAuth:
    """Twitter OAuth implementation (placeholder for OAuth 2.0)"""
    
    def __init__(self):
        self.client_id = os.getenv('TWITTER_CLIENT_ID')
        self.client_secret = os.getenv('TWITTER_CLIENT_SECRET')
        # Twitter OAuth 2.0 implementation would go here
    
    def get_auth_url(self, user_id: str, redirect_uri: str) -> str:
        """Generate Twitter OAuth URL"""
        # Placeholder implementation
        return "https://twitter.com/oauth/authorize"
    
    def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange code for access token"""
        # Placeholder implementation
        return {'access_token': 'mock_twitter_token', 'account_id': 'mock_twitter_id'}
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh Twitter token"""
        # Placeholder implementation
        return {'access_token': 'refreshed_twitter_token'}
    
    def publish_content(self, access_token: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to Twitter"""
        # Placeholder implementation
        return {'id': 'mock_twitter_post_id', 'status': 'published'}
