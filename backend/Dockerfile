FROM node:18-alpine

# Install ffmpeg for video thumbnails (optional)
RUN apk add --no-cache ffmpeg

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
