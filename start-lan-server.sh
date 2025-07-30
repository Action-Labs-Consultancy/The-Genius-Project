#!/bin/bash
# Genius Project LAN Startup Script
# Starts the backend server with perfect LAN access

echo "🚀 Starting Genius Project with LAN Access..."

# Get local IP
LOCAL_IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo "🌐 Local IP: $LOCAL_IP"
echo "📍 Backend will be accessible at:"
echo "   - Local: http://localhost:5001"
echo "   - LAN: http://$LOCAL_IP:5001"

# Start backend
cd /Users/rabab/the-genius-project/backend
source venv/bin/activate
PORT=5001 python3 app.py
