"""
Feature Request System Models
MongoDB models for managing feature requests, voting, and notifications
"""
from datetime import datetime
from bson import ObjectId
import uuid

try:
    from mongo_db import mongo
except ImportError:
    print("[FEATURE REQUEST MODELS] Warning: Could not import mongo from mongo_db")
    mongo = None

class FeatureRequest:
    """Model for managing feature requests"""
    
    @staticmethod
    def create(user_id, title, description, reason, request_type, priority, attachments=None):
        """Create a new feature request"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            request_data = {
                'user_id': user_id,
                'title': title.strip(),
                'description': description.strip(),
                'reason': reason.strip(),
                'type': request_type,
                'priority': priority,
                'status': 'Pending',
                'attachments': attachments or [],
                'votes': [],
                'vote_count': 0,
                'comments': [],
                'assigned_to': None,
                'internal_notes': [],
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            result = mongo.db.feature_requests.insert_one(request_data)
            request_data['_id'] = str(result.inserted_id)
            return request_data
            
        except Exception as e:
            raise Exception(f"Failed to create feature request: {str(e)}")
    
    @staticmethod
    def get_all(filters=None, sort_by='created_at', sort_order=-1, limit=None):
        """Get all feature requests with optional filtering and sorting"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            query = filters or {}
            
            cursor = mongo.db.feature_requests.find(query).sort(sort_by, sort_order)
            if limit:
                cursor = cursor.limit(limit)
            
            requests = list(cursor)
            for request in requests:
                request['_id'] = str(request['_id'])
                # Add user info
                if request.get('user_id'):
                    user = mongo.db.users.find_one({'_id': ObjectId(request['user_id'])})
                    if user:
                        request['user_info'] = {
                            'username': user.get('username', 'Unknown'),
                            'email': user.get('email', ''),
                            'profile_picture': user.get('profile_picture', '')
                        }
            
            return requests
            
        except Exception as e:
            raise Exception(f"Failed to get feature requests: {str(e)}")
    
    @staticmethod
    def get_by_id(request_id):
        """Get a specific feature request by ID"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            request = mongo.db.feature_requests.find_one({'_id': ObjectId(request_id)})
            if request:
                request['_id'] = str(request['_id'])
                # Add user info
                if request.get('user_id'):
                    user = mongo.db.users.find_one({'_id': ObjectId(request['user_id'])})
                    if user:
                        request['user_info'] = {
                            'username': user.get('username', 'Unknown'),
                            'email': user.get('email', ''),
                            'profile_picture': user.get('profile_picture', '')
                        }
            
            return request
            
        except Exception as e:
            raise Exception(f"Failed to get feature request: {str(e)}")
    
    @staticmethod
    def update_status(request_id, new_status, admin_id=None, notes=None):
        """Update the status of a feature request"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            update_data = {
                'status': new_status,
                'updated_at': datetime.now()
            }
            
            if admin_id:
                update_data['assigned_to'] = admin_id
            
            if notes:
                update_data['$push'] = {
                    'internal_notes': {
                        'id': str(uuid.uuid4()),
                        'admin_id': admin_id,
                        'note': notes,
                        'timestamp': datetime.now()
                    }
                }
                result = mongo.db.feature_requests.update_one(
                    {'_id': ObjectId(request_id)},
                    {'$set': update_data, '$push': update_data.pop('$push')}
                )
            else:
                result = mongo.db.feature_requests.update_one(
                    {'_id': ObjectId(request_id)},
                    {'$set': update_data}
                )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Failed to update feature request: {str(e)}")
    
    @staticmethod
    def add_vote(request_id, user_id):
        """Add or remove a vote for a feature request"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            # Check if user already voted
            request = mongo.db.feature_requests.find_one({'_id': ObjectId(request_id)})
            if not request:
                raise Exception("Feature request not found")
            
            votes = request.get('votes', [])
            
            if user_id in votes:
                # Remove vote
                mongo.db.feature_requests.update_one(
                    {'_id': ObjectId(request_id)},
                    {
                        '$pull': {'votes': user_id},
                        '$inc': {'vote_count': -1},
                        '$set': {'updated_at': datetime.now()}
                    }
                )
                return False  # Vote removed
            else:
                # Add vote
                mongo.db.feature_requests.update_one(
                    {'_id': ObjectId(request_id)},
                    {
                        '$push': {'votes': user_id},
                        '$inc': {'vote_count': 1},
                        '$set': {'updated_at': datetime.now()}
                    }
                )
                return True  # Vote added
                
        except Exception as e:
            raise Exception(f"Failed to toggle vote: {str(e)}")
    
    @staticmethod
    def add_comment(request_id, user_id, comment_text):
        """Add a comment to a feature request"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            comment = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'comment': comment_text.strip(),
                'timestamp': datetime.now()
            }
            
            result = mongo.db.feature_requests.update_one(
                {'_id': ObjectId(request_id)},
                {
                    '$push': {'comments': comment},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Failed to add comment: {str(e)}")
    
    @staticmethod
    def delete(request_id):
        """Delete a feature request"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            result = mongo.db.feature_requests.delete_one({'_id': ObjectId(request_id)})
            return result.deleted_count > 0
            
        except Exception as e:
            raise Exception(f"Failed to delete feature request: {str(e)}")

class Notification:
    """Model for managing in-app notifications"""
    
    @staticmethod
    def create(user_id, title, message, notification_type='info', action_url=None, metadata=None):
        """Create a new notification"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            notification_data = {
                'user_id': user_id,
                'title': title,
                'message': message,
                'type': notification_type,  # info, success, warning, error
                'action_url': action_url,
                'metadata': metadata or {},
                'read': False,
                'created_at': datetime.now()
            }
            
            result = mongo.db.notifications.insert_one(notification_data)
            notification_data['_id'] = str(result.inserted_id)
            return notification_data
            
        except Exception as e:
            raise Exception(f"Failed to create notification: {str(e)}")
    
    @staticmethod
    def get_user_notifications(user_id, unread_only=False, limit=50):
        """Get notifications for a specific user"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            query = {'user_id': user_id}
            if unread_only:
                query['read'] = False
            
            notifications = list(
                mongo.db.notifications.find(query)
                .sort('created_at', -1)
                .limit(limit)
            )
            
            for notification in notifications:
                notification['_id'] = str(notification['_id'])
            
            return notifications
            
        except Exception as e:
            raise Exception(f"Failed to get notifications: {str(e)}")
    
    @staticmethod
    def mark_as_read(notification_id, user_id=None):
        """Mark a notification as read"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            query = {'_id': ObjectId(notification_id)}
            if user_id:
                query['user_id'] = user_id
            
            result = mongo.db.notifications.update_one(
                query,
                {'$set': {'read': True}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Failed to mark notification as read: {str(e)}")
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            result = mongo.db.notifications.update_many(
                {'user_id': user_id, 'read': False},
                {'$set': {'read': True}}
            )
            
            return result.modified_count
            
        except Exception as e:
            raise Exception(f"Failed to mark all notifications as read: {str(e)}")
    
    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications for a user"""
        try:
            if mongo is None or not mongo.is_connected():
                raise Exception("Database not available")
            
            count = mongo.db.notifications.count_documents({
                'user_id': user_id,
                'read': False
            })
            
            return count
            
        except Exception as e:
            raise Exception(f"Failed to get unread count: {str(e)}")
