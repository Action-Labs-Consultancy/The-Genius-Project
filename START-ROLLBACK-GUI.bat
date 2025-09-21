@echo off
REM Simple Rollback GUI Launcher
REM Double-click this file to open the rollback manager

title PostgreSQL Rollback Manager
color 2F

echo.
echo  ================================
echo    PostgreSQL Rollback Manager
echo  ================================
echo.
echo  [INFO] Starting GUI application...
echo.

powershell -ExecutionPolicy Bypass -File "Simple-Rollback-GUI.ps1"

echo.
echo  [INFO] GUI application closed.
pause
