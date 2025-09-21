@echo off
REM EMERGENCY ROLLBACK BUTTON
REM Double-click for instant rollback access

title EMERGENCY ROLLBACK
color 4F

echo.
echo  ================================
echo         EMERGENCY ROLLBACK
echo  ================================
echo.
echo  [INFO] Launching emergency rollback interface...
echo.

REM Launch emergency rollback GUI
powershell -ExecutionPolicy Bypass -File "Emergency-Rollback-Button.ps1"

echo.
echo  [INFO] Emergency interface closed.
pause
