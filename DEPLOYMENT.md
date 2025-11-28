# ChatVault Deployment Guide

## Status
The code is currently being pushed to GitHub. **Please wait for the push to complete** before running commands on the VPS.

## VPS Deployment Steps

1. **Connect to your VPS**
   ```bash
   ssh root@72.62.33.7
   # Password: Mohaned2013@
   ```

2. **Run the Setup Script**
   Copy and paste this entire block into your VPS terminal:

   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt-get install -y docker-compose-plugin
   rm get-docker.sh

   # Setup Directory
   mkdir -p /opt/chatvault
   cd /opt/chatvault

   # Clone Repository (Enter your GitHub credentials if asked)
   git clone https://github.com/ahmedhimaweza1994-web/finalwhatsappdelviry.git .

   # Create Environment File
   cat > .env << 'EOF'
   DB_HOST=postgres
   DB_PORT=5432
   DB_NAME=chatvault
   DB_USER=chatvault
   DB_PASSWORD=Mohaned2013@
   REDIS_HOST=redis
   REDIS_PORT=6379
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=$(openssl rand -hex 32)
   JWT_EXPIRY=7d
   FRONTEND_URL=http://72.62.33.7
   VITE_API_URL=/api
   UPLOADS_DIR=/var/www/chatvault/uploads
   MEDIA_DIR=/var/www/chatvault/media
   MAX_UPLOAD_SIZE=524288000
   EOF

   # Start Application
   docker compose up -d --build
   ```

3. **Access the Application**
   - URL: http://72.62.33.7
   - Login: `admin@chatvault.local` / `admin123`
