@echo off
title AI Due Diligence System - Startup

echo ================================================================
echo 🚀 AI DUE DILIGENCE SYSTEM - STARTUP
echo ================================================================
echo.

echo 🧹 Cleaning up any existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM n8n.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo 📋 Starting services in correct order...
echo.

echo 1️⃣ Starting Ollama (if not running)...
ollama serve >nul 2>&1 &

echo 2️⃣ Starting PDF Converter Service...
start "PDF Converter" /min cmd /c "cd /d %~dp0 && node services/pdf-converter.js"
timeout /t 3 >nul

echo 3️⃣ Starting Kanboard (Docker)...
docker-compose up -d kanboard >nul 2>&1

echo 4️⃣ Starting n8n...
start "n8n Service" /min cmd /c "set N8N_BASIC_AUTH_ACTIVE=true && set N8N_BASIC_AUTH_USER=admin && set N8N_BASIC_AUTH_PASSWORD=GlassDoor2025! && npx n8n"
timeout /t 5 >nul

echo 5️⃣ Starting Rollback System...
start "Rollback System" /min cmd /c "cd /d %~dp0kanboard-rollback-system && node fixed-rollback-server.js"
timeout /t 3 >nul

echo.
echo ⏳ Waiting for services to initialize...
timeout /t 10 >nul

echo.
echo 🧪 Testing service connections...
echo.

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5678' -TimeoutSec 5 | Out-Null; Write-Host '✅ n8n: RUNNING' -ForegroundColor Green } catch { Write-Host '❌ n8n: DOWN' -ForegroundColor Red }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000' -TimeoutSec 5 | Out-Null; Write-Host '✅ Kanboard: RUNNING' -ForegroundColor Green } catch { Write-Host '❌ Kanboard: DOWN' -ForegroundColor Red }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 5 | Out-Null; Write-Host '✅ Rollback System: RUNNING' -ForegroundColor Green } catch { Write-Host '❌ Rollback System: DOWN' -ForegroundColor Red }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000/health' -TimeoutSec 5 | Out-Null; Write-Host '✅ PDF Converter: RUNNING' -ForegroundColor Green } catch { Write-Host '❌ PDF Converter: DOWN' -ForegroundColor Red }"

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -TimeoutSec 5 | Out-Null; Write-Host '✅ Ollama: RUNNING' -ForegroundColor Green } catch { Write-Host '❌ Ollama: DOWN' -ForegroundColor Red }"

echo.
echo ================================================================
echo 🎯 AI DUE DILIGENCE SYSTEM - READY
echo ================================================================
echo 📊 Dashboard: http://localhost:3001
echo 🔧 n8n Editor: http://localhost:5678 (admin / GlassDoor2025!)
echo 📋 Kanboard: http://localhost:8000 (admin / admin)
echo 📄 PDF Service: http://localhost:3000
echo 🤖 Ollama: http://localhost:11434
echo ================================================================
echo.

pause
