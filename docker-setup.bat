@echo off
REM Quick Docker Development Setup Script for Windows

echo.
echo 🐳 ICHAS Management System - Docker Setup
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo ✅ Docker found: %DOCKER_VERSION%

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
echo ✅ Docker Compose found: %COMPOSE_VERSION%
echo.

REM Create data directory
echo 📁 Creating data directory...
if not exist "data" mkdir data
echo ✅ Created: .\data
echo.

REM Build the image
echo 🔨 Building Docker image...
call docker-compose build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Build complete!
echo.

REM Start the container
echo 🚀 Starting container...
call docker-compose up -d
if errorlevel 1 (
    echo ❌ Failed to start container!
    pause
    exit /b 1
)

echo ✅ Container started!
echo.

REM Wait for container to be ready
echo ⏳ Waiting for application to be ready...
timeout /t 10 /nobreak

REM Initialize database
echo 🗄️  Initializing database...
docker-compose exec -T app npm run db:generate
docker-compose exec -T app npm run db:push

echo ✅ Database initialized!
echo.

REM Display connection info
echo.
echo ==========================================
echo ✨ SUCCESS - Application is Running!
echo ==========================================
echo.
echo 🌐 Access your application:
echo    → http://localhost:3000
echo.
echo 📊 View logs:
echo    → docker-compose logs -f
echo.
echo 🛑 Stop application:
echo    → docker-compose down
echo.
echo 📚 Deployment guide:
echo    → Read DEPLOYMENT_GUIDE.md
echo.
pause
