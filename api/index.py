import os
import sys
from flask import Flask, Response

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Set environment for production
    os.environ.setdefault('FLASK_ENV', 'production')
    
    # Set a SECRET_KEY if not provided
    if not os.environ.get('SECRET_KEY'):
        os.environ['SECRET_KEY'] = 'vercel-production-secret-key-change-me'
    
    # Debug environment variables
    print(f"[VERCEL DEBUG] MONGODB_URI exists: {bool(os.environ.get('MONGODB_URI'))}")
    print(f"[VERCEL DEBUG] SECRET_KEY exists: {bool(os.environ.get('SECRET_KEY'))}")
    print(f"[VERCEL DEBUG] Python path: {sys.path}")
    
    # Import the Flask app
    from backend.app import app
    
    # Test the app is working
    print("[VERCEL] Flask app imported successfully")
    
    # Export the app for Vercel (this is what Vercel will call)
    application = app
    
except ImportError as e:
    import traceback
    
    print(f"[VERCEL IMPORT ERROR] Failed to import Flask app: {str(e)}")
    print(f"[VERCEL IMPORT ERROR] Traceback: {traceback.format_exc()}")
    
    # Create a simple error response Flask app for debugging
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def catch_all(path):
        error_details = f"Import error: {str(e)}\n{traceback.format_exc()}"
        return Response(f"Import Error:\n{error_details}", status=500, mimetype='text/plain')
    
    application = error_app
    
except Exception as e:
    import traceback
    
    print(f"[VERCEL ERROR] General error importing Flask app: {str(e)}")
    print(f"[VERCEL ERROR] Traceback: {traceback.format_exc()}")
    
    # Create a simple error response Flask app for debugging
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def catch_all(path):
        error_details = f"General error: {str(e)}\n{traceback.format_exc()}"
        return Response(f"Server Error:\n{error_details}", status=500, mimetype='text/plain')
    
    application = error_app
