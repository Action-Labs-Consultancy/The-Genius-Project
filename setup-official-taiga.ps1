Write-Host "========================================" -ForegroundColor Green
Write-Host "  OFFICIAL TAIGA SETUP - POWERSHELL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Waiting for Docker Desktop to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts - Checking Docker..." -ForegroundColor Cyan
    
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            # Test if Docker daemon is responding
            $containerList = docker ps 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Docker is ready!" -ForegroundColor Green
                break
            }
        }
    }
    catch {
        # Continue trying
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Host "✗ Docker Desktop failed to start after $maxAttempts attempts" -ForegroundColor Red
        Write-Host "Please start Docker Desktop manually and run this script again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Start-Sleep -Seconds 10
} while ($true)

Write-Host ""
Write-Host "Step 2: Navigating to Taiga directory..." -ForegroundColor Yellow
Set-Location "C:\Users\PC\taiga-docker"

if (-not (Test-Path "C:\Users\PC\taiga-docker")) {
    Write-Host "✗ Taiga directory not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Setting up .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Cyan
    $envContent = @"
# Taiga configuration
TAIGA_SECRET_KEY=IpF6XuSxAQw5Zo1tzHsf8WUyaM2bigPB4lVv0DGjrJ3TeC7qmONLYc9dRnEhKk
TAIGA_SITES_SCHEME=http
TAIGA_SITES_DOMAIN=localhost:9000
TAIGA_SUBPATH=""
POSTGRES_USER=taiga
POSTGRES_PASSWORD=taiga
POSTGRES_DB=taiga
POSTGRES_HOST=taiga-db
RABBITMQ_USER=taiga
RABBITMQ_PASS=taiga
ENABLE_TELEMETRY=False
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Environment file created" -ForegroundColor Green
} else {
    Write-Host "Environment file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Starting Taiga containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Step 5: Waiting for containers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "Step 6: Checking container status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  TAIGA SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: http://localhost:9000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default superuser will be created on first run." -ForegroundColor Yellow
Write-Host "Check logs with: docker-compose logs taiga-back" -ForegroundColor Gray
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor White
Write-Host "  Stop:   docker-compose down" -ForegroundColor Gray
Write-Host "  Logs:   docker-compose logs" -ForegroundColor Gray
Write-Host "  Status: docker-compose ps" -ForegroundColor Gray
Write-Host ""

# Try to open browser
try {
    Start-Process "http://localhost:9000"
    Write-Host "✓ Opening Taiga in your browser..." -ForegroundColor Green
}
catch {
    Write-Host "Please manually open: http://localhost:9000" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
