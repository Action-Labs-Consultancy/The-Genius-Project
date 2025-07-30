#!/bin/bash

echo "🧪 TESTING NO-FALLBACK VALIDATION"
echo "=================================="
echo ""

API_BASE="http://localhost:10000/api/marketing-lab"

# Test 1: Content Generation
echo "📝 Test 1: Content Generation (should return AI content or explicit error)"
echo "------------------------------------------------------------------------"

CONTENT_RESPONSE=$(curl -s -X POST "$API_BASE/execute-quick" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "No-Fallback Test Campaign",
    "description": "Testing that we get real AI content only",
    "target_audience": "developers",
    "platform": "LinkedIn",
    "tone": "professional"
  }')

echo "Response: $CONTENT_RESPONSE" | jq .

# Check if response contains ai_generated flag
AI_GENERATED=$(echo "$CONTENT_RESPONSE" | jq -r '.data.agent_outputs[0].ai_generated // false')
STATUS=$(echo "$CONTENT_RESPONSE" | jq -r '.data.agent_outputs[0].status // "unknown"')
CONTENT_LENGTH=$(echo "$CONTENT_RESPONSE" | jq -r '.data.agent_outputs[0].content_length // 0')

echo ""
echo "✅ AI Generated: $AI_GENERATED"
echo "✅ Status: $STATUS"
echo "✅ Content Length: $CONTENT_LENGTH chars"

if [ "$AI_GENERATED" = "true" ] && [ "$CONTENT_LENGTH" -gt 100 ]; then
    echo "🎉 PASS: Content generation returns real AI content"
else
    echo "❌ FAIL: Content generation did not return quality AI content"
fi

echo ""
echo "==============================================="
echo ""

# Test 2: Recommendations
echo "📊 Test 2: Recommendations (should return AI insights or explicit error)"
echo "----------------------------------------------------------------------"

RECS_RESPONSE=$(curl -s -X POST "$API_BASE/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "No-Fallback Recommendations Test",
    "description": "Testing AI-powered recommendations",
    "target_audience": "marketing professionals",
    "platform": "Twitter",
    "tone": "engaging"
  }')

echo "Response: $RECS_RESPONSE" | jq .

# Check recommendations response
RECS_AI_GENERATED=$(echo "$RECS_RESPONSE" | jq -r '.ai_generated // false')
RECS_SUCCESS=$(echo "$RECS_RESPONSE" | jq -r '.success // false')
AI_ANALYSIS_LENGTH=$(echo "$RECS_RESPONSE" | jq -r '.ai_analysis // "" | length')

echo ""
echo "✅ AI Generated: $RECS_AI_GENERATED"
echo "✅ Success: $RECS_SUCCESS"
echo "✅ AI Analysis Length: $AI_ANALYSIS_LENGTH chars"

if [ "$RECS_AI_GENERATED" = "true" ] && [ "$AI_ANALYSIS_LENGTH" -gt 100 ]; then
    echo "🎉 PASS: Recommendations return real AI insights"
else
    echo "❌ FAIL: Recommendations did not return quality AI insights"
fi

echo ""
echo "==============================================="
echo ""

# Test 3: Validate No Fallback Content
echo "🚫 Test 3: Validate No Fallback/Template Patterns"
echo "------------------------------------------------"

# Check for fallback indicators in responses
FALLBACK_PATTERNS=("fallback" "template" "intelligent_fallback" "error_fallback" "N/A" "generic content")
FOUND_FALLBACK=false

for pattern in "${FALLBACK_PATTERNS[@]}"; do
    if echo "$CONTENT_RESPONSE" | grep -qi "$pattern"; then
        echo "❌ FOUND FALLBACK PATTERN: $pattern in content response"
        FOUND_FALLBACK=true
    fi
    
    if echo "$RECS_RESPONSE" | grep -qi "$pattern"; then
        echo "❌ FOUND FALLBACK PATTERN: $pattern in recommendations response"
        FOUND_FALLBACK=true
    fi
done

if [ "$FOUND_FALLBACK" = false ]; then
    echo "🎉 PASS: No fallback patterns detected"
else
    echo "❌ FAIL: Fallback patterns found in responses"
fi

echo ""
echo "==============================================="
echo ""

# Summary
echo "📋 FINAL SUMMARY"
echo "==============="

if [ "$AI_GENERATED" = "true" ] && [ "$RECS_AI_GENERATED" = "true" ] && [ "$FOUND_FALLBACK" = false ]; then
    echo "🎉 ALL TESTS PASSED"
    echo "✅ Content generation returns real AI content"
    echo "✅ Recommendations return real AI insights" 
    echo "✅ No fallback content detected"
    echo ""
    echo "🚀 MISSION ACCOMPLISHED: Only real AI content, no fallback!"
else
    echo "❌ SOME TESTS FAILED"
    echo "Please check the output above for details"
fi

echo ""
