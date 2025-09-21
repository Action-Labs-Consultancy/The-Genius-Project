@echo off
echo 🚀 Setting up Due Diligence Automation Stack...

REM Create necessary directories
echo 📁 Creating directories...
if not exist ".\workflows" mkdir ".\workflows"
if not exist ".\custom-nodes" mkdir ".\custom-nodes"
if not exist ".\sql" mkdir ".\sql"

REM Create workflows directory and copy workflow
echo 📋 Setting up workflows...
if exist "Enhanced_DD_MCA_Workflow_Fixed.json" (
    copy "Enhanced_DD_MCA_Workflow_Fixed.json" ".\workflows\" >nul
    echo ✅ Workflow copied to .\workflows\
)

REM Build and start services
echo 🏗️ Building Docker images...
docker-compose -f docker-compose.dd.yml build

echo 🚀 Starting services...
docker-compose -f docker-compose.dd.yml up -d

REM Wait for services to start
echo ⏳ Waiting for services to initialize...
timeout /t 30 >nul

REM Setup Ollama models
echo 🤖 Setting up AI models...
echo Pulling Mistral model...
docker exec ollama-dd ollama pull mistral:latest

echo Pulling additional model for financial analysis...
docker exec ollama-dd ollama pull deepseek-coder:1.3b-instruct

REM Check service status
echo 🔍 Checking service status...
docker-compose -f docker-compose.dd.yml ps

echo.
echo ✅ Setup complete! Your services are running:
echo.
echo 🔧 n8n:        http://localhost:5678
echo    Username:   admin
echo    Password:   changeme123
echo.
echo 📋 Kanboard:   http://localhost:8000
echo    Username:   admin
echo    Password:   admin
echo.
echo 🤖 Ollama:     http://localhost:11434
echo 📊 PostgreSQL: localhost:5432
echo 🔄 Redis:      localhost:6379
echo 📁 MinIO:      http://localhost:9001
echo.
echo 🎯 Next steps:
echo 1. Import the workflow: Enhanced_DD_MCA_Workflow_Fixed.json
echo 2. Configure Kanboard API credentials in n8n
echo 3. Set up Ollama API credentials in n8n
echo 4. Create a test Due Diligence task in Kanboard
echo.
echo 📚 To stop all services: docker-compose -f docker-compose.dd.yml down
echo 📚 To view logs: docker-compose -f docker-compose.dd.yml logs -f [service_name]

pause
