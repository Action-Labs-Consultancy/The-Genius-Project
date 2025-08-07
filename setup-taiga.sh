#!/bin/bash

# Taiga Local Setup Script for Windows PowerShell
# Run this script to set up Taiga project management tool locally

echo "🚀 Setting up Taiga Project Management Tool locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if ports are available
echo "🔍 Checking port availability..."

# Function to check if port is in use
check_port() {
    local port=$1
    if netstat -an | grep ":$port " > /dev/null 2>&1; then
        echo "⚠️  Port $port is in use. Please stop the service using this port or modify docker-compose.taiga.yml"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Check required ports
ports=(9000 8000 5432 6379 8888)
for port in "${ports[@]}"; do
    if ! check_port $port; then
        echo "❌ Port conflict detected. Please resolve before continuing."
        exit 1
    fi
done

echo "✅ All required ports are available"

# Pull latest images
echo "📥 Pulling latest Taiga Docker images..."
docker-compose -f docker-compose.taiga.yml pull

# Start the stack
echo "🏗️  Starting Taiga stack..."
docker-compose -f docker-compose.taiga.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
docker-compose -f docker-compose.taiga.yml ps

# Wait for database to be ready
echo "⏳ Waiting for database initialization..."
sleep 60

# Create initial admin user
echo "👤 Creating initial admin user..."
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py migrate --run-syncdb
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_user
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_project_templates
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py compilemessages
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py collectstatic --noinput

echo "🎉 Taiga setup complete!"
echo ""
echo "📋 Access Information:"
echo "🌐 Taiga Frontend: http://localhost:9000"
echo "🔧 Backend API: http://localhost:8000"
echo "📡 WebSocket Events: ws://localhost:8888"
echo ""
echo "👤 Default Login Credentials:"
echo "Username: admin"
echo "Password: 123123"
echo ""
echo "📚 Additional Commands:"
echo "Stop Taiga: docker-compose -f docker-compose.taiga.yml down"
echo "View Logs: docker-compose -f docker-compose.taiga.yml logs"
echo "Restart: docker-compose -f docker-compose.taiga.yml restart"
echo ""
echo "🔧 To customize Taiga, edit the docker-compose.taiga.yml file"
