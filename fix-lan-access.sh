#!/bin/bash

# Fix LAN Access Issues for The Genius Project
echo "🔧 Fixing LAN Access Issues..."
echo "================================"

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || pkill -f "react-scripts" 2>/dev/null || true

# Get current IP
MACHINE_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.100.63")
echo "📡 Machine IP: $MACHINE_IP"

# Set environment variable globally for this session
export REACT_APP_API_BASE_URL="http://$MACHINE_IP:10000"
echo "✅ Set API URL: $REACT_APP_API_BASE_URL"

# Clear React cache to ensure new API URL is used
echo "🧹 Clearing React cache..."
cd frontend && rm -rf node_modules/.cache 2>/dev/null || true

# Start backend
echo "🔧 Starting backend..."
cd ../backend
export PORT=10000
python3 app.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s "http://$MACHINE_IP:10000/health" >/dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done

# Start frontend with explicit environment variable
echo "🌐 Starting frontend..."
cd ../frontend
REACT_APP_API_BASE_URL="$REACT_APP_API_BASE_URL" npm start &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
for i in {1..60}; do
    if curl -s "http://$MACHINE_IP:3000" >/dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Frontend failed to start after 60 seconds"
        exit 1
    fi
    sleep 1
done

# Test the connection
echo ""
echo "🧪 Testing connections..."
echo "========================="

# Test backend
if curl -s "http://$MACHINE_IP:10000/health" | grep -q "healthy"; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

# Test API endpoint
if curl -s "http://$MACHINE_IP:10000/api/test" | grep -q "success"; then
    echo "✅ Backend API test passed"
else
    echo "❌ Backend API test failed"
fi

# Test frontend
if curl -s "http://$MACHINE_IP:3000" | grep -q "html"; then
    echo "✅ Frontend serving HTML"
else
    echo "❌ Frontend not serving content"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "Frontend: http://$MACHINE_IP:3000"
echo "Backend:  http://$MACHINE_IP:10000"
echo "API URL:  $REACT_APP_API_BASE_URL"
echo ""
echo "📱 Access from any device on your network using these URLs"
echo "🔧 If still having issues, check LAN_TROUBLESHOOTING.md"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || pkill -f "react-scripts" 2>/dev/null || true
    echo "✅ Cleanup complete"
    exit 0
}

# Set up trap for cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
