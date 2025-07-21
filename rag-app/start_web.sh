#!/bin/bash
# Startup script for Local RAG Chatbot Web Interface

echo "🚀 Starting Local RAG Chatbot Web Interface..."
echo "📍 Working directory: $(pwd)"
echo ""

# Check if we're in the right directory
if [ ! -f "web_app.py" ]; then
    echo "❌ Error: web_app.py not found in current directory"
    echo "Please run this script from the rag-app directory"
    exit 1
fi

# Check if virtual environment is activated (optional)
if [ -n "$VIRTUAL_ENV" ]; then
    echo "✓ Virtual environment: $VIRTUAL_ENV"
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Warning: Ollama server doesn't seem to be running"
    echo "Please start Ollama with: ollama serve"
    echo ""
fi

# Check if vector database exists
if [ ! -d "db" ]; then
    echo "⚠️  Warning: Vector database not found"
    echo "Please run document ingestion first: python3 ingest.py"
    echo ""
fi

echo "🌐 Starting web server..."
echo "📱 Open http://localhost:8000 in your browser"
echo "📚 API docs available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================"

# Start the web application
python3 web_app.py
