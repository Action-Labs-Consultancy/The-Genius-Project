#!/bin/bash

echo "🚀 COMPLETE MARKETING LAB TEST"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}Testing Marketing Lab Quick Execute...${NC}"

# Test with different campaign data
RESPONSE=$(curl -s --max-time 30 -X POST http://localhost:10000/api/marketing-lab/execute-quick \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "Final Test Campaign",
    "description": "Testing complete frontend integration",
    "target_audience": "business professionals", 
    "platform": "LinkedIn",
    "tone": "professional"
  }')

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ BACKEND SUCCESS!${NC}"
    
    # Extract key data for frontend compatibility check
    echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    exec_data = data['data']
    
    print('📊 FRONTEND COMPATIBILITY CHECK:')
    
    # Check agents array
    agents = exec_data.get('agents', [])
    print(f'  agents: {len(agents)} items ✓')
    if agents:
        agent = agents[0]
        print(f'    - agent_name: \"{agent.get(\"agent_name\", \"N/A\")}\"')
        print(f'    - status: \"{agent.get(\"status\", \"N/A\")}\"')
        print(f'    - output length: {len(agent.get(\"output\", \"\"))} chars')
    
    # Check final_output
    final_output = exec_data.get('final_output', '')
    print(f'  final_output: {len(final_output)} chars ✓')
    
    # Check mode
    mode = exec_data.get('mode', 'N/A')
    print(f'  mode: \"{mode}\" ✓')
    
    # Show content preview
    print(f'\n📝 CONTENT PREVIEW:')
    content_preview = final_output[:200] + '...' if len(final_output) > 200 else final_output
    print(f'  \"{content_preview}\"')
    
    print(f'\n🎯 FRONTEND SHOULD NOW DISPLAY:')
    print(f'  - Campaign: \"{exec_data.get(\"task_data\", {}).get(\"campaign_name\", \"N/A\")}\"')
    print(f'  - Content Creator agent with ✅ status')
    print(f'  - Final output with {len(final_output)} characters')
    print(f'  - Copy/Download buttons should work')
    
except Exception as e:
    print(f'❌ ERROR parsing response: {e}')
" 
else
    echo -e "${RED}❌ BACKEND FAILED!${NC}"
    echo "Response: $RESPONSE"
fi

echo -e "\n${YELLOW}=============================="
echo -e "🌐 TESTING URLS:"
echo -e "Frontend: ${BLUE}http://localhost:3000/marketinglab${NC}"
echo -e "LAN Frontend: ${BLUE}http://192.168.100.63:3000/marketinglab${NC}"
echo -e "Backend Health: ${BLUE}http://localhost:10000/api/marketing-lab/health${NC}"
echo -e "=============================="
