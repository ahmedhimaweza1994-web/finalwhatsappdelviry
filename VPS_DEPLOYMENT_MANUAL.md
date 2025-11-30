# Quick VPS Deployment Guide

## Step 1: Connect to VPS
Open PuTTY or any SSH client and connect:
- Host: `72.62.33.7`
- Username: `root`
- Password: `Mohaned2013@`

## Step 2: Run These Commands

Copy and paste this entire block into your SSH terminal:

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install -y docker-compose-plugin
rm -f get-docker.sh

# Setup Application
cd /opt
rm -rf chatvault
mkdir -p chatvault
cd chatvault
git clone https://github.com/ahmedhimaweza1994-web/finalwhatsappdelviry.git .

# Create .env file
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
JWT_SECRET=chatvault_secret_key_2024
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

## Step 3: Access Your App

Once the commands complete, access your application at:

**http://72.62.33.7**

Default login:
- Email: `admin@chatvault.local`
- Password: `admin123`

## Troubleshooting

If you need to check logs:
```bash
cd /opt/chatvault
docker compose logs -f
```

To restart:
```bash
cd /opt/chatvault
docker compose restart
```
