#!/bin/bash
set -e

echo "=== Starting Vercel Build Process ==="

# Create necessary directories
mkdir -p /tmp/build-logs

# Prepare environment for Python dependencies
export PYTHONUNBUFFERED=1
export DISABLE_DEPENDENCIES=1

# Install backend dependencies
echo "=== Installing Backend Dependencies ==="
pip install --upgrade pip
cd backend
pip install -r requirements.txt --no-cache-dir || echo "Some dependencies may have failed, continuing anyway..."
cd ..

# Install frontend dependencies and build
echo "=== Building Frontend ==="
cd frontend
npm install
CI=false npm run build

# Verify build directory was created
if [ -d "build" ]; then
  echo "=== Build directory found ==="
  ls -la build
else
  echo "=== ERROR: Build directory not found! ==="
  exit 1
fi

echo "=== Build Process Completed ==="