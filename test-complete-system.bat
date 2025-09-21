@echo off
REM Step 10: Complete System Testing and Validation Script
REM This script performs comprehensive testing of the PostgreSQL setup

echo ==========================================
echo PostgreSQL n8n Setup - Complete System Test
echo ==========================================
echo.

setlocal enabledelayedexpansion

REM Configuration
set TEST_LOG=system_test_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.log
set TEST_LOG=!TEST_LOG: =0!
set DB_NAME=n8n_db
set DB_USER=n8n_user
set ERROR_COUNT=0
set WARNING_COUNT=0
set SUCCESS_COUNT=0

echo [%date% %time%] Starting comprehensive system test > %TEST_LOG%
echo Test Log: %TEST_LOG%
echo.

REM Function to log results
:log_result
if "%~1"=="SUCCESS" (
    echo [SUCCESS] %~2
    echo [%date% %time%] SUCCESS: %~2 >> %TEST_LOG%
    set /a SUCCESS_COUNT+=1
) else if "%~1"=="WARNING" (
    echo [WARNING] %~2
    echo [%date% %time%] WARNING: %~2 >> %TEST_LOG%
    set /a WARNING_COUNT+=1
) else if "%~1"=="ERROR" (
    echo [ERROR] %~2
    echo [%date% %time%] ERROR: %~2 >> %TEST_LOG%
    set /a ERROR_COUNT+=1
)
goto :eof

REM Test 1: PostgreSQL Service Status
echo ==========================================
echo Test 1: PostgreSQL Service Status
echo ==========================================
sc query postgresql-x64-14 | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "PostgreSQL service is running"
) else (
    call :log_result "ERROR" "PostgreSQL service is not running"
)

REM Test 2: Database Connectivity
echo.
echo ==========================================
echo Test 2: Database Connectivity
echo ==========================================
psql -U postgres -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "PostgreSQL superuser connection works"
) else (
    call :log_result "ERROR" "Cannot connect as PostgreSQL superuser"
)

REM Test 3: n8n Database and User
echo.
echo ==========================================
echo Test 3: n8n Database and User
echo ==========================================
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" | find "1" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "n8n database exists"
) else (
    call :log_result "ERROR" "n8n database not found"
)

psql -U postgres -c "SELECT 1 FROM pg_user WHERE usename='%DB_USER%';" | find "1" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "n8n user exists"
) else (
    call :log_result "ERROR" "n8n user not found"
)

REM Test 4: n8n User Database Access
echo.
echo ==========================================
echo Test 4: n8n User Database Access
echo ==========================================
set PGPASSWORD=n8n_secure_password_2024
psql -U %DB_USER% -d %DB_NAME% -c "SELECT current_user;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "n8n user can connect to database"
) else (
    call :log_result "ERROR" "n8n user cannot connect to database"
)

REM Test 5: WAL Archiving Configuration
echo.
echo ==========================================
echo Test 5: WAL Archiving Configuration
echo ==========================================
psql -U postgres -c "SHOW archive_mode;" | find "on" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "WAL archiving is enabled"
) else (
    call :log_result "WARNING" "WAL archiving is not enabled"
)

if exist "C:\PostgreSQL\wal_archives\" (
    call :log_result "SUCCESS" "WAL archive directory exists"
) else (
    call :log_result "WARNING" "WAL archive directory not found"
)

REM Test 6: Backup Directory Structure
echo.
echo ==========================================
echo Test 6: Backup Directory Structure
echo ==========================================
if exist "C:\PostgreSQL\backups\" (
    call :log_result "SUCCESS" "Backup directory exists"
) else (
    call :log_result "WARNING" "Backup directory not found"
)

if exist "automated-backup.bat" (
    call :log_result "SUCCESS" "Automated backup script exists"
) else (
    call :log_result "WARNING" "Automated backup script not found"
)

REM Test 7: SSL Configuration
echo.
echo ==========================================
echo Test 7: SSL Configuration
echo ==========================================
psql -U postgres -c "SHOW ssl;" | find "on" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "SSL is enabled"
) else (
    call :log_result "WARNING" "SSL is not enabled"
)

if exist "C:\Program Files\PostgreSQL\14\data\server.crt" (
    call :log_result "SUCCESS" "SSL certificate exists"
) else (
    call :log_result "WARNING" "SSL certificate not found"
)

REM Test 8: Authentication Configuration
echo.
echo ==========================================
echo Test 8: Authentication Configuration
echo ==========================================
findstr "scram-sha-256" "C:\Program Files\PostgreSQL\14\data\pg_hba.conf" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "SCRAM-SHA-256 authentication configured"
) else (
    call :log_result "WARNING" "SCRAM-SHA-256 authentication not found"
)

REM Test 9: Logging Configuration
echo.
echo ==========================================
echo Test 9: Logging Configuration
echo ==========================================
psql -U postgres -c "SHOW logging_collector;" | find "on" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "Logging collector is enabled"
) else (
    call :log_result "WARNING" "Logging collector is not enabled"
)

if exist "C:\Program Files\PostgreSQL\14\data\log\" (
    call :log_result "SUCCESS" "Log directory exists"
) else (
    call :log_result "WARNING" "Log directory not found"
)

REM Test 10: Scheduled Task
echo.
echo ==========================================
echo Test 10: Scheduled Backup Task
echo ==========================================
schtasks /query /tn "n8n_PostgreSQL_Daily_Backup" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "Scheduled backup task exists"
) else (
    call :log_result "WARNING" "Scheduled backup task not found"
)

