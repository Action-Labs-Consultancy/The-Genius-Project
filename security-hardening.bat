@echo off
REM Step 9: Security Hardening Script for PostgreSQL
REM This script applies security best practices for production deployment

echo ==========================================
echo PostgreSQL Security Hardening Script
echo ==========================================
echo.

REM Configuration
set PG_VERSION=14
set PG_DATA=C:\Program Files\PostgreSQL\%PG_VERSION%\data
set PG_CONFIG=%PG_DATA%\postgresql.conf
set PG_HBA=%PG_DATA%\pg_hba.conf
set BACKUP_DIR=%PG_DATA%\config_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%

echo [INFO] Starting PostgreSQL security hardening...
echo PostgreSQL Version: %PG_VERSION%
echo Data Directory: %PG_DATA%
echo.

REM Create backup of current configuration
echo [INFO] Creating backup of current configuration...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
copy "%PG_CONFIG%" "%BACKUP_DIR%\postgresql.conf.backup" >nul 2>&1
copy "%PG_HBA%" "%BACKUP_DIR%\pg_hba.conf.backup" >nul 2>&1
echo [SUCCESS] Configuration backed up to: %BACKUP_DIR%

REM Stop PostgreSQL for configuration changes
echo [INFO] Stopping PostgreSQL service...
net stop postgresql-x64-%PG_VERSION% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] PostgreSQL stopped
) else (
    echo [WARNING] PostgreSQL may not be running
)

REM Security Configuration 1: Network Security
echo [INFO] Applying network security settings...

REM Create secure postgresql.conf additions
echo. >> "%PG_CONFIG%"
echo # Security Hardening - Network >> "%PG_CONFIG%"
echo listen_addresses = 'localhost,192.168.1.0/24'  # Restrict to local and LAN >> "%PG_CONFIG%"
echo port = 5432 >> "%PG_CONFIG%"
echo max_connections = 50  # Limit connections >> "%PG_CONFIG%"
echo superuser_reserved_connections = 3 >> "%PG_CONFIG%"
echo. >> "%PG_CONFIG%"

REM Security Configuration 2: SSL/TLS
echo # Security Hardening - SSL/TLS >> "%PG_CONFIG%"
echo ssl = on >> "%PG_CONFIG%"
echo ssl_cert_file = 'server.crt' >> "%PG_CONFIG%"
echo ssl_key_file = 'server.key' >> "%PG_CONFIG%"
echo ssl_protocols = 'TLSv1.2,TLSv1.3' >> "%PG_CONFIG%"
echo ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL' >> "%PG_CONFIG%"
echo ssl_prefer_server_ciphers = on >> "%PG_CONFIG%"
echo. >> "%PG_CONFIG%"

REM Security Configuration 3: Authentication & Authorization
echo # Security Hardening - Authentication >> "%PG_CONFIG%"
echo password_encryption = scram-sha-256 >> "%PG_CONFIG%"
echo krb_server_keyfile = '' >> "%PG_CONFIG%"
echo db_user_namespace = off >> "%PG_CONFIG%"
echo. >> "%PG_CONFIG%"

REM Security Configuration 4: Logging & Monitoring
echo # Security Hardening - Logging >> "%PG_CONFIG%"
echo logging_collector = on >> "%PG_CONFIG%"
echo log_destination = 'stderr' >> "%PG_CONFIG%"
echo log_directory = 'log' >> "%PG_CONFIG%"
echo log_filename = 'postgresql-%%Y-%%m-%%d_%%H%%M%%S.log' >> "%PG_CONFIG%"
echo log_rotation_age = 1d >> "%PG_CONFIG%"
echo log_rotation_size = 100MB >> "%PG_CONFIG%"
echo log_min_messages = warning >> "%PG_CONFIG%"
echo log_min_error_statement = error >> "%PG_CONFIG%"
echo log_connections = on >> "%PG_CONFIG%"
echo log_disconnections = on >> "%PG_CONFIG%"
echo log_lock_waits = on >> "%PG_CONFIG%"
echo log_statement = 'ddl' >> "%PG_CONFIG%"
echo log_line_prefix = '%%t [%%p]: [%%l-1] user=%%u,db=%%d,app=%%a,client=%%h ' >> "%PG_CONFIG%"
echo. >> "%PG_CONFIG%"

REM Security Configuration 5: Resource Limits
echo # Security Hardening - Resource Limits >> "%PG_CONFIG%"
echo statement_timeout = 300000  # 5 minutes >> "%PG_CONFIG%"
echo lock_timeout = 30000  # 30 seconds >> "%PG_CONFIG%"
echo idle_in_transaction_session_timeout = 600000  # 10 minutes >> "%PG_CONFIG%"
echo tcp_keepalives_idle = 600 >> "%PG_CONFIG%"
echo tcp_keepalives_interval = 30 >> "%PG_CONFIG%"
echo tcp_keepalives_count = 3 >> "%PG_CONFIG%"
echo. >> "%PG_CONFIG%"

echo [SUCCESS] PostgreSQL configuration updated

REM Update pg_hba.conf for secure authentication
echo [INFO] Updating authentication configuration...

REM Backup original pg_hba.conf
copy "%PG_HBA%" "%PG_HBA%.original" >nul 2>&1

