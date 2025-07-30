#!/bin/bash

echo "🔧 Marketing Lab System Test"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo -e "\n${YELLOW}1. Testing Backend Health...${NC}"
HEALTH_RESPONSE=$(curl -s http://192.168.100.63:10000/api/marketing-lab/health)
if echo "$HEALTH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Backend Health: OK${NC}"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool | head -10
else
    echo -e "${RED}❌ Backend Health: FAILED${NC}"
    echo "$HEALTH_RESPONSE"
fi

# Test 2: Quick Execute
echo -e "\n${YELLOW}2. Testing Quick Execute...${NC}"
QUICK_RESPONSE=$(curl -s --max-time 45 -X POST http://192.168.100.63:10000/api/marketing-lab/execute-quick \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "LAN Test Campaign",
    "description": "Test AI content generation from LAN",
    "target_audience": "professionals", 
    "platform": "LinkedIn"
  }')

if echo "$QUICK_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Quick Execute: SUCCESS${NC}"
    echo "Generated content preview:"
    echo "$QUICK_RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
content = data['data']['agent_outputs'][0]['content']
print('\"' + content[:200] + '...\"')
" 2>/dev/null || echo "Content generated successfully"
else
    echo -e "${RED}❌ Quick Execute: FAILED${NC}"
    echo "$QUICK_RESPONSE"
fi

# Test 3: Frontend Access
echo -e "\n${YELLOW}3. Testing Frontend Access...${NC}"
FRONTEND_RESPONSE=$(curl -s -I http://192.168.100.63:3000 | head -1)
if echo "$FRONTEND_RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Frontend Access: OK${NC}"
else
    echo -e "${RED}❌ Frontend Access: FAILED${NC}"
fi

echo -e "\n${YELLOW}================================${NC}"
echo -e "${GREEN}🎉 LAN Access URLs:${NC}"
echo "Frontend: http://192.168.100.63:3000/marketinglab"
echo "Backend API: http://192.168.100.63:10000/api/marketing-lab/health"
echo -e "\n${YELLOW}Quick Test Command:${NC}"
echo "curl -X POST http://192.168.100.63:10000/api/marketing-lab/execute-quick -H 'Content-Type: application/json' -d '{\"campaign_name\":\"Test\",\"description\":\"AI tools\",\"target_audience\":\"professionals\",\"platform\":\"LinkedIn\"}'"
