@echo off
echo ========================================
echo  ULTIMATE ROLLBACK CONTROL CENTER
echo  Starting Kanboard + n8n Rollback System
echo ========================================
echo.

cd /d "c:\Users\PC\The-Genius-Project\kanboard-rollback-system"

echo 📦 Installing dependencies if needed...
call npm install express axios sqlite3 --save

echo.
echo 🚀 Starting Ultimate Rollback Server...
echo 📡 Dashboard will be available at: http://localhost:3001
echo 🌐 Network access: http://0.0.0.0:3001
echo.
echo Press Ctrl+C to stop the server
echo ========================================

node ultimate-rollback-server.js

pause
