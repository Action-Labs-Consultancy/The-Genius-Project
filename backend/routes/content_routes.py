from flask import Blueprint, request, jsonify
from backend.models.content_post import ContentPost
from backend.config.mongodb import get_db
from bson import ObjectId
from datetime import datetime

content_bp = Blueprint('content', __name__)

@content_bp.route('/content/posts', methods=['GET'])
def get_posts():
    """Get all content posts"""
    try:
        db = get_db()
        posts = list(db.content_posts.find().sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for post in posts:
            post['_id'] = str(post['_id'])
            if 'created_at' in post:
                post['created_at'] = post['created_at'].isoformat() if isinstance(post['created_at'], datetime) else post['created_at']
        
        return jsonify(posts), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/content/posts', methods=['POST'])
def create_post():
    """Create a new content post"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'content', 'platform']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create post object
        post_data = {
            'title': data['title'],
            'content': data['content'],
            'platform': data['platform'],
            'status': data.get('status', 'pending'),
            'isSponsored': data.get('isSponsored', False),
            'preferredDays': data.get('preferredDays', []),
            'sponsorDetails': data.get('sponsorDetails', {}),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'postedDate': None,
            'selectedDay': None
        }
        
        db = get_db()
        result = db.content_posts.insert_one(post_data)
        post_data['_id'] = str(result.inserted_id)
        
        return jsonify(post_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/content/posts/<post_id>', methods=['PUT'])
def update_post(post_id):
    """Update a content post"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Update timestamp
        data['updated_at'] = datetime.utcnow()
        
        result = db.content_posts.update_one(
            {'_id': ObjectId(post_id)},
            {'$set': data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Post not found'}), 404
        
        # Return updated post
        post = db.content_posts.find_one({'_id': ObjectId(post_id)})
        post['_id'] = str(post['_id'])
        
        return jsonify(post), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/content/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete a content post"""
    try:
        db = get_db()
        result = db.content_posts.delete_one({'_id': ObjectId(post_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify({'message': 'Post deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/content/sponsored-posts', methods=['GET'])
def get_sponsored_posts():
    """Get all sponsored posts that are approved and ready for ads"""
    try:
        db = get_db()
        posts = list(db.content_posts.find({
            'isSponsored': True,
            'status': {'$in': ['approved', 'published', 'scheduled', 'active']}
        }).sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for post in posts:
            post['_id'] = str(post['_id'])
            if 'created_at' in post:
                post['created_at'] = post['created_at'].isoformat() if isinstance(post['created_at'], datetime) else post['created_at']
        
        return jsonify(posts), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/content/sponsored-posts/<post_id>/select-day', methods=['PUT'])
def select_promotion_day(post_id):
    """Select a specific day for sponsored promotion"""
    try:
        data = request.get_json()
        selected_day = data.get('selectedDay')
        
        if not selected_day:
            return jsonify({'error': 'Selected day is required'}), 400
        
        db = get_db()
        
        result = db.content_posts.update_one(
            {'_id': ObjectId(post_id)},
            {
                '$set': {
                    'selectedDay': selected_day,
                    'status': data.get('status', 'scheduled'),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify({'message': 'Day selected successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/content/sponsored-posts/<post_id>/action', methods=['PUT'])
def handle_sponsored_post_action(post_id):
    """Handle various actions on sponsored posts"""
    try:
        data = request.get_json()
        action = data.get('action')
        
        if not action:
            return jsonify({'error': 'Action is required'}), 400
        
        db = get_db()
        
        update_data = {
            'updated_at': datetime.utcnow()
        }
        
        if action == 'launch':
            update_data['status'] = 'active'
        elif action == 'pause':
            update_data['status'] = 'paused'
        elif action == 'archive':
            update_data['status'] = 'archived'
        elif action == 'edit':
            # Allow editing sponsor details
            sponsor_details = data.get('sponsorDetails', {})
            update_data['sponsorDetails'] = sponsor_details
        
        result = db.content_posts.update_one(
            {'_id': ObjectId(post_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify({'message': f'Action {action} completed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
