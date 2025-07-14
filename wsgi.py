#!/usr/bin/env python3
"""
WSGI entry point for production deployment
"""

import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set environment variables for production
os.environ.setdefault('FLASK_ENV', 'production')

# Import the Flask app from backend
from backend.app import app

# Export the application for gunicorn
application = app

if __name__ == '__main__':
    # For direct execution, run with production settings
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
