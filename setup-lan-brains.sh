#!/bin/bash
# Genius Project - LAN Brain Visibility Setup Script
# This script ensures all devices on the LAN can see the same brains

echo "🧠 GENIUS PROJECT - LAN BRAIN VISIBILITY SETUP"
echo "=============================================="

# Get local IP
LOCAL_IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📍 Local IP Address: $LOCAL_IP"

# Check if backend is running
if curl -s http://localhost:10000/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 10000"
else
    echo "❌ Backend is not running. Starting it now..."
    cd backend && source venv/bin/activate && python app.py &
    sleep 5
    cd ..
fi

# Test local access
echo ""
echo "🔍 Testing Local Access..."
BRAIN_COUNT=$(curl -s http://localhost:10000/api/brains | python -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
echo "   Local (localhost): $BRAIN_COUNT brains found"

# Test LAN access
echo ""
echo "🌐 Testing LAN Access..."
LAN_BRAIN_COUNT=$(curl -s http://$LOCAL_IP:10000/api/brains | python -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
echo "   LAN ($LOCAL_IP): $LAN_BRAIN_COUNT brains found"

# Display access information
echo ""
echo "📋 ACCESS INFORMATION FOR OTHER LAN DEVICES:"
echo "=============================================="
echo "🖥️  Backend Server: http://$LOCAL_IP:10000"
echo "🧠 Brains API: http://$LOCAL_IP:10000/api/brains"
echo "🎯 Frontend (if running): http://$LOCAL_IP:3000"
echo ""
echo "📝 SETUP INSTRUCTIONS FOR OTHER PCs:"
echo "1. Copy the .env file to each PC:"
echo "   - Ensure MONGODB_URI is the same on all devices"
echo "   - Ensure PORT=10000 on all devices"
echo "   - Ensure CORS_ORIGINS includes LAN IPs"
echo ""
echo "2. Start backend on each PC with:"
echo "   cd backend && source venv/bin/activate && python app.py"
echo ""
echo "3. Or use this centralized approach:"
echo "   - Only run backend on this PC ($LOCAL_IP)"
echo "   - Point all frontends to: http://$LOCAL_IP:10000"
echo ""

# Check database connectivity
echo "🗄️  Database Status:"
if [ "$BRAIN_COUNT" -gt "0" ]; then
    echo "   ✅ MongoDB connected with $BRAIN_COUNT brains"
    echo "   ✅ Cross-LAN brain visibility is working"
else
    echo "   ❌ No brains found - check MongoDB connection"
    echo "   💡 Verify MONGODB_URI in .env file"
fi

echo ""
echo "🎉 SUMMARY:"
echo "   - Backend URL: http://$LOCAL_IP:10000"
echo "   - Brains visible: $BRAIN_COUNT"
echo "   - LAN access: $([ "$LAN_BRAIN_COUNT" -eq "$BRAIN_COUNT" ] && echo "✅ Working" || echo "❌ Issues")"
echo ""
echo "🔧 TROUBLESHOOTING:"
echo "   - If other PCs can't see brains, ensure they use the same MONGODB_URI"
echo "   - Check firewall settings allow port 10000"
echo "   - Verify all devices are on the same network"
