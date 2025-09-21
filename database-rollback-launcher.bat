@echo off
echo.
echo ============================================
echo    n8n Action Rollback System
echo ============================================
echo.
echo Choose your rollback method:
echo.
echo 1. n8n Action Rollback (RECOMMENDED)
echo    - Rollback specific n8n workflow executions
echo    - Reverses individual actions (database inserts, emails, etc.)
echo    - Granular control over what gets rolled back
echo    - Safe and targeted approach
echo.
echo 2. Demo Rollback Interface (For testing)
echo    - Works without PostgreSQL CLI tools
echo    - Safe simulation environment
echo    - Visual interface with real-time feedback
echo.
echo 3. Full Database Rollback Interface  
echo    - Requires PostgreSQL installation
echo    - Entire database rollback (nuclear option)
echo    - Production-ready functionality
echo.
echo 4. Browser Integration (Userscripts)
echo    - Adds rollback to n8n/Kanboard interfaces
echo    - Requires Tampermonkey browser extension
echo    - Direct integration approach
echo.
echo 5. API Testing Interface
echo    - Test all database endpoints
echo    - Health checks and diagnostics
echo    - Developer-friendly interface
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Starting n8n Action Rollback Interface...
    echo Opening: n8n-action-rollback-interface.html
    echo API Server: http://localhost:10002
    echo.
    echo This interface allows you to:
    echo - View recent n8n workflow executions
    echo - See exactly what actions each workflow performed
    echo - Rollback specific actions (database changes, emails, etc.)
    echo - Review rollback plans before executing
    echo.
    start "" "n8n-action-rollback-interface.html"
    node n8n-action-rollback-server.js
)

if "%choice%"=="2" (
    echo.
    echo Starting Demo Rollback Interface...
    echo Opening: demo-rollback-interface.html
    echo API Server: http://localhost:10001
    echo.
    start "" "demo-rollback-interface.html"
    node demo-database-server.js
)

if "%choice%"=="3" (
    echo.
    echo Starting Full PostgreSQL Rollback Interface...
    echo Opening: rollback-interface.html  
    echo API Server: http://localhost:10000
    echo.
    start "" "rollback-interface.html"
    node backend-api-server.js
)

if "%choice%"=="4" (
    echo.
    echo Browser Integration Setup:
    echo.
    echo 1. Install Tampermonkey browser extension
    echo 2. Install userscripts:
    echo    - n8n-database-integration.user.js
    echo    - kanboard-database-integration.user.js
    echo 3. Visit n8n (localhost:5678) or Kanboard (localhost:8000)
    echo 4. Look for database management buttons
    echo.
    echo Starting API server for userscripts...
    node backend-api-server.js
)

if "%choice%"=="5" (
    echo.
    echo Starting API Testing Interface...
    echo Opening: database-integration-test.html
    echo API Server: http://localhost:10000
    echo.
    start "" "database-integration-test.html"
    node backend-api-server.js
)

pause
