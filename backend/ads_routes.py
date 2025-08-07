"""
Ads Management API Routes
Handles sponsorship timeline, campaigns, and incoming requests
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import sys
import os

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(__file__))

from mongo_db import mongo

ads_routes = Blueprint('ads_routes', __name__)

@ads_routes.route('/api/ads/timeline', methods=['GET'])
def get_ads_timeline():
    """Get ads timeline data for a specific week or client."""
    try:
        client_id = request.args.get('client_id')
        week_start = request.args.get('week_start')  # YYYY-MM-DD format
        
        collection = mongo.get_collection('ads_timeline')
        
        query = {}
        if client_id and client_id != 'all':
            query['client_id'] = client_id
        if week_start:
            query['week_start'] = week_start
        
        timeline_data = list(collection.find(query))
        
        return jsonify([
            {
                'id': str(item['_id']),
                'week_start': item.get('week_start'),
                'week_range': item.get('week_range'),
                'client_id': item.get('client_id'),
                'days': item.get('days', []),
                'created_at': item.get('created_at', datetime.utcnow()).isoformat() if item.get('created_at') else None,
                'updated_at': item.get('updated_at', datetime.utcnow()).isoformat() if item.get('updated_at') else None
            }
            for item in timeline_data
        ])
        
    except Exception as e:
        print(f"Get ads timeline error: {e}")
        return jsonify({'error': 'Failed to fetch ads timeline'}), 500

@ads_routes.route('/api/ads/timeline', methods=['POST'])
def save_ads_timeline():
    """Save or update ads timeline data."""
    try:
        data = request.get_json() or {}
        
        collection = mongo.get_collection('ads_timeline')
        
        timeline_doc = {
            'week_start': data.get('week_start'),
            'week_range': data.get('week_range'),
            'client_id': data.get('client_id'),
            'days': data.get('days', []),
            'updated_at': datetime.utcnow()
        }
        
        # Check if timeline already exists for this week/client
        existing = collection.find_one({
            'week_start': data.get('week_start'),
            'client_id': data.get('client_id')
        })
        
        if existing:
            # Update existing timeline
            collection.update_one(
                {'_id': existing['_id']},
                {'$set': timeline_doc}
            )
            timeline_doc['_id'] = existing['_id']
        else:
            # Create new timeline
            timeline_doc['created_at'] = datetime.utcnow()
            result = collection.insert_one(timeline_doc)
            timeline_doc['_id'] = result.inserted_id
        
        return jsonify({
            'id': str(timeline_doc['_id']),
            'week_start': timeline_doc['week_start'],
            'week_range': timeline_doc['week_range'],
            'client_id': timeline_doc['client_id'],
            'days': timeline_doc['days'],
            'created_at': timeline_doc.get('created_at', datetime.utcnow()).isoformat() if timeline_doc.get('created_at') else None,
            'updated_at': timeline_doc['updated_at'].isoformat()
        }), 201
        
    except Exception as e:
        print(f"Save ads timeline error: {e}")
        return jsonify({'error': 'Failed to save ads timeline'}), 500

@ads_routes.route('/api/ads/incoming-requests', methods=['GET'])
def get_incoming_requests():
    """Get incoming sponsorship requests."""
    try:
        print("[ADS DEBUG] Getting incoming requests...")
        client_id = request.args.get('client_id')
        print(f"[ADS DEBUG] Client ID: {client_id}")
        
        collection = mongo.get_collection('ads_incoming_requests')
        print(f"[ADS DEBUG] Collection: {collection}")
        
        query = {}
        if client_id and client_id != 'all':
            query['client_id'] = client_id
        
        print(f"[ADS DEBUG] Query: {query}")
        requests = list(collection.find(query).sort('created_at', -1))
        print(f"[ADS DEBUG] Found {len(requests)} requests")
        
        result = []
        for req in requests:
            result.append({
                'id': str(req['_id']),
                'brand': req.get('brand', ''),
                'campaign': req.get('campaign', ''),
                'budget': req.get('budget', ''),
                'urgency': req.get('urgency', 'medium'),
                'client_id': req.get('client_id'),
                'description': req.get('description', ''),
                'contact_email': req.get('contact_email', ''),
                'deadline': req.get('deadline'),
                'status': req.get('status', 'pending'),
                'created_at': req.get('created_at', datetime.utcnow()).isoformat() if req.get('created_at') else None
            })
        
        print(f"[ADS DEBUG] Returning {len(result)} formatted requests")
        return jsonify(result)
        
    except Exception as e:
        print(f"Get incoming requests error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch incoming requests'}), 500

@ads_routes.route('/api/ads/incoming-requests', methods=['POST'])
def add_incoming_request():
    """Add a new incoming sponsorship request."""
    try:
        data = request.get_json() or {}
        
        if not data.get('brand') or not data.get('campaign'):
            return jsonify({'error': 'Brand and campaign are required'}), 400
        
        collection = mongo.get_collection('ads_incoming_requests')
        
        request_doc = {
            'brand': data.get('brand'),
            'campaign': data.get('campaign'),
            'budget': data.get('budget', ''),
            'urgency': data.get('urgency', 'medium'),
            'client_id': data.get('client_id'),
            'description': data.get('description', ''),
            'contact_email': data.get('contact_email', ''),
            'deadline': data.get('deadline'),
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = collection.insert_one(request_doc)
        request_doc['_id'] = result.inserted_id
        
        return jsonify({
            'id': str(request_doc['_id']),
            'brand': request_doc['brand'],
            'campaign': request_doc['campaign'],
            'budget': request_doc['budget'],
            'urgency': request_doc['urgency'],
            'client_id': request_doc['client_id'],
            'description': request_doc['description'],
            'contact_email': request_doc['contact_email'],
            'deadline': request_doc['deadline'],
            'status': request_doc['status'],
            'created_at': request_doc['created_at'].isoformat()
        }), 201
        
    except Exception as e:
        print(f"Add incoming request error: {e}")
        return jsonify({'error': 'Failed to add incoming request'}), 500

@ads_routes.route('/api/ads/incoming-requests/<string:request_id>', methods=['DELETE'])
def delete_incoming_request(request_id):
    """Delete an incoming request (when moved to timeline)."""
    try:
        collection = mongo.get_collection('ads_incoming_requests')
        from bson import ObjectId
        
        result = collection.delete_one({'_id': ObjectId(request_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Request not found'}), 404
        
        return jsonify({'message': 'Request deleted successfully'})
        
    except Exception as e:
        print(f"Delete incoming request error: {e}")
        return jsonify({'error': 'Failed to delete request'}), 500

@ads_routes.route('/api/ads/sponsorship-history', methods=['GET'])
def get_sponsorship_history():
    """Get sponsorship history for analysis."""
    try:
        client_id = request.args.get('client_id')
        
        collection = mongo.get_collection('ads_sponsorship_history')
        
        query = {}
        if client_id and client_id != 'all':
            query['client_id'] = client_id
        
        history = list(collection.find(query).sort('created_at', -1))
        
        return jsonify([
            {
                'id': str(item['_id']),
                'campaign': item.get('campaign', ''),
                'brand': item.get('brand', ''),
                'client_id': item.get('client_id'),
                'totalSponsorships': item.get('total_sponsorships', 0),
                'engagement': item.get('engagement', 'medium'),
                'recentRuns': item.get('recent_runs', []),
                'performance': item.get('performance', []),
                'aiTip': item.get('ai_tip', ''),
                'revenue': item.get('revenue', 0),
                'roi': item.get('roi', 0),
                'created_at': item.get('created_at', datetime.utcnow()).isoformat() if item.get('created_at') else None
            }
            for item in history
        ])
        
    except Exception as e:
        print(f"Get sponsorship history error: {e}")
        return jsonify({'error': 'Failed to fetch sponsorship history'}), 500

@ads_routes.route('/api/ads/sponsorship-history', methods=['POST'])
def add_sponsorship_history():
    """Add sponsorship campaign to history."""
    try:
        data = request.get_json() or {}
        
        if not data.get('campaign') or not data.get('brand'):
            return jsonify({'error': 'Campaign and brand are required'}), 400
        
        collection = mongo.get_collection('ads_sponsorship_history')
        
        history_doc = {
            'campaign': data.get('campaign'),
            'brand': data.get('brand'),
            'client_id': data.get('client_id'),
            'total_sponsorships': data.get('total_sponsorships', 1),
            'engagement': data.get('engagement', 'medium'),
            'recent_runs': data.get('recent_runs', []),
            'performance': data.get('performance', []),
            'ai_tip': data.get('ai_tip', ''),
            'revenue': data.get('revenue', 0),
            'roi': data.get('roi', 0),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = collection.insert_one(history_doc)
        history_doc['_id'] = result.inserted_id
        
        return jsonify({
            'id': str(history_doc['_id']),
            'campaign': history_doc['campaign'],
            'brand': history_doc['brand'],
            'client_id': history_doc['client_id'],
            'totalSponsorships': history_doc['total_sponsorships'],
            'engagement': history_doc['engagement'],
            'recentRuns': history_doc['recent_runs'],
            'performance': history_doc['performance'],
            'aiTip': history_doc['ai_tip'],
            'revenue': history_doc['revenue'],
            'roi': history_doc['roi'],
            'created_at': history_doc['created_at'].isoformat()
        }), 201
        
    except Exception as e:
        print(f"Add sponsorship history error: {e}")
        return jsonify({'error': 'Failed to add sponsorship history'}), 500

@ads_routes.route('/api/ads/analytics', methods=['GET'])
def get_ads_analytics():
    """Get analytics overview for ads performance."""
    try:
        client_id = request.args.get('client_id')
        date_range = request.args.get('date_range', '30')  # days
        
        timeline_collection = mongo.get_collection('ads_timeline')
        history_collection = mongo.get_collection('ads_sponsorship_history')
        requests_collection = mongo.get_collection('ads_incoming_requests')
        
        query = {}
        if client_id and client_id != 'all':
            query['client_id'] = client_id
        
        # Get counts
        pending_requests = requests_collection.count_documents(query)
        total_campaigns = history_collection.count_documents(query)
        active_timelines = timeline_collection.count_documents(query)
        
        # Get performance data
        history_items = list(history_collection.find(query))
        total_sponsorships = sum(item.get('total_sponsorships', 0) for item in history_items)
        total_revenue = sum(item.get('revenue', 0) for item in history_items)
        avg_engagement = 'medium'  # Calculate based on actual data
        
        # Calculate engagement distribution
        engagement_counts = {'high': 0, 'medium': 0, 'low': 0}
        for item in history_items:
            engagement = item.get('engagement', 'medium')
            engagement_counts[engagement] += 1
        
        return jsonify({
            'overview': {
                'pending_requests': pending_requests,
                'total_campaigns': total_campaigns,
                'active_timelines': active_timelines,
                'total_sponsorships': total_sponsorships,
                'total_revenue': total_revenue,
                'avg_engagement': avg_engagement
            },
            'engagement_distribution': engagement_counts,
            'recent_performance': [item.get('performance', []) for item in history_items[-5:]],
            'top_brands': list(set(item.get('brand') for item in history_items if item.get('brand')))[-10:]
        })
        
    except Exception as e:
        print(f"Get ads analytics error: {e}")
        return jsonify({'error': 'Failed to fetch ads analytics'}), 500
