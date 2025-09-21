# Due Diligence Frontend Launcher
# This script starts the frontend on port 2345 and the backend API server

Write-Host "🚀 Starting Due Diligence System..." -ForegroundColor Yellow

# Start the backend API server
Write-Host "📡 Starting backend API server on port 10000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd 'c:\Users\PC\The-Genius-Project'; node backend-api-server.js" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start the frontend on port 2345
Write-Host "🌐 Starting frontend on port 2345..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd 'c:\Users\PC\The-Genius-Project\frontend'; npm run start:2345" -WindowStyle Normal

# Wait a moment
Start-Sleep -Seconds 2

Write-Host "✅ Due Diligence System is starting up!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Frontend: http://localhost:2345" -ForegroundColor Yellow
Write-Host "📡 Backend API: http://localhost:10000" -ForegroundColor Yellow
Write-Host ""
Write-Host "To access the Due Diligence Generator:" -ForegroundColor White
Write-Host "1. Open http://localhost:2345 in your browser" -ForegroundColor White
Write-Host "2. Login to the system" -ForegroundColor White
Write-Host "3. Click on 'Due Diligence Generator' in the dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Features:" -ForegroundColor Cyan
Write-Host "✨ 20 section due diligence report generation" -ForegroundColor White
Write-Host "✨ Section context learning (later sections learn from previous ones)" -ForegroundColor White
Write-Host "✨ Real-time progress tracking" -ForegroundColor White
Write-Host "✨ Professional HTML content generation" -ForegroundColor White
Write-Host "✨ AI-powered content creation via Ollama (if available)" -ForegroundColor White

Read-Host "Press Enter to continue..."
