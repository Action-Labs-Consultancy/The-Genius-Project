@echo off
REM Step 7: Point-in-Time Recovery Script
REM This script helps restore your n8n database to any point in time

setlocal enabledelayedexpansion

echo ==========================================
echo PostgreSQL Point-in-Time Recovery Script
echo ==========================================
echo.

REM Configuration
set BACKUP_DIR=C:\PostgreSQL\backups
set WAL_ARCHIVE_DIR=C:\PostgreSQL\wal_archives
set RECOVERY_DIR=C:\PostgreSQL\recovery
set LOG_FILE=%RECOVERY_DIR%\recovery.log
set DB_NAME=n8n_db

REM Get current timestamp for recovery directory
set DATE_TIME=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set DATE_TIME=!DATE_TIME: =0!

echo [INFO] Recovery session: %DATE_TIME%
echo.

REM Create recovery directory
if not exist "%RECOVERY_DIR%" mkdir "%RECOVERY_DIR%"
if not exist "%RECOVERY_DIR%\%DATE_TIME%" mkdir "%RECOVERY_DIR%\%DATE_TIME%"

set CURRENT_RECOVERY_DIR=%RECOVERY_DIR%\%DATE_TIME%

echo [%date% %time%] Starting Point-in-Time Recovery > %LOG_FILE%
echo Recovery directory: %CURRENT_RECOVERY_DIR% >> %LOG_FILE%

REM Step 1: Show available backups
echo Available backups:
echo ------------------
dir /b "%BACKUP_DIR%\n8n_auto_backup_*" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No backups found in %BACKUP_DIR%
    echo Please ensure you have created backups before attempting recovery.
    pause
    exit /b 1
)

echo.
set /p BACKUP_CHOICE="Enter the backup name to restore from (without .zip extension): "

if not exist "%BACKUP_DIR%\%BACKUP_CHOICE%.zip" (
    echo ERROR: Backup file %BACKUP_CHOICE%.zip not found!
    pause
    exit /b 1
)

REM Step 2: Get target recovery time
echo.
echo Point-in-Time Recovery Options:
echo 1. Recover to latest available point
echo 2. Recover to specific date/time
echo 3. Recover to just before a specific transaction
echo.
set /p RECOVERY_TYPE="Choose recovery type (1-3): "

set RECOVERY_TARGET=
if "%RECOVERY_TYPE%"=="1" (
    set RECOVERY_TARGET=latest
) else if "%RECOVERY_TYPE%"=="2" (
    echo.
    echo Enter target recovery time in format: YYYY-MM-DD HH:MM:SS
    echo Example: 2024-01-15 14:30:00
    set /p RECOVERY_TIME="Target time: "
    set RECOVERY_TARGET=time '!RECOVERY_TIME!'
) else if "%RECOVERY_TYPE%"=="3" (
    echo.
    set /p RECOVERY_XID="Enter transaction ID to recover to (just before): "
    set RECOVERY_TARGET=xid '!RECOVERY_XID!'
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo [%date% %time%] Recovery type: %RECOVERY_TYPE% >> %LOG_FILE%
echo [%date% %time%] Recovery target: %RECOVERY_TARGET% >> %LOG_FILE%

REM Step 3: Stop PostgreSQL service
echo.
echo [INFO] Stopping PostgreSQL service...
net stop postgresql-x64-14 > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] PostgreSQL service stopped successfully >> %LOG_FILE%
    echo [SUCCESS] PostgreSQL stopped
) else (
    echo [%date% %time%] Warning: Could not stop PostgreSQL service >> %LOG_FILE%
    echo [WARNING] PostgreSQL may not be running or service name differs
)

REM Step 4: Backup current data directory
echo [INFO] Backing up current data directory...
set DATA_DIR=C:\Program Files\PostgreSQL\14\data
if exist "%DATA_DIR%" (
    powershell Compress-Archive -Path "%DATA_DIR%\*" -DestinationPath "%CURRENT_RECOVERY_DIR%\current_data_backup.zip" -Force
    echo [%date% %time%] Current data backed up to recovery directory >> %LOG_FILE%
    echo [SUCCESS] Current data backed up
) else (
    echo [WARNING] Data directory not found at expected location
    echo [%date% %time%] Warning: Data directory not found at %DATA_DIR% >> %LOG_FILE%
)

