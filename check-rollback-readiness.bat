@echo off
REM Quick Rollback Readiness Check
REM Verifies that rollback capabilities are properly configured

echo ==========================================
echo Rollback Readiness Check
echo ==========================================
echo.

setlocal enabledelayedexpansion
set READY_COUNT=0
set TOTAL_CHECKS=8

echo [INFO] Checking rollback readiness...
echo.

REM Check 1: PostgreSQL Service
echo 1. PostgreSQL Service Status:
sc query postgresql-x64-14 | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo   ✅ PostgreSQL is running
    set /a READY_COUNT+=1
) else (
    echo   ❌ PostgreSQL is not running
    echo      Start with: net start postgresql-x64-14
)

REM Check 2: WAL Archiving (if PostgreSQL is running)
echo.
echo 2. WAL Archiving Configuration:
sc query postgresql-x64-14 | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    psql -U postgres -c "SHOW archive_mode;" 2>nul | find "on" >nul
    if !ERRORLEVEL! EQU 0 (
        echo   ✅ WAL archiving is enabled
        set /a READY_COUNT+=1
    ) else (
        echo   ❌ WAL archiving is disabled
        echo      Run: configure-postgresql.bat
    )
) else (
    echo   ⚠️  Cannot check - PostgreSQL not running
)

REM Check 3: WAL Archive Directory
echo.
echo 3. WAL Archive Directory:
if exist "C:\PostgreSQL\wal_archives\" (
    echo   ✅ WAL archive directory exists
    set /a READY_COUNT+=1
) else (
    echo   ❌ WAL archive directory missing
    echo      Run: configure-postgresql.bat
)

REM Check 4: Backup Directory
echo.
echo 4. Backup Directory:
if exist "C:\PostgreSQL\backups\" (
    echo   ✅ Backup directory exists
    set /a READY_COUNT+=1
) else (
    echo   ❌ Backup directory missing
    echo      Run: configure-postgresql.bat
)

REM Check 5: Recovery Script
echo.
echo 5. Recovery Script:
if exist "point-in-time-recovery.bat" (
    echo   ✅ Recovery script available
    set /a READY_COUNT+=1
) else (
    echo   ❌ Recovery script missing
    echo      Download from setup package
)

REM Check 6: Backup Script
echo.
echo 6. Backup Scripts:
if exist "automated-backup.bat" (
    echo   ✅ Backup scripts available
    set /a READY_COUNT+=1
) else (
    echo   ❌ Backup scripts missing
    echo      Download from setup package
)

REM Check 7: Scheduled Task
echo.
echo 7. Scheduled Backup Task:
schtasks /query /tn "n8n_PostgreSQL_Daily_Backup" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ Backup task is scheduled
    set /a READY_COUNT+=1
) else (
    echo   ⚠️  Backup task not scheduled
    echo      Run: setup-backup-schedule.bat
)

REM Check 8: Recent Backups
echo.
echo 8. Recent Backups:
if exist "C:\PostgreSQL\backups\" (
    dir /b "C:\PostgreSQL\backups\n8n_auto_backup_*" 2>nul | find "n8n_auto_backup" >nul
    if !ERRORLEVEL! EQU 0 (
        echo   ✅ Backups found
        set /a READY_COUNT+=1
    ) else (
        echo   ⚠️  No recent backups found
        echo      Run: manual-backup.bat
    )
) else (
    echo   ❌ Cannot check - backup directory missing
)

echo.
echo ==========================================
echo Rollback Readiness Summary
echo ==========================================
echo.

set /a READY_PERCENT=(%READY_COUNT%*100)/%TOTAL_CHECKS%

echo Readiness Score: %READY_COUNT%/%TOTAL_CHECKS% (%READY_PERCENT%%)
echo.

if %READY_COUNT% GEQ 6 (
    echo 🎉 ROLLBACK READY!
    echo.
    echo ✅ Your system can perform rollbacks
    echo ✅ Point-in-Time Recovery is available
    echo ✅ Emergency recovery procedures are in place
    echo.
    echo 🚨 Emergency Rollback Command:
    echo    point-in-time-recovery.bat
    echo.
) else if %READY_COUNT% GEQ 4 (
    echo ⚠️  PARTIALLY READY
    echo.
    echo Your system has basic rollback capabilities but needs improvements.
    echo Address the missing items above for full protection.
    echo.
) else (
    echo ❌ NOT READY
    echo.
    echo Your system needs significant setup before rollback is available.
    echo Run the setup scripts to enable rollback capabilities.
    echo.
)

echo 📋 Quick Setup Commands:
echo    configure-postgresql.bat     # Enable PITR
echo    setup-backup-schedule.bat    # Schedule backups
echo    manual-backup.bat            # Take first backup
echo    security-hardening.bat       # Apply security
echo.

echo 🧪 Testing Commands:
echo    verify-rollback-capabilities.bat   # Full test
echo    demo-rollback-capabilities.bat     # Quick demo
echo    test-complete-system.bat           # System test
echo.

pause

endlocal
