@echo off
echo ============================================
echo ChatVault Web - Starting Application
echo ============================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env and set:
    echo   - JWT_SECRET ^(random 32+ characters^)
    echo   - DB_PASSWORD ^(strong password^)
    echo.
    echo Press any key after editing .env...
    pause > nul
)

echo.
echo Starting Docker Compose...
echo This will start:
echo   - PostgreSQL database
echo   - Redis cache
echo   - Backend API server
echo   - Background worker
echo   - Frontend React app
echo   - Nginx reverse proxy
echo.

docker-compose up -d

echo.
echo ============================================
echo Application started successfully!
echo ============================================
echo.
echo Access URLs:
echo   Frontend: http://localhost
echo   Backend API: http://localhost:3001
echo.
echo Default login (CHANGE PASSWORD):
echo   Email: admin@chatvault.local
echo   Password: admin123
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
