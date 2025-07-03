from flask import Flask, Response
import sys
import os

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Import the Flask app
    from backend.app import app
    
    # For Vercel serverless functions
    def handler(request, context):
        return app(request, context)
        
except Exception as e:
    import traceback
    
    # Create a simple error response Flask app
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def catch_all(path):
        error_details = f"Import error: {str(e)}\n{traceback.format_exc()}"
        return Response(f"Server configuration error. Please check logs.\n{error_details}", status=500)
    
    # Fallback handler using the error app
    def handler(request, context):
        return error_app(request, context)
