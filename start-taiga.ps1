# Quick Taiga Setup - Manual Steps
# Follow these steps to get Taiga running locally

Write-Host "🚀 Taiga Project Management Setup Guide" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Start Docker Desktop" -ForegroundColor Yellow
Write-Host "- Open Docker Desktop application" -ForegroundColor White
Write-Host "- Wait for it to fully start (Docker icon in system tray shows 'Docker Desktop is running')" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Run Taiga Setup" -ForegroundColor Yellow
Write-Host "Once Docker Desktop is running, execute these commands:" -ForegroundColor White
Write-Host ""
Write-Host "cd c:\Users\PC\The-Genius-Project" -ForegroundColor Cyan
Write-Host "docker-compose -f docker-compose.taiga.yml pull" -ForegroundColor Cyan
Write-Host "docker-compose -f docker-compose.taiga.yml up -d" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 3: Initialize Database (after containers are running)" -ForegroundColor Yellow
Write-Host "docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py migrate" -ForegroundColor Cyan
Write-Host "docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_user" -ForegroundColor Cyan
Write-Host "docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_project_templates" -ForegroundColor Cyan
Write-Host "docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py collectstatic --noinput" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 4: Access Taiga" -ForegroundColor Yellow
Write-Host "🌐 Frontend: http://localhost:9000" -ForegroundColor Green
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Green
Write-Host ""

Write-Host "Default Login:" -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: 123123" -ForegroundColor White
Write-Host ""

Write-Host "Management Commands:" -ForegroundColor Yellow
Write-Host "Stop: docker-compose -f docker-compose.taiga.yml down" -ForegroundColor Cyan
Write-Host "Logs: docker-compose -f docker-compose.taiga.yml logs" -ForegroundColor Cyan
Write-Host "Status: docker-compose -f docker-compose.taiga.yml ps" -ForegroundColor Cyan
Write-Host ""

# Try to start Docker Desktop
Write-Host "Attempting to start Docker Desktop..." -ForegroundColor Yellow
try {
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
    Write-Host "✅ Docker Desktop start initiated" -ForegroundColor Green
    Write-Host "⏳ Please wait 30-60 seconds for Docker to fully start..." -ForegroundColor Yellow
} catch {
    Write-Host "⚠️  Could not auto-start Docker Desktop. Please start it manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key once Docker Desktop is running to continue with setup..." -ForegroundColor Magenta
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
