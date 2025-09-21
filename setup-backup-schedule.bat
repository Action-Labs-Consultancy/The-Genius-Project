@echo off
REM Step 8: Schedule Automated Backups using Windows Task Scheduler
REM This script creates a scheduled task for daily backups

echo ==========================================
echo Windows Task Scheduler Setup for n8n Backups
echo ==========================================
echo.

REM Configuration
set TASK_NAME=n8n_PostgreSQL_Daily_Backup
set SCRIPT_PATH=%~dp0automated-backup.bat
set SCHEDULE_TIME=02:00
set SCHEDULE_USER=SYSTEM

echo [INFO] Setting up automated backup schedule...
echo Task Name: %TASK_NAME%
echo Script Path: %SCRIPT_PATH%
echo Schedule: Daily at %SCHEDULE_TIME%
echo Run As: %SCHEDULE_USER%
echo.

REM Check if script exists
if not exist "%SCRIPT_PATH%" (
    echo [ERROR] Backup script not found at: %SCRIPT_PATH%
    echo Please ensure automated-backup.bat exists in the same directory.
    pause
    exit /b 1
)

REM Delete existing task if it exists
echo [INFO] Removing existing task (if any)...
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

REM Create the scheduled task
echo [INFO] Creating scheduled task...
schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "\"%SCRIPT_PATH%\"" ^
    /sc daily ^
    /st %SCHEDULE_TIME% ^
    /ru %SCHEDULE_USER% ^
    /rl highest ^
    /f

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Scheduled task created successfully!
    echo.
    echo Task Details:
    echo - Name: %TASK_NAME%
    echo - Runs: Daily at %SCHEDULE_TIME%
    echo - User: %SCHEDULE_USER%
    echo - Priority: Highest
    echo.
) else (
    echo [ERROR] Failed to create scheduled task!
    echo You may need to run this script as Administrator.
    pause
    exit /b 1
)

REM Verify the task
echo [INFO] Verifying task creation...
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Task verification passed!
    echo.
    echo To view task details, run:
    echo schtasks /query /tn "%TASK_NAME%" /fo LIST /v
    echo.
    echo To test the task manually, run:
    echo schtasks /run /tn "%TASK_NAME%"
    echo.
) else (
    echo [WARNING] Task verification failed!
)

REM Create a test/manual run script
set TEST_SCRIPT=%~dp0run-backup-now.bat
echo @echo off > "%TEST_SCRIPT%"
echo echo Running backup task manually... >> "%TEST_SCRIPT%"
echo schtasks /run /tn "%TASK_NAME%" >> "%TEST_SCRIPT%"
echo echo. >> "%TEST_SCRIPT%"
echo echo Task started. Check backup logs for progress. >> "%TEST_SCRIPT%"
echo pause >> "%TEST_SCRIPT%"

echo [INFO] Created manual test script: run-backup-now.bat
echo.

REM Additional configuration options
echo ==========================================
echo Additional Configuration Options
echo ==========================================
echo.
echo 1. To change backup schedule:
echo    schtasks /change /tn "%TASK_NAME%" /st NEW_TIME
echo.
echo 2. To disable the task:
echo    schtasks /change /tn "%TASK_NAME%" /disable
echo.
echo 3. To enable the task:
echo    schtasks /change /tn "%TASK_NAME%" /enable
echo.
echo 4. To delete the task:
echo    schtasks /delete /tn "%TASK_NAME%" /f
echo.
echo 5. To view task logs:
echo    Check Windows Event Viewer ^> Task Scheduler
echo.

pause
