"""
Logs API: Fetch and filter system activities from task_events collection
"""
from flask import Blueprint, request, jsonify
from datetime import datetime

# Import mongo from the same place as app.py
try:
    from mongo_db import mongo
except ImportError:
    print("[LOGS API] Warning: Could not import mongo from mongo_db")
    mongo = None

logs_api = Blueprint('logs_api', __name__)

@logs_api.route('/api/logs', methods=['GET'])
def get_logs():
    """Fetch and filter logs from task_events collection"""
    try:
        if mongo is None or mongo.db is None:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
            
        query = {}
        
        # Parse filters from request
        user = request.args.get('user')
        role = request.args.get('role') 
        project = request.args.get('project')
        task = request.args.get('task')
        event_type = request.args.get('event_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Build MongoDB query
        if user:
            query['user'] = {'$regex': user, '$options': 'i'}
        if role:
            query['role'] = {'$regex': role, '$options': 'i'}
        if project:
            query['project'] = {'$regex': project, '$options': 'i'}
        if task:
            query['task'] = {'$regex': task, '$options': 'i'}
        if event_type:
            query['event_type'] = {'$regex': event_type, '$options': 'i'}
        
        # Date range filter
        if start_date or end_date:
            query['timestamp'] = {}
            if start_date:
                try:
                    query['timestamp']['$gte'] = datetime.fromisoformat(start_date)
                except:
                    pass
            if end_date:
                try:
                    end_dt = datetime.fromisoformat(end_date)
                    end_dt = end_dt.replace(hour=23, minute=59, second=59)
                    query['timestamp']['$lte'] = end_dt
                except:
                    pass

        print(f"Logs query: {query}")
        
        # Fetch logs from MongoDB
        logs = list(mongo.db.task_events.find(query).sort('timestamp', -1).limit(1000))
        
        # Format response
        for log in logs:
            log['_id'] = str(log['_id'])
            if 'timestamp' in log and hasattr(log['timestamp'], 'isoformat'):
                log['timestamp'] = log['timestamp'].isoformat()
        
        print(f"Found {len(logs)} logs")
        return jsonify({'success': True, 'data': logs})
        
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@logs_api.route('/api/logs/sample', methods=['POST'])
def create_sample_logs():
    """Create sample log entries for testing"""
    try:
        if mongo is None or mongo.db is None:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
            
        sample_logs = [
            {
                'user': 'John Doe',
                'role': 'Admin',
                'action': 'Created Task',
                'description': 'Created new task for project setup',
                'project': 'AI Dashboard',
                'task': 'Setup Database',
                'event_type': 'task_created',
                'timestamp': datetime.now()
            },
            {
                'user': 'Jane Smith', 
                'role': 'Developer',
                'action': 'Updated Project',
                'description': 'Updated project configuration',
                'project': 'AI Dashboard',
                'task': 'Frontend Development',
                'event_type': 'project_updated',
                'timestamp': datetime.now()
            },
            {
                'user': 'Admin',
                'role': 'System',
                'action': 'Brain Created',
                'description': 'New AI brain created for customer support',
                'project': 'AI Brains',
                'task': 'Brain Management',
                'event_type': 'brain_created',
                'timestamp': datetime.now()
            }
        ]
        
        result = mongo.db.task_events.insert_many(sample_logs)
        return jsonify({'success': True, 'message': f'Created {len(result.inserted_ids)} sample logs'})
        
    except Exception as e:
        print(f"Error creating sample logs: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
