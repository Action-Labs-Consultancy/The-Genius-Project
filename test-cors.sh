#!/bin/bash

# Test CORS configuration for The Genius Project
echo "🧪 Testing CORS Configuration for LAN Access"
echo "=============================================="

API_BASE="http://192.168.100.63:10000"
ORIGIN="http://localhost:3000"

echo ""
echo "1. Testing Login OPTIONS (preflight)..."
curl -s -I -X OPTIONS "$API_BASE/login" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" | grep -E "(HTTP|Access-Control)"

echo ""
echo "2. Testing Login POST..."
curl -s -I -X POST "$API_BASE/login" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test", "password": "test"}' | grep -E "(HTTP|Access-Control)"

echo ""
echo "3. Testing Equipment API..."
curl -s -I -X GET "$API_BASE/api/equipment" \
  -H "Origin: $ORIGIN" | grep -E "(HTTP|Access-Control)"

echo ""
echo "4. Testing Equipment Status Options..."
curl -s -I -X GET "$API_BASE/api/equipment/status-options" \
  -H "Origin: $ORIGIN" | grep -E "(HTTP|Access-Control)"

echo ""
echo "5. Testing Meetings API..."
curl -s -I -X GET "$API_BASE/api/meetings" \
  -H "Origin: $ORIGIN" | grep -E "(HTTP|Access-Control)"

echo ""
echo "✅ CORS test complete!"
echo ""
echo "💡 All endpoints should show:"
echo "   - HTTP/1.0 200 OK (or 400/401 for invalid requests)"
echo "   - Access-Control-Allow-Origin: *"
echo ""
