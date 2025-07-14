#!/usr/bin/env python3
"""
Entry point for Render deployment
This file imports and runs the Flask app from the backend directory
"""

import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set environment variables for production
os.environ.setdefault('FLASK_ENV', 'production')

# Import the Flask app and socketio from backend
from backend.app import app, socketio

if __name__ == '__main__':
    # Get port from environment (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    print(f"[RENDER] Starting Flask app on port {port}")
    
    # For production, we need to handle Werkzeug warning differently
    # Use socketio.run with log_output=False to suppress Werkzeug warnings
    try:
        socketio.run(app, host='0.0.0.0', port=port, debug=False, log_output=False)
    except RuntimeError as e:
        if "Werkzeug" in str(e):
            # Fallback: Use regular Flask app.run for production
            print(f"[RENDER] Falling back to Flask app.run due to Werkzeug restriction")
            app.run(host='0.0.0.0', port=port, debug=False)
        else:
            raise e
