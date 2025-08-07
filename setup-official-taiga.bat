@echo off
echo ========================================
echo   OFFICIAL TAIGA SETUP SCRIPT
echo ========================================

echo Step 1: Checking Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Desktop is not running or not installed!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Step 2: Navigating to Taiga directory...
cd /d "C:\Users\PC\taiga-docker"
if %errorlevel% neq 0 (
    echo Taiga directory not found! Please ensure you cloned the repository.
    pause
    exit /b 1
)

echo Step 3: Checking .env file...
if not exist .env (
    echo Creating .env file...
    echo # Taiga configuration > .env
    echo TAIGA_SECRET_KEY=IpF6XuSxAQw5Zo1tzHsf8WUyaM2bigPB4lVv0DGjrJ3TeC7qmONLYc9dRnEhKk >> .env
    echo TAIGA_SITES_SCHEME=http >> .env
    echo TAIGA_SITES_DOMAIN=localhost:9000 >> .env
    echo TAIGA_SUBPATH="" >> .env
    echo POSTGRES_USER=taiga >> .env
    echo POSTGRES_PASSWORD=taiga >> .env
    echo POSTGRES_DB=taiga >> .env
    echo POSTGRES_HOST=taiga-db >> .env
    echo RABBITMQ_USER=taiga >> .env
    echo RABBITMQ_PASS=taiga >> .env
    echo ENABLE_TELEMETRY=False >> .env
    echo.
) else (
    echo .env file already exists.
)

echo Step 4: Starting Taiga containers...
docker-compose up -d

echo Step 5: Waiting for containers to initialize...
timeout /t 60

echo Step 6: Checking container status...
docker-compose ps

echo ========================================
echo   TAIGA SETUP COMPLETE!
echo ========================================
echo.
echo Frontend URL: http://localhost:9000
echo.
echo Default superuser will be created on first run.
echo Check logs with: docker-compose logs taiga-back
echo.
echo Management Commands:
echo   Stop:   docker-compose down
echo   Logs:   docker-compose logs
echo   Status: docker-compose ps
echo.
echo Opening Taiga in your browser...
start http://localhost:9000

pause
