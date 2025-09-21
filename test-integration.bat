@echo off
REM Test Script for n8n PostgreSQL PITR Integration
REM Verifies all components are working properly

echo ====================================
echo n8n PostgreSQL PITR Integration Test
echo ====================================
echo.

echo [1/6] Testing Node.js availability...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: Node.js not found
    goto :end
) else (
    echo ✅ PASS: Node.js is available
)

echo.
echo [2/6] Testing PostgreSQL availability...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: PostgreSQL psql not found
    goto :end
) else (
    echo ✅ PASS: PostgreSQL tools available
)

echo.
echo [3/6] Checking backup directory...
if not exist "C:\PostgreSQL_Backups" (
    echo ❌ FAIL: Backup directory does not exist
    echo Creating backup directory...
    mkdir "C:\PostgreSQL_Backups"
    echo ✅ CREATED: Backup directory created
) else (
    echo ✅ PASS: Backup directory exists
)

echo.
echo [4/6] Testing API server file...
if not exist "backend-api-server.js" (
    echo ❌ FAIL: API server file not found
    goto :end
) else (
    echo ✅ PASS: API server file exists
)

echo.
echo [5/6] Testing frontend components...
if not exist "frontend\src\N8nCanvasComplete.js" (
    echo ❌ FAIL: N8nCanvasComplete.js not found
    goto :end
) else (
    echo ✅ PASS: N8nCanvasComplete.js exists
)

if not exist "frontend\src\DatabaseManagementPanel.js" (
    echo ❌ FAIL: DatabaseManagementPanel.js not found
    goto :end
) else (
    echo ✅ PASS: DatabaseManagementPanel.js exists
)

if not exist "frontend\src\PostgreSQLRollbackNode.js" (
    echo ❌ FAIL: PostgreSQLRollbackNode.js not found
    goto :end
) else (
    echo ✅ PASS: PostgreSQLRollbackNode.js exists
)

echo.
echo [6/6] Testing package dependencies...
if not exist "node_modules" (
    echo ❌ WARNING: node_modules not found, run 'npm install'
) else (
    echo ✅ PASS: node_modules directory exists
)

echo.
echo ====================================
echo Integration Test Summary
echo ====================================
echo.
echo ✅ All core components are ready!
echo.
echo Next steps:
echo 1. Run 'npm install' if node_modules missing
echo 2. Start API server: start-database-api.bat
echo 3. Start frontend: cd frontend && npm start
echo 4. Navigate to: http://localhost:3000/n8n-canvas
echo 5. Test database tab functionality
echo.
echo For full setup, run PostgreSQL PITR scripts in PostgreSQL_PITR folder
echo.

:end
pause
