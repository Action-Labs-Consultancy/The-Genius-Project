#!/bin/bash

# Ultra-Fast RAG System Startup Script
echo "🚀 Starting Ultra-Fast RAG System..."

# Set environment variables for optimal performance
export OLLAMA_NUM_PARALLEL=2
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_HOST=0.0.0.0:11434

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check if Ollama is running
if ! pgrep -f "ollama serve" > /dev/null; then
    echo "⚡ Starting Ollama service..."
    ollama serve &
    sleep 3
fi

# Check if llama3.2 model is available
echo "🔍 Checking for llama3.2 model..."
if ! ollama list | grep -q "llama3.2"; then
    echo "📥 Pulling llama3.2 model for ultra-fast performance..."
    ollama pull llama3.2
fi

# Start the web application with optimizations
echo "🌐 Starting ultra-fast web interface..."
echo "🎯 Optimizations active:"
echo "   ⚡ Ultra-fast model settings"
echo "   🧠 Smart response caching"
echo "   🚀 Quick pattern matching"
echo "   📊 Performance monitoring"
echo ""
echo "📱 Access the web interface at: http://localhost:8001"
echo "💻 Or use the CLI version by running: python main.py"
echo ""

# Start the web app
python web_app.py
