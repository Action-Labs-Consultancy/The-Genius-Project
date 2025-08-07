# Start n8n automation platform with authentication
Write-Host "🚀 Starting n8n automation platform..." -ForegroundColor Green

# Set environment variables for n8n
$env:N8N_BASIC_AUTH_ACTIVE = "true"
$env:N8N_BASIC_AUTH_USER = "admin"
$env:N8N_BASIC_AUTH_PASSWORD = "securepassword"
$env:N8N_HOST = "localhost"
$env:N8N_PORT = "5678"
$env:N8N_RUNNERS_ENABLED = "true"

# Check if n8n is already running
$n8nRunning = netstat -an | findstr ":5678"
if ($n8nRunning) {
    Write-Host "⚡ n8n is already running on http://localhost:5678" -ForegroundColor Green
} else {
    # Start n8n in background
    Start-Process -FilePath "npx" -ArgumentList "n8n" -WindowStyle Hidden
    Write-Host "⚡ n8n started on http://localhost:5678" -ForegroundColor Green
}

Write-Host "   Login: admin / securepassword" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Ready! Use the sidebar buttons to access:" -ForegroundColor Green
Write-Host "   🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   ⚡ n8n Automation: http://localhost:5678" -ForegroundColor Cyan
Write-Host "   📋 Plane Projects: https://app.plane.so" -ForegroundColor Cyan
