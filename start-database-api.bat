@echo off
REM Database Management API Server Startup Script
REM For The Genius Project n8n PostgreSQL PITR Integration
REM Start this before using the n8n interface rollback features

echo ====================================
echo Database Management API Server
echo ====================================
echo Starting backend API for n8n PostgreSQL rollback...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js first
    pause
    exit /b 1
)

REM Check if PostgreSQL is available
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL psql command not found in PATH
    echo Make sure PostgreSQL is installed and in your PATH
    echo.
)

REM Set environment variables
set API_PORT=10000
set POSTGRES_USER=postgres
set POSTGRES_PASSWORD=your_password
set POSTGRES_DB=n8n_db
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5432
set BACKUP_DIR=C:\PostgreSQL_Backups

echo Environment configured:
echo - API Port: %API_PORT%
echo - PostgreSQL: %POSTGRES_HOST%:%POSTGRES_PORT%/%POSTGRES_DB%
echo - Backup Directory: %BACKUP_DIR%
echo.

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" (
    echo Creating backup directory: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install express cors
    echo.
)

echo Starting Database Management API Server...
echo Press Ctrl+C to stop the server
echo.
echo Server will be available at: http://localhost:%API_PORT%
echo Health check: http://localhost:%API_PORT%/health
echo Database status: http://localhost:%API_PORT%/api/database/status
echo.

REM Start the server
node backend-api-server.js

pause
