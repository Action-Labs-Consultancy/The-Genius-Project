#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting Vercel build process..."

# Environment variables to help with psycopg2 installation
export PSYCOPG2_BINARY_NO_BUILD_EXT=1
export DISABLE_DEPENDENCIES=1

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend

# Install basic requirements first without psycopg2
grep -v "psycopg2" requirements.txt > requirements-no-pg.txt
python -m pip install --upgrade pip
python -m pip install -r requirements-no-pg.txt

# Now try to install psycopg2 with the special flag
echo "Installing psycopg2 separately..."
python -m pip install psycopg2-binary==2.9.6 --no-build-isolation

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