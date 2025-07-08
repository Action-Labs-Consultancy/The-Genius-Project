import os
import sys
from flask import Flask, Response

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Set environment variables for Vercel deployment
    os.environ.setdefault('FLASK_ENV', 'production')
    
    # Import the Flask app
    from backend.app import app
    
    # Initialize database tables on startup
    with app.app_context():
        from core.models import db
        db.create_all()
    
    # Export the app for Vercel
    def handler(request):
        return app(request.environ, lambda status, headers: None)
        
except Exception as e:
    import traceback
    
    # Create a simple error response Flask app for debugging
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def catch_all(path):
        error_details = f"Import error: {str(e)}\n{traceback.format_exc()}"
        return Response(f"Server configuration error. Please check logs.\n{error_details}", status=500, mimetype='text/plain')
    
    app = error_app
    
    def handler(request):
        return error_app(request.environ, lambda status, headers: None)
