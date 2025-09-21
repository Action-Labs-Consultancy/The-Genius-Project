#!/bin/bash

echo "🚀 Upgrading n8n workflow with AI-enhanced research generation..."

# Check if services are running
echo "📊 Checking service status..."
curl -s http://localhost:5678/healthz > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ n8n is running"
else
    echo "❌ n8n is not accessible. Please start it first."
    exit 1
fi

curl -s http://localhost:11434/api/tags > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Ollama/Mistral is running"
else
    echo "❌ Ollama is not accessible. Please start it first."
    exit 1
fi

# Import the AI-enhanced workflow
echo "📥 Importing AI-enhanced workflow..."
curl -X POST http://localhost:5678/rest/workflows/import \
  -H "Content-Type: application/json" \
  -d @taiga-ai-workflow.json

if [ $? -eq 0 ]; then
    echo "✅ AI-enhanced workflow imported successfully!"
else
    echo "❌ Failed to import workflow"
    exit 1
fi

# Activate the workflow
echo "🔄 Activating workflow..."
WORKFLOW_ID=$(curl -s http://localhost:5678/rest/workflows | jq -r '.data[] | select(.name == "Taiga Due Diligence Research with AI (Enhanced)") | .id')

if [ ! -z "$WORKFLOW_ID" ]; then
    curl -X PATCH http://localhost:5678/rest/workflows/$WORKFLOW_ID \
      -H "Content-Type: application/json" \
      -d '{"active": true}'
    
    echo "✅ Workflow activated with ID: $WORKFLOW_ID"
else
    echo "❌ Could not find workflow to activate"
fi

echo ""
echo "🎯 AI Enhancement Summary:"
echo "- Added Mistral LLM integration (localhost:11434)"
echo "- Comprehensive 10-section research reports"
echo "- Professional formatting with disclaimers"
echo "- Quality AI-generated content replaces templates"
echo ""
echo "📋 Test the enhanced workflow:"
echo "1. Create a task in Taiga with subject: 'Research on Tesla'"
echo "2. Watch n8n generate detailed AI analysis"
echo "3. Check task description for comprehensive report"
echo ""
echo "🔗 Access points:"
echo "- n8n: http://localhost:5678"
echo "- Taiga: http://localhost:9000"
echo "- Webhook: http://localhost:5678/webhook/taiga-webhook"
