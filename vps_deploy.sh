#!/bin/bash
set -e

echo "🚀 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install -y docker-compose-plugin
rm -f get-docker.sh

echo "📦 Cloning repository..."
cd /opt
rm -rf finalwhatsappdelviry
git clone https://github.com/ahmedhimaweza1994-web/finalwhatsappdelviry.git
cd finalwhatsappdelviry

echo "📝 Creating .env file..."
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

echo "🚀 Starting application..."
docker compose up -d --build

echo ""
echo "✅ Deployment complete!"
echo "Access at: http://72.62.33.7"
