from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId

class SocialMediaAccount:
    """Model for storing social media account connections"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.social_accounts
    
    def create_account(self, user_id: str, platform: str, account_data: Dict[str, Any]) -> str:
        """Create a new social media account connection"""
        account = {
            'user_id': user_id,
            'platform': platform,
            'access_token': account_data.get('access_token'),
            'refresh_token': account_data.get('refresh_token'),
            'expires_at': account_data.get('expires_at'),
            'account_id': account_data.get('account_id'),
            'account_name': account_data.get('account_name'),
            'account_username': account_data.get('account_username'),
            'profile_picture': account_data.get('profile_picture'),
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.insert_one(account)
        return str(result.inserted_id)
    
    def get_user_accounts(self, user_id: str) -> list:
        """Get all social media accounts for a user"""
        accounts = list(self.collection.find({'user_id': user_id, 'is_active': True}))
        for account in accounts:
            account['_id'] = str(account['_id'])
        return accounts
    
    def get_account_by_platform(self, user_id: str, platform: str) -> Optional[Dict]:
        """Get account by user ID and platform"""
        account = self.collection.find_one({
            'user_id': user_id,
            'platform': platform,
            'is_active': True
        })
        if account:
            account['_id'] = str(account['_id'])
        return account
    
    def update_tokens(self, account_id: str, access_token: str, refresh_token: str = None, expires_at: datetime = None) -> bool:
        """Update access tokens for an account"""
        update_data = {
            'access_token': access_token,
            'updated_at': datetime.utcnow()
        }
        
        if refresh_token:
            update_data['refresh_token'] = refresh_token
        if expires_at:
            update_data['expires_at'] = expires_at
            
        result = self.collection.update_one(
            {'_id': ObjectId(account_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def deactivate_account(self, account_id: str) -> bool:
        """Deactivate a social media account"""
        result = self.collection.update_one(
            {'_id': ObjectId(account_id)},
            {'$set': {'is_active': False, 'updated_at': datetime.utcnow()}}
        )
        return result.modified_count > 0


class PublishingQueue:
    """Model for managing publishing queue"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.publishing_queue
    
    def add_to_queue(self, content_id: str, platform: str, scheduled_time: datetime, user_id: str) -> str:
        """Add content to publishing queue"""
        queue_item = {
            'content_id': content_id,
            'platform': platform,
            'scheduled_time': scheduled_time,
            'user_id': user_id,
            'status': 'queued',  # queued, published, failed, skipped
            'attempts': 0,
            'max_attempts': 3,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'published_at': None,
            'error_message': None
        }
        
        result = self.collection.insert_one(queue_item)
        return str(result.inserted_id)
    
    def get_pending_items(self, current_time: datetime) -> list:
        """Get items ready for publishing"""
        items = list(self.collection.find({
            'status': 'queued',
            'scheduled_time': {'$lte': current_time},
            'attempts': {'$lt': 3}
        }))
        
        for item in items:
            item['_id'] = str(item['_id'])
        return items
    
    def update_status(self, queue_id: str, status: str, error_message: str = None, published_at: datetime = None) -> bool:
        """Update queue item status"""
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow(),
            '$inc': {'attempts': 1}
        }
        
        if error_message:
            update_data['error_message'] = error_message
        if published_at:
            update_data['published_at'] = published_at
            
        result = self.collection.update_one(
            {'_id': ObjectId(queue_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_content_status(self, content_id: str) -> Dict:
        """Get publishing status for content"""
        statuses = list(self.collection.find({'content_id': content_id}))
        
        result = {}
        for status in statuses:
            result[status['platform']] = {
                'status': status['status'],
                'scheduled_time': status['scheduled_time'],
                'published_at': status.get('published_at'),
                'error_message': status.get('error_message'),
                'attempts': status.get('attempts', 0)
            }
        
        return result
