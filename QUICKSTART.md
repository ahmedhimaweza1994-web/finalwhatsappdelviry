# ChatVault Web - Quick Start Guide

## 🚀 Running with Docker Compose (Recommended)

### Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM available
- 20GB disk space

### Steps

1. **Configure Environment**
   ```bash
   # Edit .env.example and save as .env
   # IMPORTANT: Change these values:
   # - JWT_SECRET (minimum 32 random characters)
   # - DB_PASSWORD (strong password)
   ```

2. **Start All Services**
   ```bash
   docker-compose up -d
   ```

3. **Access the Application**
   - Frontend: http://localhost (port 80)
   - Backend API: http://localhost:3001
   
4. **Default Credentials** (CHANGE IMMEDIATELY)
   - Email: admin@chatvault.local
   - Password: admin123

---

## 💻 Running Locally (Development)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Redis installed and running

### Backend Setup

```bash
cd backend

# Install dependencies (already done)
npm install

# Configure environment
# Create .env file with these settings:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatvault
DB_USER=chatvault
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_32_char_secret
PORT=3001
UPLOADS_DIR=C:/Users/mohan/whatsapp viewr/uploads
MEDIA_DIR=C:/Users/mohan/whatsapp viewr/media

# Run database migrations
cmd /c "node scripts/migrate.js"

# Start backend server
cmd /c "npm run dev"

# In another terminal, start worker
cmd /c "npm run worker"
```

### Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Start development server
cmd /c "npm run dev"
```

### Access
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 🔧 Available Ports

The application uses these ports by default:

- **5173** - Frontend development server (Vite)
- **3001** - Backend API server
- **5432** - PostgreSQL database
- **6379** - Redis

If any ports are in use, you can change them in:
- Frontend: `vite.config.js` (port 5173)
- Backend: `.env` file (PORT=3001)

---

## 📝 Quick Test

1. **Register a new account**
   - Go to http://localhost:5173
   - Click "Sign up"
   - Enter email and password

2. **Upload a WhatsApp chat**
   - Click the upload button (⬆️)
   - Select your WhatsApp ZIP export
   - Wait for processing (progress bar shows status)

3. **View your chat**
   - Chat appears in the left sidebar
   - Click to view messages
   - All media should display correctly

---

## 🆘 Troubleshooting

### PowerShell Execution Policy Error
If you get "running scripts is disabled", use `cmd /c` prefix:
```bash
cmd /c "npm run dev"
```

### Port Already in Use
Check and kill processes using ports:
```bash
# Check port 5173
cmd /c "netstat -ano | findstr :5173"

# Kill process (replace PID)
cmd /c "taskkill /PID <PID> /F"
```

### Database Connection Failed
1. Ensure PostgreSQL is running
2. Check credentials in `.env`
3. Run migrations: `cmd /c "node scripts/migrate.js"`

### Redis Connection Failed
1. Install Redis for Windows: https://github.com/microsoftarchive/redis/releases
2. Start Redis: `redis-server`

---

## 🎯 Next Steps

- Change default admin password
- Upload your first WhatsApp chat
- Explore the WhatsApp Web-style interface
- Try dark mode toggle
- Test media playback (images, videos, audio)

**Enjoy your self-hosted WhatsApp chat viewer!** 🎉
