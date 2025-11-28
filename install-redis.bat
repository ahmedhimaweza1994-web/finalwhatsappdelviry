@echo off
echo ============================================
echo Installing Redis for Windows
echo ============================================
echo.

REM Create directory
if not exist "C:\Redis" mkdir "C:\Redis"

echo Downloading Redis...
curl -L https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip -o C:\Redis\redis.zip

echo Extracting Redis...
powershell -command "Expand-Archive -Path 'C:\Redis\redis.zip' -DestinationPath 'C:\Redis' -Force"

echo Starting Redis Server...
start "Redis Server" cmd /k "cd C:\Redis && redis-server.exe"

echo.
echo ============================================
echo Redis installed and started!
echo ============================================
echo.
echo Redis is now running on port 6379
echo Keep the Redis window open!
echo.
pause
