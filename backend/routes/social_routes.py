from flask import Blueprint, request, jsonify, redirect, url_for
from backend.models.social_media import SocialMediaAccount, PublishingQueue
from backend.services.oauth_service import OAuthService
from backend.services.publishing_service import PublishingService
from backend.config.mongodb import get_db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

social_bp = Blueprint('social', __name__)

@social_bp.route('/auth/<platform>', methods=['GET'])
def oauth_init(platform):
    """Initialize OAuth flow for a platform"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Build redirect URI
        redirect_uri = request.url_root.rstrip('/') + f'/api/social/callback/{platform}'
        
        oauth_service = OAuthService()
        auth_url = oauth_service.get_auth_url(platform, user_id, redirect_uri)
        
        return redirect(auth_url)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"OAuth init error: {str(e)}")
        return jsonify({'error': 'OAuth initialization failed'}), 500


@social_bp.route('/callback/<platform>', methods=['GET'])
def oauth_callback(platform):
    """Handle OAuth callback"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        user_id = request.args.get('state')  # Using state to pass user_id (simplified)
        
        if error:
            return jsonify({'error': f'OAuth error: {error}'}), 400
        
        if not code:
            return jsonify({'error': 'Authorization code not received'}), 400
        
        # Build redirect URI
        redirect_uri = request.url_root.rstrip('/') + f'/api/social/callback/{platform}'
        
        # Exchange code for tokens
        oauth_service = OAuthService()
        token_data = oauth_service.exchange_code(platform, code, redirect_uri)
        
        # Store account in database
        db = get_db()
        social_accounts = SocialMediaAccount(db)
        
        # Prepare account data
        account_data = {
            'access_token': token_data['access_token'],
            'refresh_token': token_data.get('refresh_token'),
            'expires_at': token_data.get('expires_at'),
            'account_id': token_data.get('account_id'),
            'account_name': token_data.get('account_name'),
            'account_username': token_data.get('account_username'),
            'profile_picture': token_data.get('profile_picture')
        }
        
        account_id = social_accounts.create_account(user_id, platform, account_data)
        
        # Redirect to frontend with success message
        frontend_url = request.url_root.replace(':10000', ':3001').rstrip('/')
        return redirect(f"{frontend_url}/content-calendar?connected={platform}&success=1")
        
    except Exception as e:
        logger.error(f"OAuth callback error: {str(e)}")
        frontend_url = request.url_root.replace(':10000', ':3001').rstrip('/')
        return redirect(f"{frontend_url}/content-calendar?error=oauth_failed")


@social_bp.route('/accounts/<user_id>', methods=['GET'])
def get_user_accounts(user_id):
    """Get all connected social media accounts for a user"""
    try:
        db = get_db()
        social_accounts = SocialMediaAccount(db)
        accounts = social_accounts.get_user_accounts(user_id)
        
        # Remove sensitive data
        for account in accounts:
            account.pop('access_token', None)
            account.pop('refresh_token', None)
        
        return jsonify(accounts), 200
        
    except Exception as e:
        logger.error(f"Error getting user accounts: {str(e)}")
        return jsonify({'error': 'Failed to retrieve accounts'}), 500


@social_bp.route('/accounts/<account_id>', methods=['DELETE'])
def disconnect_account(account_id):
    """Disconnect a social media account"""
    try:
        db = get_db()
        social_accounts = SocialMediaAccount(db)
        
        success = social_accounts.deactivate_account(account_id)
        
        if success:
            return jsonify({'message': 'Account disconnected successfully'}), 200
        else:
            return jsonify({'error': 'Account not found'}), 404
            
    except Exception as e:
        logger.error(f"Error disconnecting account: {str(e)}")
        return jsonify({'error': 'Failed to disconnect account'}), 500


@social_bp.route('/schedule', methods=['POST'])
def schedule_content():
    """Schedule content for publishing"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['content_id', 'platforms', 'scheduled_time', 'user_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse scheduled time
        try:
            scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid scheduled_time format'}), 400
        
        # Schedule content
        publishing_service = PublishingService()
        results = publishing_service.schedule_content(
            content_id=data['content_id'],
            platforms=data['platforms'],
            scheduled_time=scheduled_time,
            user_id=data['user_id']
        )
        
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f"Error scheduling content: {str(e)}")
        return jsonify({'error': 'Failed to schedule content'}), 500


@social_bp.route('/publish/process', methods=['POST'])
def process_publishing_queue():
    """Manually trigger publishing queue processing"""
    try:
        publishing_service = PublishingService()
        results = publishing_service.process_publishing_queue()
        
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f"Error processing publishing queue: {str(e)}")
        return jsonify({'error': 'Failed to process publishing queue'}), 500


@social_bp.route('/content/<content_id>/status', methods=['GET'])
def get_content_status(content_id):
    """Get publishing status for content"""
    try:
        publishing_service = PublishingService()
        status = publishing_service.get_content_publishing_status(content_id)
        
        return jsonify(status), 200
        
    except Exception as e:
        logger.error(f"Error getting content status: {str(e)}")
        return jsonify({'error': 'Failed to get content status'}), 500


@social_bp.route('/platforms', methods=['GET'])
def get_supported_platforms():
    """Get list of supported social media platforms"""
    platforms = [
        {
            'id': 'facebook',
            'name': 'Facebook',
            'icon': '👥',
            'color': '#1877F2',
            'description': 'Share posts, photos, and updates'
        },
        {
            'id': 'instagram', 
            'name': 'Instagram',
            'icon': '📷',
            'color': '#E4405F',
            'description': 'Share photos and stories'
        },
        {
            'id': 'linkedin',
            'name': 'LinkedIn',
            'icon': '💼',
            'color': '#0A66C2',
            'description': 'Professional networking and content'
        },
        {
            'id': 'twitter',
            'name': 'Twitter',
            'icon': '🐦',
            'color': '#1DA1F2',
            'description': 'Short messages and updates'
        }
    ]
    
    return jsonify(platforms), 200
