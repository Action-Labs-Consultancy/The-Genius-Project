@echo off
cls
echo.
echo ========================================
echo   TAIGA PROJECT MANAGEMENT SETUP
echo ========================================
echo.

echo Step 1: Starting Docker Desktop...
echo.

REM Try to start Docker Desktop
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo Docker Desktop is starting...
echo Please wait 30-60 seconds for Docker to fully initialize.
echo.

echo Step 2: Waiting for Docker to be ready...
echo.

:WAIT_DOCKER
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not ready yet... waiting 10 seconds
    timeout /t 10 /nobreak >nul
    goto WAIT_DOCKER
)

echo ✓ Docker is now running!
echo.

echo Step 3: Setting up Taiga containers...
echo.

REM Pull Taiga images
echo Pulling Taiga images...
docker-compose -f docker-compose.taiga.yml pull

REM Start Taiga stack
echo Starting Taiga stack...
docker-compose -f docker-compose.taiga.yml up -d

echo.
echo Waiting 60 seconds for containers to initialize...
timeout /t 60 /nobreak

echo.
echo Step 4: Initializing database...
echo.

REM Initialize database
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py migrate --run-syncdb
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_user
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py loaddata initial_project_templates  
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py collectstatic --noinput

echo.
echo ========================================
echo   TAIGA SETUP COMPLETE!
echo ========================================
echo.
echo Frontend URL: http://localhost:9000
echo Backend API:  http://localhost:8000
echo.
echo Default Login:
echo Username: admin
echo Password: 123123
echo.
echo Management Commands:
echo   Stop:   docker-compose -f docker-compose.taiga.yml down
echo   Logs:   docker-compose -f docker-compose.taiga.yml logs
echo   Status: docker-compose -f docker-compose.taiga.yml ps
echo.

echo Opening Taiga in your browser...
start http://localhost:9000

echo.
pause
