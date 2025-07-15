#!/bin/bash
# Production start script for Render deployment

# Set environment variables
export FLASK_ENV=production
export FLASK_APP=app.py

# Start with gunicorn and eventlet for SocketIO support
exec gunicorn -w 1 -k eventlet -b 0.0.0.0:$PORT app:app
