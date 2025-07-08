import os
import sys
from flask import Flask, Response

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Set environment for production
    os.environ.setdefault('FLASK_ENV', 'production')
    
    # Import the Flask app
    from backend.app import app
    
    # Initialize database tables if needed
    with app.app_context():
        from core.models import db
        try:
            db.create_all()
        except Exception as e:
            print(f"Database initialization warning: {e}")
    
    # Export the app for Vercel (this is what Vercel will call)
    application = app
    
except Exception as e:
    import traceback
    
    # Create a simple error response Flask app for debugging
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def catch_all(path):
        error_details = f"Import error: {str(e)}\n{traceback.format_exc()}"
        return Response(f"Server configuration error:\n{error_details}", status=500, mimetype='text/plain')
    
    application = error_app
