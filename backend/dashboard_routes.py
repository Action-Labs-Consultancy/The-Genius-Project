from flask import request, jsonify
from flask_cors import cross_origin
import sys
import os
import importlib.util

# Add the api directory to path so we can import the handlers
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))

def register_dashboard_routes(app):
    """Register dashboard routes with the Flask app"""
    
    @app.route('/api/dashboard/import-daily-data', methods=['POST', 'OPTIONS'])
    @cross_origin()
    def import_daily_data():
        """Handle daily data import for Flask environment"""
        try:
            # Import the handler from the api directory
            import importlib.util
            spec = importlib.util.spec_from_file_location("import_daily_data", 
                os.path.join(os.path.dirname(__file__), '..', 'api', 'dashboard', 'import-daily-data.py'))
            import_daily_data = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(import_daily_data)
            handler = import_daily_data.handler
            
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            # Convert Flask request to Vercel event format
            event = {
                'httpMethod': request.method,
                'body': request.get_data(as_text=True),
                'headers': dict(request.headers)
            }
            
            # Call the handler
            result = handler(event)
            
            # Parse the body if it's a string
            body = result.get('body', {})
            if isinstance(body, str):
                import json
                body = json.loads(body)
            
            # Return the response
            return jsonify(body), result.get('statusCode', 200)
            
        except Exception as e:
            print(f"Error in import_daily_data: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/dashboard/data', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_dashboard_data():
        """Get dashboard data for Flask environment"""
        try:
            # Import the handler from the api directory
            import importlib.util
            spec = importlib.util.spec_from_file_location("data", 
                os.path.join(os.path.dirname(__file__), '..', 'api', 'dashboard', 'data.py'))
            data_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(data_module)
            handler = data_module.handler
            
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            # Pass the Flask request object directly to the handler
            result = handler(request)
            
            # Parse the body if it's a string
            body = result.get('body', {})
            if isinstance(body, str):
                import json
                body = json.loads(body)
            
            # Return the response
            return jsonify(body), result.get('statusCode', 200)
            
        except Exception as e:
            print(f"Error in get_dashboard_data: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/social-media/connections', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_social_media_connections():
        """Get social media connections for Flask environment"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            # For now, return empty connections (can be implemented later)
            return jsonify({
                'tiktok': False,
                'meta': False
            }), 200
            
        except Exception as e:
            print(f"Error in get_social_media_connections: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/social-media/data', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_social_media_data():
        """Get social media data for Flask environment"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            # For now, return empty posts (can be implemented later)
            return jsonify({
                'posts': []
            }), 200
            
        except Exception as e:
            print(f"Error in get_social_media_data: {e}")
            return jsonify({'error': str(e)}), 500