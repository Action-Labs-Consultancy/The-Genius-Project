# Due Diligence Docker Setup Script for Windows
Write-Host "🚀 Setting up Due Diligence Automation Stack..." -ForegroundColor Green

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\workflows" | Out-Null
New-Item -ItemType Directory -Force -Path ".\custom-nodes" | Out-Null
New-Item -ItemType Directory -Force -Path ".\sql" | Out-Null

# Create workflows directory and copy workflow
Write-Host "📋 Setting up workflows..." -ForegroundColor Yellow
if (Test-Path "Enhanced_DD_MCA_Workflow_Fixed.json") {
    Copy-Item "Enhanced_DD_MCA_Workflow_Fixed.json" ".\workflows\" -Force
    Write-Host "✅ Workflow copied to .\workflows\" -ForegroundColor Green
}

# Build and start services
Write-Host "🏗️ Building Docker images..." -ForegroundColor Yellow
docker-compose -f docker-compose.dd.yml build

Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.dd.yml up -d

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Setup Ollama models
Write-Host "🤖 Setting up AI models..." -ForegroundColor Yellow
Write-Host "Pulling Mistral model..." -ForegroundColor Cyan
docker exec ollama-dd ollama pull mistral:latest

Write-Host "Pulling additional model for financial analysis..." -ForegroundColor Cyan
docker exec ollama-dd ollama pull deepseek-coder:1.3b-instruct

# Check service status
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.dd.yml ps

Write-Host ""
Write-Host "✅ Setup complete! Your services are running:" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 n8n:        http://localhost:5678" -ForegroundColor Cyan
Write-Host "   Username:   admin" -ForegroundColor Gray
Write-Host "   Password:   changeme123" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Kanboard:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "   Username:   admin" -ForegroundColor Gray
Write-Host "   Password:   admin" -ForegroundColor Gray
Write-Host ""
Write-Host "🤖 Ollama:     http://localhost:11434" -ForegroundColor Cyan
Write-Host "📊 PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "🔄 Redis:      localhost:6379" -ForegroundColor Cyan
Write-Host "📁 MinIO:      http://localhost:9001" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Import the workflow: Enhanced_DD_MCA_Workflow_Fixed.json" -ForegroundColor White
Write-Host "2. Configure Kanboard API credentials in n8n" -ForegroundColor White
Write-Host "3. Set up Ollama API credentials in n8n" -ForegroundColor White
Write-Host "4. Create a test Due Diligence task in Kanboard" -ForegroundColor White
Write-Host ""
Write-Host "📚 To stop all services: docker-compose -f docker-compose.dd.yml down" -ForegroundColor Magenta
Write-Host "📚 To view logs: docker-compose -f docker-compose.dd.yml logs -f [service_name]" -ForegroundColor Magenta
