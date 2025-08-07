# Taiga Local Setup Script for Windows PowerShell
# Run this script to set up Taiga project management tool locally

Write-Host "🚀 Setting up Taiga Project Management Tool locally..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if ports are available
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

$ports = @(9000, 8000, 5432, 6379, 8888)
$portsInUse = @()

foreach ($port in $ports) {
    if (Test-Port -Port $port) {
        Write-Host "⚠️  Port $port is in use" -ForegroundColor Yellow
        $portsInUse += $port
    } else {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "❌ The following ports are in use: $($portsInUse -join ', ')" -ForegroundColor Red
    Write-Host "Please stop the services using these ports or modify docker-compose.taiga.yml" -ForegroundColor Yellow
    Read-Host "Press Enter to continue anyway or Ctrl+C to cancel"
}

# Pull latest images
Write-Host "📥 Pulling latest Taiga Docker images..." -ForegroundColor Cyan
docker-compose -f docker-compose.taiga.yml pull

# Start the stack
Write-Host "🏗️  Starting Taiga stack..." -ForegroundColor Cyan
docker-compose -f docker-compose.taiga.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.taiga.yml ps

# Wait for database to be ready
Write-Host "⏳ Waiting for database initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Initialize database and create admin user
Write-Host "💾 Initializing database..." -ForegroundColor Cyan
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py migrate --run-syncdb
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_user
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_project_templates
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py compilemessages
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py collectstatic --noinput

Write-Host ""
Write-Host "🎉 Taiga setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access Information:" -ForegroundColor Cyan
Write-Host "🌐 Taiga Frontend: http://localhost:9000" -ForegroundColor White
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "📡 WebSocket Events: ws://localhost:8888" -ForegroundColor White
Write-Host ""
Write-Host "👤 Default Login Credentials:" -ForegroundColor Cyan
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: 123123" -ForegroundColor White
Write-Host ""
Write-Host "📚 Management Commands:" -ForegroundColor Cyan
Write-Host "Stop Taiga:" -ForegroundColor Yellow -NoNewline
Write-Host " docker-compose -f docker-compose.taiga.yml down" -ForegroundColor White
Write-Host "View Logs:" -ForegroundColor Yellow -NoNewline  
Write-Host " docker-compose -f docker-compose.taiga.yml logs" -ForegroundColor White
Write-Host "Restart:" -ForegroundColor Yellow -NoNewline
Write-Host " docker-compose -f docker-compose.taiga.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To customize Taiga, edit the docker-compose.taiga.yml file" -ForegroundColor Magenta

# Open browser automatically
Write-Host "🌐 Opening Taiga in your default browser..." -ForegroundColor Green
Start-Process "http://localhost:9000"
