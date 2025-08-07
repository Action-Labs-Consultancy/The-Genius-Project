#!/bin/bash

# Start n8n automation platform with authentication
echo "🚀 Starting n8n automation platform..."

# Set environment variables for n8n
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=securepassword
export N8N_HOST=localhost
export N8N_PORT=5678
export N8N_RUNNERS_ENABLED=true

# Start n8n in background
npx n8n &

echo "⚡ n8n started on http://localhost:5678"
echo "   Login: admin / securepassword"
echo ""
echo "✅ Ready! Use the sidebar buttons to access:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   ⚡ n8n Automation: http://localhost:5678"
echo "   📋 Plane Projects: https://app.plane.so"
