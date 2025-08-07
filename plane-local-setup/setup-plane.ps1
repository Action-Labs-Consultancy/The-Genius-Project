#!/bin/bash

# Plane Local Setup Script for Windows (PowerShell)
# Run this script to set up Plane PM locally

Write-Host "🚀 Setting up Plane PM locally..." -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not installed or running. Please install Docker Desktop for Windows." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
docker-compose --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Compose is not available. Please ensure Docker Desktop is properly installed." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is ready!" -ForegroundColor Green

# Create necessary directories
Write-Host "Creating directories..." -ForegroundColor Yellow
if (-not (Test-Path "plane-local-setup")) {
    New-Item -ItemType Directory -Path "plane-local-setup"
}

Set-Location "plane-local-setup"

# Pull the latest images
Write-Host "🐳 Pulling Docker images..." -ForegroundColor Yellow
docker-compose pull

# Start the services
Write-Host "🚀 Starting Plane services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "✅ Plane PM setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   Main App:      http://localhost:3001" -ForegroundColor White
Write-Host "   API:           http://localhost:8000" -ForegroundColor White
Write-Host "   Public Space:  http://localhost:4000" -ForegroundColor White
Write-Host "   RabbitMQ UI:   http://localhost:15673" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Default Login:" -ForegroundColor Cyan
Write-Host "   Email:         admin@plane.local" -ForegroundColor White
Write-Host "   Password:      admin123" -ForegroundColor White
Write-Host ""
Write-Host "📊 RabbitMQ Management:" -ForegroundColor Cyan
Write-Host "   Username:      plane_rabbit" -ForegroundColor White
Write-Host "   Password:      plane_rabbit_password_2024" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
Write-Host "   Stop:          docker-compose down" -ForegroundColor White
Write-Host "   Restart:       docker-compose restart" -ForegroundColor White
Write-Host "   View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "   Update:        docker-compose pull && docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "💾 Data is stored in Docker volumes and will persist between restarts." -ForegroundColor Green
