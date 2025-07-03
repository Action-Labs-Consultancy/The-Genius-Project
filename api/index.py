import sys
import os

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Flask app from the backend
from backend.app import app

# Vercel serverless function handler
def handler(request, context):
    return app(request, context)
