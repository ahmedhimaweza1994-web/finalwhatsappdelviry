FROM node:20-alpine

# Install ffmpeg, unzip, and build dependencies for native modules (better-sqlite3)
# Also install gdown for reliable Google Drive downloads
RUN apk add --no-cache ffmpeg unzip python3 make g++ py3-setuptools curl py3-pip && \
    pip3 install gdown --break-system-packages

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /var/www/chatvault/uploads /var/www/chatvault/media

# Expose port
EXPOSE 3001

# Run migrations on startup, then start server
CMD ["sh", "-c", "node setup-db.js && npm start"]
