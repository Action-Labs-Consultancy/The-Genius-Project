@echo off
REM PostgreSQL Rollback GUI Launcher
REM Double-click this file to open the rollback manager

echo ==========================================
echo PostgreSQL Rollback Manager
echo ==========================================
echo.
echo [INFO] Starting GUI application...
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell available'" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PowerShell is not available!
    echo This application requires PowerShell to run.
    pause
    exit /b 1
)

REM Check if GUI script exists
if not exist "PostgreSQL-Rollback-GUI.ps1" (
    echo [ERROR] GUI script not found!
    echo Please ensure PostgreSQL-Rollback-GUI.ps1 is in the same directory.
    pause
    exit /b 1
)

echo [SUCCESS] Launching PostgreSQL Rollback Manager GUI...
echo.
echo 🛡️ GUI Features:
echo   - One-click emergency rollback
echo   - Quick backup operations  
echo   - System readiness checks
echo   - Complete setup automation
echo.

REM Launch the PowerShell GUI
powershell -ExecutionPolicy Bypass -File "PostgreSQL-Rollback-GUI.ps1"

echo.
echo [INFO] GUI application closed.
pause
