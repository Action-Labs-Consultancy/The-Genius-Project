#!/bin/bash

# Test LAN connectivity for The Genius Project
echo "🧪 Testing LAN Connectivity for The Genius Project"
echo "=================================================="

# Get machine IP
MACHINE_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.100.63")
echo "📡 Machine IP: $MACHINE_IP"

# Test if backend is running
echo ""
echo "🔧 Testing backend connectivity..."
if curl -s -m 5 "http://$MACHINE_IP:10000/health" >/dev/null 2>&1; then
    echo "✅ Backend is reachable at http://$MACHINE_IP:10000"
    
    # Test the health endpoint
    echo "🏥 Health check response:"
    curl -s "http://$MACHINE_IP:10000/health" | python3 -m json.tool 2>/dev/null || echo "Backend responded but not with JSON"
    
    # Test the marketing lab health
    echo ""
    echo "🧠 Marketing Lab health check:"
    curl -s "http://$MACHINE_IP:10000/api/marketing-lab/health" | python3 -m json.tool 2>/dev/null || echo "Marketing Lab endpoint not responding"
    
else
    echo "❌ Backend is NOT reachable at http://$MACHINE_IP:10000"
    echo "   Make sure the backend is running with: ./start-backend.sh"
fi

# Test if frontend is running
echo ""
echo "🌐 Testing frontend connectivity..."
if curl -s -m 5 "http://$MACHINE_IP:3000" >/dev/null 2>&1; then
    echo "✅ Frontend is reachable at http://$MACHINE_IP:3000"
else
    echo "❌ Frontend is NOT reachable at http://$MACHINE_IP:3000"
    echo "   Make sure the frontend is running with: cd frontend && npm start"
fi

# Test from other common IPs on the network
echo ""
echo "🌍 Network interface information:"
echo "================================="
ifconfig | grep -E "inet [0-9]" | grep -v 127.0.0.1

echo ""
echo "📋 Summary:"
echo "==========="
echo "Backend URL: http://$MACHINE_IP:10000"
echo "Frontend URL: http://$MACHINE_IP:3000"
echo "Health endpoint: http://$MACHINE_IP:10000/health"
echo "Marketing Lab: http://$MACHINE_IP:10000/api/marketing-lab/health"
echo ""
echo "🚀 To start both services: ./start-lan-access.sh"
