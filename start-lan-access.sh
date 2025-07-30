#!/bin/bash

# The Genius Project - LAN Access Startup Script
# This script starts both frontend and backend for LAN access

echo "🚀 Starting The Genius Project for LAN Access..."

# Get the current machine's IP address automatically (try multiple interfaces)
MACHINE_IP=""

# Try different network interfaces
for interface in en0 en1 wlan0 eth0; do
    if command -v ipconfig >/dev/null 2>&1; then
        # macOS
        IP=$(ipconfig getifaddr $interface 2>/dev/null)
    elif command -v ip >/dev/null 2>&1; then
        # Linux
        IP=$(ip route get 1 | grep -oP 'src \K\S+' 2>/dev/null || ip addr show $interface 2>/dev/null | grep -oP 'inet \K[^/]+')
    fi
    
    if [[ -n "$IP" && "$IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        MACHINE_IP="$IP"
        break
    fi
done

# Fallback to configured IP if auto-detection fails
if [ -z "$MACHINE_IP" ]; then
    MACHINE_IP="192.168.100.63"
    echo "⚠️  Could not auto-detect IP, using fallback: $MACHINE_IP"
else
    echo "✅ Detected machine IP: $MACHINE_IP"
fi

# Set the API URL
export REACT_APP_API_BASE_URL="http://$MACHINE_IP:10000"

echo "📡 Machine IP: $MACHINE_IP"
echo "🔧 Backend will run on: http://$MACHINE_IP:10000"
echo "🌐 Frontend will run on: http://$MACHINE_IP:3000"
echo "🔗 API URL configured: $REACT_APP_API_BASE_URL"
echo ""

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down The Genius Project..."
    pkill -f "python.*app.py" 2>/dev/null
    pkill -f "npm start" 2>/dev/null || pkill -f "react-scripts" 2>/dev/null
    echo "✅ Cleanup complete"
    exit 0
}

# Set up trap for cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

echo "🔧 Starting backend server..."
# Set PORT environment variable to ensure backend uses correct port
export PORT=10000
cd backend && python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "🌐 Starting frontend server..."
cd ../frontend && REACT_APP_API_BASE_URL="$REACT_APP_API_BASE_URL" npm start &
FRONTEND_PID=$!

echo ""
echo "✅ The Genius Project is starting up!"
echo ""
echo "📱 Access from any device on your network:"
echo "   Frontend: http://$MACHINE_IP:3000"
echo "   Backend API: http://$MACHINE_IP:10000"
echo ""
echo "🔗 Local access:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:10000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
