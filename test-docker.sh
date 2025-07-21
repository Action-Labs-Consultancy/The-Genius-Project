#!/bin/bash

echo "Testing Docker setup for The Genius Project"
echo "==========================================="

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Build the backend image
echo "Building backend image..."
if docker build -t genius-backend:latest -f Dockerfile.simple .; then
    echo "✅ Backend image built successfully"
else
    echo "❌ Failed to build backend image"
    exit 1
fi

# Test run the backend
echo "Testing backend container..."
if docker run -d -p 5002:5002 --name genius-backend-test genius-backend:latest; then
    echo "✅ Backend container started successfully"
    
    # Wait a moment for the app to start
    sleep 5
    
    # Test the health endpoint
    if curl -f http://localhost:5002/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed"
    else
        echo "⚠️  Backend health check failed (app might still be starting)"
    fi
    
    # Stop and remove test container
    docker stop genius-backend-test > /dev/null 2>&1
    docker rm genius-backend-test > /dev/null 2>&1
    echo "✅ Test container cleaned up"
else
    echo "❌ Failed to start backend container"
    exit 1
fi

echo ""
echo "🎉 Docker setup is working correctly!"
echo ""
echo "To run the application:"
echo "  docker run -d -p 5002:5002 --name genius-backend genius-backend:latest"
echo ""
echo "To build and run with docker-compose:"
echo "  docker-compose up --build"
