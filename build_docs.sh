#!/bin/bash

# Sphinx Documentation Build Script for The Genius Project

echo "🚀 Setting up Sphinx documentation for The Genius Project..."

# Check if we're in the right directory
if [ ! -f "docs/source/conf.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create virtual environment for docs if it doesn't exist
if [ ! -d "docs/venv" ]; then
    echo "📦 Creating virtual environment for documentation..."
    python3 -m venv docs/venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source docs/venv/bin/activate

# Install documentation dependencies
echo "📚 Installing documentation dependencies..."
pip install --upgrade pip
pip install -r docs/requirements.txt

# Install the project in development mode for AutoAPI
echo "🔗 Installing project dependencies for AutoAPI..."
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
fi
if [ -f "rag-app/requirements.txt" ]; then
    pip install -r rag-app/requirements.txt
fi

# Create static directory for assets
mkdir -p docs/source/_static

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf docs/build/*

# Build HTML documentation
echo "🏗️  Building HTML documentation..."
cd docs
sphinx-build -b html source build/html

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Documentation built successfully!"
    echo "📖 Open docs/build/html/index.html in your browser to view the documentation"
    echo "🌐 Or run: python -m http.server 8080 --directory docs/build/html"
else
    echo "❌ Documentation build failed!"
    exit 1
fi

# Deactivate virtual environment
deactivate

echo "🎉 Documentation setup complete!"
