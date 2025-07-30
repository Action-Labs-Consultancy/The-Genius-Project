"""
Feature Request System Routes
Handles feature request submission and admin management
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
from bson import ObjectId

# Import models
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))

try:
    from feature_request import FeatureRequest, Notification
except ImportError:
    print("[FEATURE REQUEST ROUTES] Warning: Could not import FeatureRequest or Notification model")
    FeatureRequest = None
    Notification = None

try:
    from mongo_db import mongo
except ImportError:
    print("[FEATURE REQUEST ROUTES] Warning: Could not import mongo from mongo_db")
    mongo = None

# Simple session-based authentication decorators
def require_auth(f):
    """Authentication required decorator using session"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is in session
        user = session.get('user')
        if not user:
            return jsonify({'error': 'Authentication required', 'success': False}), 401
        
        # Add user to request for use in route
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

def require_admin(f):
    """Admin access required decorator using session"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get('user')
        if not user:
            return jsonify({'error': 'Authentication required', 'success': False}), 401
        
        # Check if user is admin
        is_admin = user.get('is_admin') or user.get('role') == 'admin'
        if not is_admin:
            return jsonify({'error': 'Admin access required', 'success': False}), 403
        
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

feature_request_routes = Blueprint('feature_request_routes', __name__)

# Configure upload settings for attachments
UPLOAD_FOLDER = 'uploads/feature_requests'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'zip'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_success_response(data, message="Success"):
    return jsonify({
        'success': True,
        'data': data,
        'message': message
    })

def create_error_response(message, status_code=400):
    return jsonify({
        'success': False,
        'error': message
    }), status_code

# ===== FEATURE REQUEST SUBMISSION =====

@feature_request_routes.route('/api/feature-requests', methods=['POST'])
@require_auth
def submit_feature_request():
    """Submit a new feature request"""
    try:
        if not FeatureRequest:
            return create_error_response('FeatureRequest model not available', 500)
        
        user_id = session.get('user_id')
        if not user_id:
            return create_error_response('User not authenticated', 401)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'reason', 'type', 'priority']
        for field in required_fields:
            if not data.get(field):
                return create_error_response(f'{field} is required')
        
        # Validate type and priority
        valid_types = ['Feature', 'Bug Fix', 'Content Update', 'Integration', 'Other']
        valid_priorities = ['Low', 'Medium', 'High']
        
        if data['type'] not in valid_types:
            return create_error_response('Invalid request type')
        
        if data['priority'] not in valid_priorities:
            return create_error_response('Invalid priority level')
        
        # Create the feature request
        feature_request = FeatureRequest.create(
            user_id=user_id,
            title=data['title'],
            description=data['description'],
            reason=data['reason'],
            request_type=data['type'],
            priority=data['priority'],
            attachments=data.get('attachments', [])
        )
        
        # Create notification for user
        if Notification:
            Notification.create(
                user_id=user_id,
                title="Request Submitted",
                message=f"Your feature request '{data['title']}' has been submitted successfully.",
                notification_type="success",
                action_url=f"/ice-box/{feature_request['_id']}"
            )
            
            # Notify admins
            admin_users = list(mongo.db.users.find({'role': 'admin'}))
            for admin in admin_users:
                Notification.create(
                    user_id=str(admin['_id']),
                    title="New Feature Request",
                    message=f"New {data['type'].lower()} request: {data['title']}",
                    notification_type="info",
                    action_url=f"/admin/ice-box/{feature_request['_id']}"
                )
        
        return create_success_response(feature_request, "Feature request submitted successfully")
        
    except Exception as e:
        print(f"Error submitting feature request: {e}")
        return create_error_response(str(e), 500)

@feature_request_routes.route('/api/feature-requests/upload', methods=['POST'])
@require_auth
def upload_attachment():
    """Upload an attachment for a feature request"""
    try:
        if 'file' not in request.files:
            return create_error_response('No file provided')
        
        file = request.files['file']
        if file.filename == '':
            return create_error_response('No file selected')
        
        if not allowed_file(file.filename):
            return create_error_response('File type not allowed')
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        if file_size > MAX_FILE_SIZE:
            os.remove(file_path)
            return create_error_response('File too large (max 10MB)')
        
        attachment_data = {
            'id': str(uuid.uuid4()),
            'original_filename': filename,
            'stored_filename': unique_filename,
            'file_path': file_path,
            'file_size': file_size,
            'upload_date': datetime.now().isoformat()
        }
        
        return create_success_response(attachment_data, "File uploaded successfully")
        
    except Exception as e:
        print(f"Error uploading attachment: {e}")
        return create_error_response(str(e), 500)

# ===== ICE BOX PAGE =====

@feature_request_routes.route('/api/feature-requests', methods=['GET'])
def get_feature_requests():
    """Get all feature requests with filtering and sorting"""
    try:
        if not FeatureRequest:
            return create_error_response('FeatureRequest model not available', 500)
        
        # Get query parameters
        status_filter = request.args.get('status')
        type_filter = request.args.get('type')
        priority_filter = request.args.get('priority')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = int(request.args.get('sort_order', -1))
        limit = request.args.get('limit')
        
        # Build filters
        filters = {}
        if status_filter:
            filters['status'] = status_filter
        if type_filter:
            filters['type'] = type_filter
        if priority_filter:
            filters['priority'] = priority_filter
        
        # Get requests
        feature_requests = FeatureRequest.get_all(
            filters=filters,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=int(limit) if limit else None
        )
        
        return create_success_response(feature_requests, f"Found {len(feature_requests)} feature requests")
        
    except Exception as e:
        print(f"Error getting feature requests: {e}")
        return create_error_response(str(e), 500)

@feature_request_routes.route('/api/feature-requests/<request_id>', methods=['GET'])
def get_feature_request_details(request_id):
    """Get detailed information about a specific feature request"""
    try:
        if not FeatureRequest:
            return create_error_response('FeatureRequest model not available', 500)
        
        feature_request = FeatureRequest.get_by_id(request_id)
        
        if not feature_request:
            return create_error_response('Feature request not found', 404)
        
        return create_success_response(feature_request, "Feature request retrieved successfully")
        
    except Exception as e:
        print(f"Error getting feature request details: {e}")
        return create_error_response(str(e), 500)

# ===== VOTING SYSTEM =====

@feature_request_routes.route('/api/feature-requests/<request_id>/vote', methods=['POST'])
@require_auth
def toggle_vote(request_id):
    """Toggle vote for a feature request"""
    try:
        if not FeatureRequest:
            return create_error_response('FeatureRequest model not available', 500)
        
        user_id = session.get('user_id')
        if not user_id:
            return create_error_response('User not authenticated', 401)
        
        vote_added = FeatureRequest.add_vote(request_id, user_id)
        
        action = "added" if vote_added else "removed"
        message = f"Vote {action} successfully"
        
        return create_success_response({'vote_added': vote_added}, message)
        
    except Exception as e:
        print(f"Error toggling vote: {e}")
        return create_error_response(str(e), 500)

# ===== COMMENTS =====

@feature_request_routes.route('/api/feature-requests/<request_id>/comments', methods=['POST'])
@require_auth
def add_comment(request_id):
    """Add a comment to a feature request"""
    try:
        if not FeatureRequest:
            return create_error_response('FeatureRequest model not available', 500)
        
        user_id = session.get('user_id')
        if not user_id:
            return create_error_response('User not authenticated', 401)
        
        data = request.get_json()
        comment_text = data.get('comment', '').strip()
        
        if not comment_text:
            return create_error_response('Comment text is required')
        
        success = FeatureRequest.add_comment(request_id, user_id, comment_text)
        
        if success:
            return create_success_response({'comment_added': True}, "Comment added successfully")
        else:
            return create_error_response('Failed to add comment', 500)
        
    except Exception as e:
        print(f"Error adding comment: {e}")
        return create_error_response(str(e), 500)

# ===== ADMIN MANAGEMENT =====

@feature_request_routes.route('/api/admin/feature-requests/<request_id>/status', methods=['PUT'])
@require_admin
def update_request_status(request_id):
    """Update the status of a feature request (admin only)"""
    try:
        if not FeatureRequest:
            return create_error_response('FeatureRequest model not available', 500)
        
        admin_id = session.get('user_id')
        data = request.get_json()
        
        new_status = data.get('status')
        notes = data.get('notes')
        
        valid_statuses = ['Pending', 'Approved', 'In Progress', 'Done', 'Rejected']
        if new_status not in valid_statuses:
            return create_error_response('Invalid status')
        
        success = FeatureRequest.update_status(request_id, new_status, admin_id, notes)
        
        if success:
            # Notify the original requester
            if Notification:
                feature_request = FeatureRequest.get_by_id(request_id)
                if feature_request:
                    Notification.create(
                        user_id=feature_request['user_id'],
                        title="Request Status Updated",
                        message=f"Your request '{feature_request['title']}' status changed to {new_status}",
                        notification_type="info",
                        action_url=f"/ice-box/{request_id}"
                    )
            
            return create_success_response({'status_updated': True}, "Status updated successfully")
        else:
            return create_error_response('Failed to update status', 500)
        
    except Exception as e:
        print(f"Error updating request status: {e}")
        return create_error_response(str(e), 500)

@feature_request_routes.route('/api/admin/feature-requests/<request_id>', methods=['DELETE'])
@require_admin
def delete_feature_request(request_id):
    """Delete a feature request (admin only)"""
    try:
        if not FeatureRequest:
            return create_error_response('FeatureRequest model not available', 500)
        
        success = FeatureRequest.delete(request_id)
        
        if success:
            return create_success_response({'deleted': True}, "Feature request deleted successfully")
        else:
            return create_error_response('Failed to delete feature request', 500)
        
    except Exception as e:
        print(f"Error deleting feature request: {e}")
        return create_error_response(str(e), 500)

# ===== NOTIFICATIONS =====

@feature_request_routes.route('/api/notifications', methods=['GET'])
@require_auth
def get_notifications():
    """Get notifications for the current user"""
    try:
        if not Notification:
            return create_error_response('Notification model not available', 500)
        
        user_id = session.get('user_id')
        if not user_id:
            return create_error_response('User not authenticated', 401)
        
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        notifications = Notification.get_user_notifications(user_id, unread_only, limit)
        unread_count = Notification.get_unread_count(user_id)
        
        return create_success_response({
            'notifications': notifications,
            'unread_count': unread_count
        }, "Notifications retrieved successfully")
        
    except Exception as e:
        print(f"Error getting notifications: {e}")
        return create_error_response(str(e), 500)

@feature_request_routes.route('/api/notifications/<notification_id>/read', methods=['POST'])
@require_auth
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        if not Notification:
            return create_error_response('Notification model not available', 500)
        
        user_id = session.get('user_id')
        success = Notification.mark_as_read(notification_id, user_id)
        
        if success:
            return create_success_response({'marked_read': True}, "Notification marked as read")
        else:
            return create_error_response('Failed to mark notification as read', 500)
        
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return create_error_response(str(e), 500)

@feature_request_routes.route('/api/notifications/read-all', methods=['POST'])
@require_auth
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    try:
        if not Notification:
            return create_error_response('Notification model not available', 500)
        
        user_id = session.get('user_id')
        count = Notification.mark_all_as_read(user_id)
        
        return create_success_response({
            'marked_read_count': count
        }, f"Marked {count} notifications as read")
        
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return create_error_response(str(e), 500)

# ===== STATISTICS =====

@feature_request_routes.route('/api/admin/feature-requests/stats', methods=['GET'])
@require_admin
def get_feature_request_stats():
    """Get statistics about feature requests (admin only)"""
    try:
        if mongo is None or not mongo.is_connected():
            return create_error_response('Database not available', 500)
        
        # Get counts by status
        status_counts = {}
        statuses = ['Pending', 'Approved', 'In Progress', 'Done', 'Rejected']
        for status in statuses:
            count = mongo.db.feature_requests.count_documents({'status': status})
            status_counts[status] = count
        
        # Get counts by type
        type_counts = {}
        types = ['Feature', 'Bug Fix', 'Content Update', 'Integration', 'Other']
        for req_type in types:
            count = mongo.db.feature_requests.count_documents({'type': req_type})
            type_counts[req_type] = count
        
        # Get recent activity
        recent_requests = list(
            mongo.db.feature_requests.find({})
            .sort('created_at', -1)
            .limit(5)
        )
        
        for request in recent_requests:
            request['_id'] = str(request['_id'])
        
        stats = {
            'total_requests': sum(status_counts.values()),
            'status_breakdown': status_counts,
            'type_breakdown': type_counts,
            'recent_activity': recent_requests
        }
        
        return create_success_response(stats, "Statistics retrieved successfully")
        
    except Exception as e:
        print(f"Error getting feature request stats: {e}")
        return create_error_response(str(e), 500)
