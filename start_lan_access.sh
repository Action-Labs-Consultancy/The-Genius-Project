#!/bin/bash
# Startup script for LAN access with proper API configuration

echo "🚀 Starting The Genius Project for LAN Access"
echo "=============================================="

# Check if backend is running
if ! curl -s http://192.168.100.63:10000/health > /dev/null; then
    echo "⚠️  Backend not running, starting it..."
    cd /Users/rabab/the-genius-project/backend
    nohup python3 app.py > backend.log 2>&1 &
    echo "🔄 Waiting for backend to start..."
    sleep 5
fi

# Check backend again
if curl -s http://192.168.100.63:10000/health > /dev/null; then
    echo "✅ Backend is running on http://192.168.100.63:10000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend with LAN configuration
echo "🌐 Starting frontend with LAN API configuration..."
cd /Users/rabab/the-genius-project/frontend

# Create .env.local with priority
cat > .env.local << EOF
REACT_APP_API_BASE_URL=http://192.168.100.63:10000
REACT_APP_API_URL=http://192.168.100.63:10000
GENERATE_SOURCEMAP=false
EOF

echo "📝 Created .env.local with LAN configuration"

# Start frontend
echo "🚀 Starting frontend on http://192.168.100.63:3000"
REACT_APP_API_BASE_URL=http://192.168.100.63:10000 npm start

echo "✅ Services started! Access from any device on LAN:"
echo "   Frontend: http://192.168.100.63:3000"
echo "   Backend:  http://192.168.100.63:10000"
