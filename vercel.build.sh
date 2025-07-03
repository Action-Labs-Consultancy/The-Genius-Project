#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting Vercel build process..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo "Backend dependencies installed successfully!"
cd ..

# Install frontend dependencies and build
echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
CI=false npm run build

# Verify build directory was created
if [ -d "build" ]; then
  echo "Build directory found: $(ls -la build)"
else
  echo "ERROR: Build directory not found!"
  exit 1
fi

echo "Build process completed successfully!"