REM Step 5: Clear data directory
echo [INFO] Clearing data directory...
if exist "%DATA_DIR%" (
    rmdir /s /q "%DATA_DIR%"
    mkdir "%DATA_DIR%"
    echo [%date% %time%] Data directory cleared >> %LOG_FILE%
    echo [SUCCESS] Data directory cleared
)

REM Step 6: Extract base backup
echo [INFO] Extracting base backup...
powershell Expand-Archive -Path "%BACKUP_DIR%\%BACKUP_CHOICE%.zip" -DestinationPath "%CURRENT_RECOVERY_DIR%\extracted" -Force
echo [%date% %time%] Base backup extracted >> %LOG_FILE%

REM Step 7: Copy base backup to data directory
echo [INFO] Restoring base backup to data directory...
xcopy "%CURRENT_RECOVERY_DIR%\extracted\*" "%DATA_DIR%\" /E /I /Y > nul
echo [%date% %time%] Base backup restored to data directory >> %LOG_FILE%
echo [SUCCESS] Base backup restored

REM Step 8: Create recovery configuration
echo [INFO] Creating recovery configuration...
(
echo restore_command = 'copy "C:\\PostgreSQL\\wal_archives\\%%f" "%%p"'
echo recovery_target_action = promote
if not "%RECOVERY_TARGET%"=="latest" (
    echo recovery_target_%RECOVERY_TARGET%
)
echo recovery_end_command = 'echo Recovery completed at %%r'
) > "%DATA_DIR%\recovery.conf"

echo [%date% %time%] Recovery configuration created >> %LOG_FILE%
echo [SUCCESS] Recovery configuration created

REM Step 9: Start PostgreSQL service
echo [INFO] Starting PostgreSQL service...
net start postgresql-x64-14
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] PostgreSQL service started successfully >> %LOG_FILE%
    echo [SUCCESS] PostgreSQL started
    echo [INFO] Recovery process initiated. Monitor PostgreSQL logs for completion.
) else (
    echo [%date% %time%] ERROR: Failed to start PostgreSQL service >> %LOG_FILE%
    echo [ERROR] Failed to start PostgreSQL! Check logs and configuration.
    echo [INFO] You may need to manually start the service and check logs.
)

REM Step 10: Monitor recovery
echo.
echo [INFO] Recovery initiated. Monitoring status...
timeout /t 10 /nobreak > nul

REM Check if recovery completed by looking for recovery.conf removal
set RETRY_COUNT=0
:check_recovery
if exist "%DATA_DIR%\recovery.conf" (
    if %RETRY_COUNT% LSS 30 (
        echo [INFO] Recovery in progress... ^(%RETRY_COUNT%/30^)
        timeout /t 5 /nobreak > nul
        set /a RETRY_COUNT+=1
        goto check_recovery
    ) else (
        echo [WARNING] Recovery taking longer than expected. Check PostgreSQL logs.
    )
) else (
    echo [SUCCESS] Recovery completed! PostgreSQL has been promoted to normal operation.
    echo [%date% %time%] Recovery completed successfully >> %LOG_FILE%
)

REM Step 11: Verify database connectivity
echo [INFO] Verifying database connectivity...
psql -U postgres -d %DB_NAME% -c "SELECT current_timestamp;" > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database is accessible and responding
    echo [%date% %time%] Database connectivity verified >> %LOG_FILE%
) else (
    echo [WARNING] Could not connect to database. Manual verification needed.
    echo [%date% %time%] Warning: Database connectivity test failed >> %LOG_FILE%
)

echo.
echo ==========================================
echo Point-in-Time Recovery Process Complete
echo ==========================================
echo.
echo Recovery logs saved to: %LOG_FILE%
echo Recovery files saved to: %CURRENT_RECOVERY_DIR%
echo.
echo IMPORTANT: 
echo - Verify your data integrity before resuming operations
echo - Update your n8n configuration if needed
echo - Consider taking a fresh backup after verification
echo.
pause

endlocal