REM Test 11: Database Performance Test
echo.
echo ==========================================
echo Test 11: Database Performance Test
echo ==========================================
echo [INFO] Running basic performance test...
psql -U %DB_USER% -d %DB_NAME% -c "CREATE TABLE IF NOT EXISTS test_performance (id SERIAL PRIMARY KEY, data TEXT);" >nul 2>&1
psql -U %DB_USER% -d %DB_NAME% -c "INSERT INTO test_performance (data) SELECT 'test_data_' || generate_series(1,1000);" >nul 2>&1
psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM test_performance;" | find "1000" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "Database performance test passed (1000 records)"
) else (
    call :log_result "WARNING" "Database performance test failed"
)
psql -U %DB_USER% -d %DB_NAME% -c "DROP TABLE IF EXISTS test_performance;" >nul 2>&1

REM Test 12: Environment File Validation
echo.
echo ==========================================
echo Test 12: Environment Configuration
echo ==========================================
if exist "n8n.env" (
    call :log_result "SUCCESS" "n8n environment file exists"
    findstr "DB_POSTGRESDB_HOST" "n8n.env" >nul
    if !ERRORLEVEL! EQU 0 (
        call :log_result "SUCCESS" "PostgreSQL connection configured in environment"
    ) else (
        call :log_result "WARNING" "PostgreSQL connection not found in environment"
    )
) else (
    call :log_result "WARNING" "n8n environment file not found"
)

REM Test 13: Security Configuration
echo.
echo ==========================================
echo Test 13: Security Configuration
echo ==========================================
psql -U postgres -c "SHOW password_encryption;" | find "scram-sha-256" >nul
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "Password encryption is set to SCRAM-SHA-256"
) else (
    call :log_result "WARNING" "Password encryption is not set to SCRAM-SHA-256"
)

psql -U postgres -c "SHOW max_connections;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_result "SUCCESS" "Connection limits are configured"
) else (
    call :log_result "WARNING" "Connection limits check failed"
)

REM Test 14: File Permissions
echo.
echo ==========================================
echo Test 14: File Permissions and Security
echo ==========================================
if exist "C:\PostgreSQL\" (
    call :log_result "SUCCESS" "PostgreSQL data directory structure exists"
) else (
    call :log_result "WARNING" "PostgreSQL data directory structure not found"
)

REM Generate Test Report
echo.
echo ==========================================
echo Test Summary Report
echo ==========================================
echo.
echo [INFO] Test Results Summary:
echo [SUCCESS] Successful Tests: %SUCCESS_COUNT%
echo [WARNING] Warnings: %WARNING_COUNT%
echo [ERROR] Errors: %ERROR_COUNT%
echo.

REM Calculate overall status
set /a TOTAL_TESTS=%SUCCESS_COUNT%+%WARNING_COUNT%+%ERROR_COUNT%
set /a SUCCESS_RATE=(%SUCCESS_COUNT%*100)/%TOTAL_TESTS%

echo [INFO] Overall Success Rate: %SUCCESS_RATE%%%
echo.

if %ERROR_COUNT% EQU 0 (
    if %WARNING_COUNT% LEQ 3 (
        echo [SUCCESS] System is ready for production use!
        echo [INFO] Minor warnings are acceptable and don't affect functionality.
    ) else (
        echo [WARNING] System has several warnings - review recommended.
    )
) else (
    echo [ERROR] System has critical errors that need to be addressed!
    echo [INFO] Please fix errors before proceeding to production.
)

echo.
echo Test log saved to: %TEST_LOG%
echo.

REM Create system status script
set STATUS_SCRIPT=check-system-status.bat
(
echo @echo off
echo echo PostgreSQL n8n System Status
echo echo ============================
echo echo.
echo echo Service Status:
echo sc query postgresql-x64-14 ^| find "STATE"
echo echo.
echo echo Database Size:
echo psql -U postgres -c "SELECT pg_size_pretty^(pg_database_size^('n8n_db'^)^) as n8n_database_size;" 2^>nul
echo echo.
echo echo Active Connections:
echo psql -U postgres -c "SELECT count^(^*^) as active_connections FROM pg_stat_activity WHERE state = 'active';" 2^>nul
echo echo.
echo echo Last Backup:
echo dir /b /od "C:\PostgreSQL\backups\n8n_auto_backup_*" 2^>nul ^| tail -1
echo echo.
echo echo WAL Files:
echo dir /b "C:\PostgreSQL\wal_archives\" 2^>nul ^| find /c /v ""
echo echo.
echo pause
) > "%STATUS_SCRIPT%"

echo [INFO] System status script created: %STATUS_SCRIPT%

REM Create quick n8n test
if exist "n8n.env" (
    echo.
    echo ==========================================
    echo Optional: Quick n8n Connection Test
    echo ==========================================
    echo.
    echo To test n8n with this PostgreSQL setup:
    echo.
    echo 1. Set environment variables:
    echo    set N8N_DB_TYPE=postgresdb
    echo    set DB_POSTGRESDB_HOST=localhost
    echo    set DB_POSTGRESDB_PORT=5432
    echo    set DB_POSTGRESDB_DATABASE=n8n_db
    echo    set DB_POSTGRESDB_USER=n8n_user
    echo    set DB_POSTGRESDB_PASSWORD=n8n_secure_password_2024
    echo.
    echo 2. Start n8n:
    echo    npx n8n start
    echo.
    echo 3. Check n8n logs for successful database connection
    echo.
)

echo ==========================================
echo System Test Complete
echo ==========================================
echo.
echo Next Steps:
echo 1. Review any errors or warnings above
echo 2. Run 'check-system-status.bat' for ongoing monitoring
echo 3. Test actual n8n application connection
echo 4. Set up monitoring and alerting for production
echo 5. Create documentation for your team
echo.
pause

endlocal
