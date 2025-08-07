import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from backend.models.social_media import SocialMediaAccount, PublishingQueue
from backend.services.oauth_service import OAuthService
from backend.config.mongodb import get_db

logger = logging.getLogger(__name__)

class PublishingService:
    """Service for automated content publishing"""
    
    def __init__(self):
        self.oauth_service = OAuthService()
        self.db = get_db()
        self.social_accounts = SocialMediaAccount(self.db)
        self.publishing_queue = PublishingQueue(self.db)
    
    def schedule_content(self, content_id: str, platforms: List[str], scheduled_time: datetime, user_id: str) -> Dict[str, Any]:
        """Schedule content for publishing"""
        results = {}
        
        for platform in platforms:
            try:
                # Check if user has connected account for platform
                account = self.social_accounts.get_account_by_platform(user_id, platform)
                if not account:
                    results[platform] = {
                        'success': False,
                        'error': f'No {platform} account connected'
                    }
                    continue
                
                # Add to publishing queue
                queue_id = self.publishing_queue.add_to_queue(
                    content_id=content_id,
                    platform=platform,
                    scheduled_time=scheduled_time,
                    user_id=user_id
                )
                
                results[platform] = {
                    'success': True,
                    'queue_id': queue_id,
                    'scheduled_time': scheduled_time.isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error scheduling content for {platform}: {str(e)}")
                results[platform] = {
                    'success': False,
                    'error': str(e)
                }
        
        return results
    
    def process_publishing_queue(self) -> Dict[str, Any]:
        """Process pending items in publishing queue"""
        current_time = datetime.utcnow()
        pending_items = self.publishing_queue.get_pending_items(current_time)
        
        results = {
            'processed': 0,
            'published': 0,
            'failed': 0,
            'skipped': 0,
            'details': []
        }
        
        for item in pending_items:
            results['processed'] += 1
            
            try:
                # Get content details
                content = self._get_content_details(item['content_id'])
                if not content:
                    self._mark_as_failed(item['_id'], "Content not found")
                    results['failed'] += 1
                    continue
                
                # Check if content is approved
                if content.get('status', '').lower() != 'approved':
                    self._mark_as_skipped(item['_id'], "Content not approved")
                    results['skipped'] += 1
                    continue
                
                # Get user's social media account
                account = self.social_accounts.get_account_by_platform(
                    item['user_id'], 
                    item['platform']
                )
                
                if not account:
                    self._mark_as_failed(item['_id'], f"No {item['platform']} account found")
                    results['failed'] += 1
                    continue
                
                # Check if token needs refresh
                if self._token_needs_refresh(account):
                    refreshed_account = self._refresh_account_token(account)
                    if not refreshed_account:
                        self._mark_as_failed(item['_id'], "Token refresh failed")
                        results['failed'] += 1
                        continue
                    account = refreshed_account
                
                # Publish content
                publish_result = self._publish_content(
                    platform=item['platform'],
                    access_token=account['access_token'],
                    content=content
                )
                
                if publish_result.get('success'):
                    self.publishing_queue.update_status(
                        item['_id'], 
                        'published', 
                        published_at=current_time
                    )
                    results['published'] += 1
                    results['details'].append({
                        'content_id': item['content_id'],
                        'platform': item['platform'],
                        'status': 'published',
                        'post_id': publish_result.get('post_id')
                    })
                else:
                    self._mark_as_failed(item['_id'], publish_result.get('error', 'Unknown error'))
                    results['failed'] += 1
                
            except Exception as e:
                logger.error(f"Error processing queue item {item['_id']}: {str(e)}")
                self._mark_as_failed(item['_id'], str(e))
                results['failed'] += 1
        
        return results
    
    def _get_content_details(self, content_id: str) -> Dict[str, Any]:
        """Get content details from database"""
        try:
            # Try to get from content calendar collection
            content = self.db.content_calendar.find_one({'_id': content_id})
            if content:
                content['_id'] = str(content['_id'])
                return content
            
            # Try other collections if needed
            return None
            
        except Exception as e:
            logger.error(f"Error getting content details: {str(e)}")
            return None
    
    def _token_needs_refresh(self, account: Dict[str, Any]) -> bool:
        """Check if access token needs refresh"""
        if not account.get('expires_at'):
            return False
        
        expires_at = account['expires_at']
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        
        # Refresh if expires within 1 hour
        return expires_at <= datetime.utcnow() + timedelta(hours=1)
    
    def _refresh_account_token(self, account: Dict[str, Any]) -> Dict[str, Any]:
        """Refresh account access token"""
        try:
            platform = account['platform']
            refresh_token = account.get('refresh_token')
            
            if not refresh_token:
                logger.error(f"No refresh token for {platform} account")
                return None
            
            # Refresh token
            new_tokens = self.oauth_service.refresh_token(platform, refresh_token)
            
            # Update in database
            self.social_accounts.update_tokens(
                account['_id'],
                new_tokens['access_token'],
                new_tokens.get('refresh_token'),
                new_tokens.get('expires_at')
            )
            
            # Return updated account
            account['access_token'] = new_tokens['access_token']
            if new_tokens.get('refresh_token'):
                account['refresh_token'] = new_tokens['refresh_token']
            if new_tokens.get('expires_at'):
                account['expires_at'] = new_tokens['expires_at']
            
            return account
            
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            return None
    
    def _publish_content(self, platform: str, access_token: str, content: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to platform"""
        try:
            # Prepare content data based on platform
            content_data = self._prepare_content_data(content)
            
            # Publish using OAuth service
            result = self.oauth_service.publish_content(platform, access_token, content_data)
            
            return {
                'success': True,
                'post_id': result.get('id'),
                'platform_response': result
            }
            
        except Exception as e:
            logger.error(f"Error publishing to {platform}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _prepare_content_data(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare content data for publishing"""
        return {
            'text': content.get('textCopy', '') or content.get('content', ''),
            'image_url': self._get_image_url(content),
            'title': content.get('title', ''),
            'description': content.get('artworkCopy', ''),
            'tags': content.get('tags', [])
        }
    
    def _get_image_url(self, content: Dict[str, Any]) -> str:
        """Extract image URL from content"""
        files = content.get('files', [])
        if files and len(files) > 0:
            first_file = files[0]
            if isinstance(first_file, dict):
                return first_file.get('url', '')
            return str(first_file)
        return ''
    
    def _mark_as_failed(self, queue_id: str, error_message: str):
        """Mark queue item as failed"""
        self.publishing_queue.update_status(queue_id, 'failed', error_message)
    
    def _mark_as_skipped(self, queue_id: str, reason: str):
        """Mark queue item as skipped"""
        self.publishing_queue.update_status(queue_id, 'skipped', reason)
    
    def get_content_publishing_status(self, content_id: str) -> Dict[str, Any]:
        """Get publishing status for content across all platforms"""
        return self.publishing_queue.get_content_status(content_id)
