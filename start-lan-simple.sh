#!/bin/bash

# Simple LAN Access Setup Script
echo "🔧 Setting up LAN access for The Genius Project..."

# Get machine IP
MACHINE_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.100.63")
echo "📡 Machine IP: $MACHINE_IP"

# Stop existing processes
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || pkill -f "react-scripts" 2>/dev/null || true

# Set environment variables
export REACT_APP_API_BASE_URL="http://$MACHINE_IP:10000"
export HOST="0.0.0.0"  # Make React dev server listen on all interfaces
export PORT_FRONTEND=3000
export PORT_BACKEND=10000

echo "✅ Environment configured:"
echo "   API URL: $REACT_APP_API_BASE_URL"
echo "   Frontend Host: $HOST"
echo "   Frontend Port: $PORT_FRONTEND"
echo "   Backend Port: $PORT_BACKEND"

# Start backend
echo ""
echo "🔧 Starting backend on all interfaces..."
cd backend
PORT=$PORT_BACKEND python3 app.py &
BACKEND_PID=$!

# Wait for backend
echo "⏳ Waiting for backend..."
sleep 5

# Start frontend
echo ""
echo "🌐 Starting frontend on all interfaces..."
cd ../frontend
HOST="$HOST" PORT="$PORT_FRONTEND" REACT_APP_API_BASE_URL="$REACT_APP_API_BASE_URL" npm start &
FRONTEND_PID=$!

# Wait for frontend
echo "⏳ Waiting for frontend..."
sleep 10

# Test connectivity
echo ""
echo "🧪 Testing connectivity..."
if curl -s -m 5 "http://$MACHINE_IP:$PORT_BACKEND/health" >/dev/null; then
    echo "✅ Backend reachable at http://$MACHINE_IP:$PORT_BACKEND"
else
    echo "❌ Backend not reachable"
fi

if curl -s -m 5 "http://$MACHINE_IP:$PORT_FRONTEND" >/dev/null; then
    echo "✅ Frontend reachable at http://$MACHINE_IP:$PORT_FRONTEND"
else
    echo "❌ Frontend not reachable (this might be normal for React dev server)"
fi

echo ""
echo "🎉 Setup complete!"
echo "==================="
echo "🌐 Frontend: http://$MACHINE_IP:$PORT_FRONTEND"
echo "🔧 Backend:  http://$MACHINE_IP:$PORT_BACKEND"
echo ""
echo "📱 Access from any device on your network using the above URLs"
echo "🔍 If issues persist, check the troubleshooting guide: LAN_TROUBLESHOOTING.md"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || pkill -f "react-scripts" 2>/dev/null || true
    echo "✅ Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
