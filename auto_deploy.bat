@echo off
setlocal

set PLINK="C:\Program Files\PuTTY\plink.exe"
set SERVER=root@72.62.33.7
set PASSWORD=Mohaned2013@

echo ========================================
echo ChatVault VPS Deployment
echo ========================================
echo.

REM Step 1: Accept Host Key (User must type y)
echo Step 1: Connecting to VPS...
echo Please type 'y' if asked to trust the host key.
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" "echo Connection successful"
if errorlevel 1 (
    echo Connection failed. Please try running this manually:
    echo "C:\Program Files\PuTTY\plink.exe" -ssh %SERVER% -pw "%PASSWORD%"
    pause
    exit /b 1
)

REM Step 2: Install Docker
echo.
echo Step 2: Installing Docker...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && apt-get install -y docker-compose-plugin && rm get-docker.sh"

REM Step 3: Setup App
echo.
echo Step 3: Setting up application...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "mkdir -p /opt/chatvault && cd /opt/chatvault && rm -rf finalwhatsappdelviry && git clone https://github.com/ahmedhimaweza1994-web/finalwhatsappdelviry.git ."

REM Step 4: Create .env
echo.
echo Step 4: Configuring environment...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "cd /opt/chatvault && echo DB_HOST=postgres>.env && echo DB_PORT=5432>>.env && echo DB_NAME=chatvault>>.env && echo DB_USER=chatvault>>.env && echo DB_PASSWORD=Mohaned2013@>>.env && echo REDIS_HOST=redis>>.env && echo REDIS_PORT=6379>>.env && echo PORT=3001>>.env && echo NODE_ENV=production>>.env && echo JWT_SECRET=secret123>>.env && echo JWT_EXPIRY=7d>>.env && echo FRONTEND_URL=http://72.62.33.7>>.env && echo VITE_API_URL=/api>>.env && echo UPLOADS_DIR=/var/www/chatvault/uploads>>.env && echo MEDIA_DIR=/var/www/chatvault/media>>.env && echo MAX_UPLOAD_SIZE=524288000>>.env"

REM Step 5: Start App
echo.
echo Step 5: Starting application...
%PLINK% -ssh %SERVER% -pw "%PASSWORD%" -batch "cd /opt/chatvault && docker compose up -d --build"

echo.
echo ========================================
echo Deployment Complete!
echo Access at: http://72.62.33.7
echo ========================================
pause
