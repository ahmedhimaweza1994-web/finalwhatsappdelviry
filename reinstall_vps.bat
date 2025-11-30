@echo off
setlocal

set PLINK="C:\Program Files\PuTTY\plink.exe"
set SERVER=root@72.62.33.7
set PASSWORD=Mohaned2013@

echo ========================================
echo ChatVault VPS Re-Installation
echo ========================================
echo.

REM Step 0: Accept Host Key
echo Step 0: Accepting Host Key...
echo y | %PLINK% -ssh %SERVER% -pw "%PASSWORD%" "exit"

REM Step 1: Clean up old installation
echo Step 1: Cleaning up old installation...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "rm -rf /opt/chatvault && mkdir -p /opt/chatvault"

REM Step 2: Clone from GitHub
echo.
echo Step 2: Cloning from GitHub...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "cd /opt/chatvault && git clone https://github.com/ahmedhimaweza1994-web/finalwhatsappdelviry.git ."

REM Step 3: Create .env file
echo.
echo Step 3: Configuring environment...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "cd /opt/chatvault && echo DB_HOST=postgres>.env && echo DB_PORT=5432>>.env && echo DB_NAME=chatvault>>.env && echo DB_USER=chatvault>>.env && echo DB_PASSWORD=Mohaned2013@>>.env && echo REDIS_HOST=redis>>.env && echo REDIS_PORT=6379>>.env && echo PORT=3001>>.env && echo NODE_ENV=production>>.env && echo JWT_SECRET=secret123>>.env && echo JWT_EXPIRY=7d>>.env && echo FRONTEND_URL=http://72.62.33.7>>.env && echo VITE_API_URL=/api>>.env && echo UPLOADS_DIR=/var/www/chatvault/uploads>>.env && echo MEDIA_DIR=/var/www/chatvault/media>>.env && echo MAX_UPLOAD_SIZE=524288000>>.env"

REM Step 4: Start Application
echo.
echo Step 4: Starting application...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "cd /opt/chatvault && docker compose down && docker compose up -d --build"

echo.
echo ========================================
echo Re-Installation Complete!
echo Access at: http://72.62.33.7
echo ========================================
pause
