#!/bin/bash

# Frontend startup script with API configuration
# Usage: ./start-frontend.sh [API_URL]

# Default to LAN IP if no argument provided
API_URL=${1:-"http://192.168.100.63:10000"}

echo "🌐 Starting React Frontend..."
echo "🔧 API Base URL: $API_URL"
echo ""

cd frontend

# Set the environment variable and start the frontend
REACT_APP_API_BASE_URL="$API_URL" npm start