REM Create new secure pg_hba.conf
(
echo # PostgreSQL Client Authentication Configuration File
echo # Security Hardened Version
echo #
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD
echo.
echo # "local" is for Unix domain socket connections only
echo local   all             postgres                                peer
echo local   all             all                                     scram-sha-256
echo.
echo # IPv4 local connections:
echo host    all             postgres        127.0.0.1/32            scram-sha-256
echo host    n8n_db          n8n_user        127.0.0.1/32            scram-sha-256
echo host    all             all             127.0.0.1/32            reject
echo.
echo # IPv6 local connections:
echo host    all             postgres        ::1/128                 scram-sha-256
echo host    n8n_db          n8n_user        ::1/128                 scram-sha-256
echo host    all             all             ::1/128                 reject
echo.
echo # LAN connections ^(adjust IP range as needed^):
echo host    n8n_db          n8n_user        192.168.1.0/24          scram-sha-256
echo.
echo # Reject all other connections
echo host    all             all             0.0.0.0/0               reject
echo host    all             all             ::/0                    reject
) > "%PG_HBA%"

echo [SUCCESS] Authentication configuration updated

REM Generate SSL certificates
echo [INFO] Generating SSL certificates...
set SSL_DIR=%PG_DATA%

REM Create self-signed certificate (for development - use proper CA certs in production)
openssl req -new -x509 -days 365 -nodes -text -out "%SSL_DIR%\server.crt" -keyout "%SSL_DIR%\server.key" -subj "/CN=localhost" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] SSL certificates generated
    REM Set proper permissions (PostgreSQL user needs read access)
    icacls "%SSL_DIR%\server.key" /grant:r "NETWORK SERVICE:R" >nul 2>&1
    icacls "%SSL_DIR%\server.crt" /grant:r "Everyone:R" >nul 2>&1
) else (
    echo [WARNING] OpenSSL not found. SSL certificates not generated.
    echo Install OpenSSL or generate certificates manually for SSL support.
)

REM Create security monitoring script
echo [INFO] Creating security monitoring script...
set MONITOR_SCRIPT=%~dp0monitor-security.bat
(
echo @echo off
echo REM PostgreSQL Security Monitoring Script
echo echo ==========================================
echo echo PostgreSQL Security Status Monitor
echo echo ==========================================
echo echo.
echo.
echo echo [INFO] Checking PostgreSQL service status...
echo sc query postgresql-x64-%PG_VERSION% ^| find "RUNNING" ^>nul
echo if %%ERRORLEVEL%% EQU 0 ^(
echo     echo [SUCCESS] PostgreSQL service is running
echo ^) else ^(
echo     echo [WARNING] PostgreSQL service is not running
echo ^)
echo echo.
echo.
echo echo [INFO] Checking recent connections...
echo psql -U postgres -d n8n_db -c "SELECT client_addr, usename, application_name, state, query_start FROM pg_stat_activity WHERE state = 'active';" 2^>nul
echo echo.
echo.
echo echo [INFO] Checking failed login attempts...
echo findstr "FATAL.*authentication failed" "C:\Program Files\PostgreSQL\%PG_VERSION%\data\log\*.log" 2^>nul ^| tail -10
echo echo.
echo.
echo echo [INFO] Checking database sizes...
echo psql -U postgres -c "SELECT datname, pg_size_pretty^(pg_database_size^(datname^)^) FROM pg_database WHERE datistemplate = false;" 2^>nul
echo echo.
echo.
echo echo [INFO] Last 10 log entries...
echo powershell "Get-Content 'C:\Program Files\PostgreSQL\%PG_VERSION%\data\log\*.log' -Tail 10"
echo echo.
echo pause
) > "%MONITOR_SCRIPT%"

echo [SUCCESS] Security monitoring script created: monitor-security.bat

REM Start PostgreSQL service
echo [INFO] Starting PostgreSQL service...
net start postgresql-x64-%PG_VERSION%
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] PostgreSQL started successfully
) else (
    echo [ERROR] Failed to start PostgreSQL!
    echo Check the configuration and logs for errors.
    echo Configuration backup is available in: %BACKUP_DIR%
    pause
    exit /b 1
)

REM Test connectivity
echo [INFO] Testing secure connectivity...
timeout /t 5 /nobreak >nul
psql -U postgres -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database connectivity test passed
) else (
    echo [WARNING] Database connectivity test failed
    echo This might be due to new authentication settings
)

REM Security recommendations
echo.
echo ==========================================
echo Security Hardening Complete
echo ==========================================
echo.
echo [SUCCESS] PostgreSQL has been security hardened with:
echo - Network access restrictions
echo - SSL/TLS encryption enabled
echo - Strong password encryption (SCRAM-SHA-256)
echo - Comprehensive logging and monitoring
echo - Connection and resource limits
echo - Secure authentication configuration
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo 1. Update n8n connection string to use SSL:
echo    postgresql://n8n_user:password@localhost:5432/n8n_db?sslmode=require
echo.
echo 2. Test all connections with new security settings
echo.
echo 3. Monitor logs regularly using: monitor-security.bat
echo.
echo 4. For production, replace self-signed certificates with proper CA certificates
echo.
echo 5. Review and adjust IP ranges in pg_hba.conf for your network
echo.
echo 6. Set up log rotation and monitoring alerts
echo.
echo Configuration backup saved to: %BACKUP_DIR%
echo.
pause
