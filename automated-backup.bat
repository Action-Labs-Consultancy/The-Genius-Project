@echo off
REM Step 6: Automated Daily Backup Script with Cleanup
REM This script should be scheduled to run daily

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=C:\PostgreSQL\backups
set WAL_ARCHIVE_DIR=C:\PostgreSQL\wal_archives
set LOG_FILE=%BACKUP_DIR%\automated_backup.log
set RETENTION_DAYS=7
set DB_NAME=n8n_db
set DB_USER=postgres

REM Create timestamp
set DATE_TIME=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set DATE_TIME=!DATE_TIME: =0!
set BACKUP_NAME=n8n_auto_backup_%DATE_TIME%

echo ================================== >> %LOG_FILE%
echo [%date% %time%] Starting automated backup process >> %LOG_FILE%
echo Backup name: %BACKUP_NAME% >> %LOG_FILE%

REM Create backup directory
if not exist "%BACKUP_DIR%\%BACKUP_NAME%" (
    mkdir "%BACKUP_DIR%\%BACKUP_NAME%"
    echo [%date% %time%] Created backup directory: %BACKUP_NAME% >> %LOG_FILE%
)

REM Take base backup using pg_basebackup
echo [%date% %time%] Starting pg_basebackup... >> %LOG_FILE%
pg_basebackup -D "%BACKUP_DIR%\%BACKUP_NAME%" -Ft -z -P -U %DB_USER% -v >> %LOG_FILE% 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Base backup completed successfully >> %LOG_FILE%
) else (
    echo [%date% %time%] ERROR: Base backup failed with code %ERRORLEVEL% >> %LOG_FILE%
    goto :cleanup
)

REM Also take a logical dump as additional backup
echo [%date% %time%] Creating logical dump... >> %LOG_FILE%
pg_dump -U %DB_USER% -d %DB_NAME% -f "%BACKUP_DIR%\%BACKUP_NAME%\%DB_NAME%_dump.sql" -v >> %LOG_FILE% 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Logical dump completed successfully >> %LOG_FILE%
) else (
    echo [%date% %time%] WARNING: Logical dump failed with code %ERRORLEVEL% >> %LOG_FILE%
)

REM Compress the backup
echo [%date% %time%] Compressing backup... >> %LOG_FILE%
powershell Compress-Archive -Path "%BACKUP_DIR%\%BACKUP_NAME%\*" -DestinationPath "%BACKUP_DIR%\%BACKUP_NAME%.zip" -Force
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Backup compressed successfully >> %LOG_FILE%
    rmdir /s /q "%BACKUP_DIR%\%BACKUP_NAME%"
) else (
    echo [%date% %time%] WARNING: Compression failed >> %LOG_FILE%
)

:cleanup
REM Clean up old backups (older than RETENTION_DAYS)
echo [%date% %time%] Cleaning up old backups (older than %RETENTION_DAYS% days)... >> %LOG_FILE%

REM Calculate date threshold
powershell -Command "& {$date = (Get-Date).AddDays(-%RETENTION_DAYS%); Get-ChildItem '%BACKUP_DIR%' -Directory | Where-Object {$_.Name -like 'n8n_auto_backup_*' -and $_.CreationTime -lt $date} | ForEach-Object {Write-Host 'Deleting old backup:' $_.Name; Remove-Item $_.FullName -Recurse -Force}; Get-ChildItem '%BACKUP_DIR%' -File -Filter '*.zip' | Where-Object {$_.Name -like 'n8n_auto_backup_*' -and $_.CreationTime -lt $date} | ForEach-Object {Write-Host 'Deleting old backup:' $_.Name; Remove-Item $_.FullName -Force}}" >> %LOG_FILE% 2>&1

REM Clean up old WAL files (keep last 2 days worth)
echo [%date% %time%] Cleaning up old WAL archive files... >> %LOG_FILE%
powershell -Command "& {$date = (Get-Date).AddDays(-2); Get-ChildItem '%WAL_ARCHIVE_DIR%' -File | Where-Object {$_.CreationTime -lt $date} | ForEach-Object {Write-Host 'Deleting old WAL file:' $_.Name; Remove-Item $_.FullName -Force}}" >> %LOG_FILE% 2>&1

REM Calculate backup size
for /f %%A in ('powershell -command "(Get-ChildItem '%BACKUP_DIR%' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"') do set BACKUP_SIZE=%%A

echo [%date% %time%] Backup process completed >> %LOG_FILE%
echo [%date% %time%] Total backup directory size: %BACKUP_SIZE% MB >> %LOG_FILE%
echo ================================== >> %LOG_FILE%
echo. >> %LOG_FILE%

REM Optional: Send notification (uncomment if you want email notifications)
REM powershell -Command "Send-MailMessage -From 'backup@yourserver.com' -To 'admin@yourserver.com' -Subject 'n8n Backup Completed' -Body 'Backup %BACKUP_NAME% completed successfully. Size: %BACKUP_SIZE% MB' -SmtpServer 'your-smtp-server'"

endlocal
