@echo off
REM Step 5: Manual Base Backup Script
REM Run this to take a manual backup

setlocal enabledelayedexpansion

REM Set variables
set BACKUP_DIR=C:\PostgreSQL\backups
set DATE_TIME=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set DATE_TIME=!DATE_TIME: =0!
set BACKUP_NAME=n8n_backup_%DATE_TIME%
set LOG_FILE=%BACKUP_DIR%\backup.log

echo [%date% %time%] Starting manual backup: %BACKUP_NAME% >> %LOG_FILE%

REM Create backup directory
if not exist "%BACKUP_DIR%\%BACKUP_NAME%" mkdir "%BACKUP_DIR%\%BACKUP_NAME%"

REM Take base backup
echo Taking base backup...
pg_basebackup -D "%BACKUP_DIR%\%BACKUP_NAME%" -Ft -z -P -U postgres -v -W

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Backup completed successfully: %BACKUP_NAME% >> %LOG_FILE%
    echo Backup completed successfully!
    echo Location: %BACKUP_DIR%\%BACKUP_NAME%
) else (
    echo [%date% %time%] Backup failed: %BACKUP_NAME% >> %LOG_FILE%
    echo Backup failed! Check the log file: %LOG_FILE%
)

echo.
echo Manual backup complete. Check %LOG_FILE% for details.
pause
