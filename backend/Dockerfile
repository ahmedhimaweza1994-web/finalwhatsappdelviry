FROM node:20-alpine

# Install ffmpeg and build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache ffmpeg python3 make g++ py3-setuptools

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
CMD ["sh", "-c", "node scripts/migrate.js && npm start"]
