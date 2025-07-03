import sys
import os

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure we catch any import errors and log them
try:
    # Import the Flask app from the backend
    from backend.app import app
    
    # Vercel serverless function handler
    def handler(request, context):
        """Vercel serverless function handler"""
        return app(request, context)
        
except Exception as e:
    import traceback
    
    # Log the error for debugging
    error_log = f"Error importing app: {str(e)}\n{traceback.format_exc()}"
    print(error_log)
    
    # Create a basic error response
    def handler(request, context):
        """Error handler when app import fails"""
        return {
            "statusCode": 500,
            "body": f"Server configuration error: {str(e)}",
            "headers": {
                "Content-Type": "text/plain"
            }
        }
