"""
Simplified Feature Request System Routes
Handles feature request submission and admin management only
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

# ===== FEATURE REQUEST SUBMISSION =====

@feature_request_routes.route('/api/feature-requests', methods=['POST'])
def submit_feature_request():
    """Submit a new feature request - NO AUTH REQUIRED"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title') or not data.get('description'):
            return jsonify({
                'success': False,
                'error': 'Title and description are required'
            }), 400
        
        # Create feature request document with default user info if not provided
        user_id = data.get('user_id', 'anonymous_' + str(uuid.uuid4())[:8])
        user_name = data.get('user_name', 'Anonymous User')
        user_email = data.get('user_email', 'anonymous@example.com')
        
        # Create feature request document
        request_doc = {
            '_id': ObjectId(),
            'title': data['title'],
            'description': data['description'],
            'category': data.get('category', 'enhancement'),
            'priority': data.get('priority', 'medium'),
            'use_case': data.get('use_case', ''),
            'expected_outcome': data.get('expected_outcome', ''),
            'submitted_by': {
                'user_id': user_id,
                'username': user_name,
                'email': user_email
            },
            'status': 'pending',
            'attachments': [],
            'admin_comment': '',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Save to database
        if mongo is not None and mongo.db is not None:
            result = mongo.db.feature_requests.insert_one(request_doc)
            request_id = str(result.inserted_id)
            
            return jsonify({
                'success': True,
                'message': 'Feature request submitted successfully',
                'data': {
                    'id': request_id,
                    'title': data['title'],
                    'status': 'pending'
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Database not available'
            }), 500
            
    except Exception as e:
        print(f"[FEATURE REQUEST] Error submitting request: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@feature_request_routes.route('/api/feature-requests/upload', methods=['POST'])
@require_auth
def upload_attachment():
    """Upload an attachment for a feature request"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Return file info
        return jsonify({
            'success': True,
            'data': {
                'filename': filename,
                'url': f"/uploads/feature_requests/{unique_filename}",
                'size': os.path.getsize(file_path)
            }
        })
        
    except Exception as e:
        print(f"[FEATURE REQUEST] Error uploading file: {str(e)}")
        return jsonify({'success': False, 'error': 'File upload failed'}), 500

# ===== ADMIN ROUTES =====

@feature_request_routes.route('/api/admin/feature-requests', methods=['GET'])
def get_all_requests():
    """Get all feature requests for admin dashboard - NO AUTH REQUIRED"""
    try:
        # Get filter parameters
        status = request.args.get('status', '')
        category = request.args.get('category', '')
        priority = request.args.get('priority', '')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build MongoDB query
        query = {}
        if status:
            query['status'] = status
        if category:
            query['category'] = category
        if priority:
            query['priority'] = priority
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        # Build sort
        sort_direction = -1 if sort_order == 'desc' else 1
        sort_spec = [(sort_by, sort_direction)]
        
        # Get requests from database
        if mongo is not None and mongo.db is not None:
            cursor = mongo.db.feature_requests.find(query).sort(sort_spec)
            requests = []
            
            for doc in cursor:
                doc['id'] = str(doc['_id'])
                del doc['_id']
                # Convert datetime to string for JSON serialization
                if 'created_at' in doc:
                    doc['created_at'] = doc['created_at'].isoformat()
                if 'updated_at' in doc:
                    doc['updated_at'] = doc['updated_at'].isoformat()
                requests.append(doc)
            
            return jsonify({
                'success': True,
                'data': {
                    'requests': requests,
                    'total': len(requests)
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Database not available'
            }), 500
            
    except Exception as e:
        print(f"[FEATURE REQUEST] Error getting requests: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@feature_request_routes.route('/api/admin/feature-requests/<request_id>/status', methods=['PUT'])
def update_request_status(request_id):
    """Update the status of a feature request - NO AUTH REQUIRED"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        admin_comment = data.get('admin_comment', '')
        
        if not new_status:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
        
        # Valid statuses
        valid_statuses = ['pending', 'in_review', 'approved', 'in_progress', 'completed', 'rejected', 'on_hold']
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        # Get the old status for notification
        old_request = mongo.db.feature_requests.find_one({'_id': ObjectId(request_id)})
        old_status = old_request['status'] if old_request else 'unknown'
        
        # Update in database
        if mongo is not None and mongo.db is not None:
            update_doc = {
                '$set': {
                    'status': new_status,
                    'admin_comment': admin_comment,
                    'updated_at': datetime.utcnow()
                }
            }
            
            result = mongo.db.feature_requests.update_one(
                {'_id': ObjectId(request_id)},
                update_doc
            )
            
            if result.modified_count > 0:
                # Send notification about status change
                user_email = old_request['submitted_by']['email'] if old_request and 'submitted_by' in old_request else None
                request_title = old_request['title'] if old_request else 'Feature Request'
                send_status_notification(user_email, request_title, old_status, new_status)
                
                return jsonify({
                    'success': True,
                    'message': 'Status updated successfully'
                })
            else:
                return jsonify({'success': False, 'error': 'Request not found'}), 404
        else:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
            
    except Exception as e:
        print(f"[FEATURE REQUEST] Error updating status: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@feature_request_routes.route('/api/admin/feature-requests/<request_id>', methods=['DELETE'])
@require_admin
def delete_request(request_id):
    """Delete a feature request"""
    try:
        if mongo is not None and mongo.db is not None:
            result = mongo.db.feature_requests.delete_one({'_id': ObjectId(request_id)})
            
            if result.deleted_count > 0:
                return jsonify({
                    'success': True,
                    'message': 'Request deleted successfully'
                })
            else:
                return jsonify({'success': False, 'error': 'Request not found'}), 404
        else:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
            
    except Exception as e:
        print(f"[FEATURE REQUEST] Error deleting request: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@feature_request_routes.route('/api/admin/feature-requests/stats', methods=['GET'])
def get_admin_stats():
    """Get statistics for admin dashboard - NO AUTH REQUIRED"""
    try:
        if mongo is None or mongo.db is None:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Get all requests
        all_requests = list(mongo.db.feature_requests.find())
        
        # Calculate statistics
        total_requests = len(all_requests)
        by_status = {}
        by_category = {}
        by_priority = {}
        
        for req in all_requests:
            # Count by status
            status = req.get('status', 'pending')
            by_status[status] = by_status.get(status, 0) + 1
            
            # Count by category
            category = req.get('category', 'enhancement')
            by_category[category] = by_category.get(category, 0) + 1
            
            # Count by priority
            priority = req.get('priority', 'medium')
            by_priority[priority] = by_priority.get(priority, 0) + 1
        
        return jsonify({
            'success': True,
            'data': {
                'total_requests': total_requests,
                'by_status': by_status,
                'by_category': by_category,
                'by_priority': by_priority
            }
        })
        
    except Exception as e:
        print(f"[FEATURE REQUEST] Error getting stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

# ===== NOTIFICATION FUNCTIONS =====

def send_status_notification(user_email, request_title, old_status, new_status):
    """Send notification when request status changes"""
    try:
        if mongo is not None and mongo.db is not None:
            notification_doc = {
                'user_email': user_email,
                'title': f'Feature Request Status Update',
                'message': f'Your request "{request_title}" has been updated from {old_status} to {new_status}',
                'type': 'status_update',
                'read': False,
                'created_at': datetime.utcnow()
            }
            mongo.db.notifications.insert_one(notification_doc)
            print(f"[NOTIFICATION] Sent status update notification to {user_email}")
    except Exception as e:
        print(f"[NOTIFICATION] Error sending notification: {e}")

@feature_request_routes.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get notifications for current user - NO AUTH REQUIRED"""
    try:
        limit = int(request.args.get('limit', 10))
        
        if mongo is not None and mongo.db is not None:
            # Return empty notifications for now
            return jsonify({
                'success': True,
                'data': {
                    'notifications': [],
                    'unread_count': 0
                }
            })
        else:
            return jsonify({
                'success': True,
                'data': {
                    'notifications': [],
                    'unread_count': 0
                }
            })
            
    except Exception as e:
        print(f"[NOTIFICATIONS] Error getting notifications: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
