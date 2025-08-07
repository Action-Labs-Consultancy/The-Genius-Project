# Plane Local Setup Verification Script

Write-Host "🔍 Verifying Plane Local Setup..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "1. Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker not found or not running" -ForegroundColor Red
    Write-Host "   💡 Please install Docker Desktop for Windows" -ForegroundColor Cyan
    exit 1
}

# Check if setup directory exists
Write-Host "2. Checking setup files..." -ForegroundColor Yellow
if (Test-Path "plane-local-setup") {
    Write-Host "   ✅ Setup directory exists" -ForegroundColor Green
    
    $requiredFiles = @("docker-compose.yml", ".env", "setup-plane.ps1")
    foreach ($file in $requiredFiles) {
        if (Test-Path "plane-local-setup\$file") {
            Write-Host "   ✅ $file found" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $file missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ Setup directory not found" -ForegroundColor Red
    Write-Host "   💡 Run the setup commands first" -ForegroundColor Cyan
}

# Check if services are running
Write-Host "3. Checking services..." -ForegroundColor Yellow
Set-Location "plane-local-setup" -ErrorAction SilentlyContinue

try {
    $services = docker-compose ps --format json | ConvertFrom-Json
    if ($services) {
        foreach ($service in $services) {
            $status = if ($service.State -eq "running") { "✅" } else { "❌" }
            Write-Host "   $status $($service.Service): $($service.State)" -ForegroundColor $(if ($service.State -eq "running") { "Green" } else { "Red" })
        }
    } else {
        Write-Host "   ❌ No services running" -ForegroundColor Red
        Write-Host "   💡 Run: docker-compose up -d" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Could not check service status" -ForegroundColor Red
    Write-Host "   💡 Make sure you're in the plane-local-setup directory" -ForegroundColor Cyan
}

# Test URLs
Write-Host "4. Testing URLs..." -ForegroundColor Yellow
$urls = @(
    @{url="http://localhost:3001"; name="Plane Frontend"},
    @{url="http://localhost:8000/api/health/"; name="Plane API"},
    @{url="http://localhost:5678"; name="n8n Automation"},
    @{url="http://localhost:3000"; name="Your Main App"}
)

foreach ($urlTest in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $urlTest.url -Method Head -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✅ $($urlTest.name): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $($urlTest.name): Not accessible" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan

if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "   1. Run setup: powershell -ExecutionPolicy Bypass -File setup-plane.ps1" -ForegroundColor White
} else {
    $runningServices = docker-compose ps --services --filter status=running 2>$null
    if (-not $runningServices) {
        Write-Host "   1. Start services: docker-compose up -d" -ForegroundColor White
    } else {
        Write-Host "   1. Open Plane: http://localhost:3001" -ForegroundColor White
        Write-Host "   2. Login: admin@plane.local / admin123" -ForegroundColor White
        Write-Host "   3. Test dashboard integration at: http://localhost:3000" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Setup Guide: plane-local-setup\SETUP_GUIDE.md" -ForegroundColor White
Write-Host "   - Integration Options: plane-local-setup\INTEGRATION_OPTIONS.md" -ForegroundColor White
Write-Host "   - Management Commands: plane-local-setup\management-commands.ps1" -ForegroundColor White
