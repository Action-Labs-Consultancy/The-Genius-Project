@echo off
REM Step 4b: Apply PostgreSQL Configuration Changes
REM Run as Administrator

echo Applying PostgreSQL PITR configuration...

REM Create required directories
if not exist "C:\PostgreSQL\wal_archives" mkdir "C:\PostgreSQL\wal_archives"
if not exist "C:\PostgreSQL\backups" mkdir "C:\PostgreSQL\backups"
if not exist "C:\PostgreSQL\logs" mkdir "C:\PostgreSQL\logs"

REM Set proper permissions for postgres user
icacls "C:\PostgreSQL" /grant "Network Service:(OI)(CI)F" /T
icacls "C:\PostgreSQL" /grant "postgres:(OI)(CI)F" /T

echo.
echo Now you need to manually edit the PostgreSQL configuration:
echo.
echo 1. Open: C:\Program Files\PostgreSQL\15\data\postgresql.conf
echo 2. Add the configuration from postgresql-config.txt
echo 3. Save the file
echo 4. Restart PostgreSQL service
echo.

REM Restart PostgreSQL service
echo Restarting PostgreSQL service...
net stop postgresql-x64-15
timeout /t 5
net start postgresql-x64-15

echo.
echo Configuration applied! PostgreSQL should now be ready for PITR.
echo WAL archives will be stored in: C:\PostgreSQL\wal_archives
echo Backups will be stored in: C:\PostgreSQL\backups
echo Logs will be stored in: C:\PostgreSQL\logs

pause
