# Complete Setup Guide - ChatVault Web

## Step 1: Install Docker Desktop (5-10 minutes)

1. **Download Docker Desktop for Windows**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Run the installer (Docker Desktop Installer.exe)
   - Follow the installation wizard (accept defaults)
   - **Restart your computer** when prompted

2. **Verify Docker is Running**
   - After restart, Docker Desktop should auto-start
   - Look for the Docker whale icon in your system tray (bottom-right)
   - Wait until it says "Docker Desktop is running"

3. **Test Docker Installation**
   Open PowerShell or Command Prompt and run:
   ```bash
   docker --version
   ```
   You should see something like: `Docker version 24.x.x`

---

## Step 2: Start ChatVault (Automatic)

Once Docker is installed, I will automatically run these commands for you:

```bash
cd "c:\Users\mohan\whatsapp viewr"
docker-compose up -d
```

This will:
- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Start Backend API server
- ✅ Start Background worker
- ✅ Start Frontend React app
- ✅ Start Nginx reverse proxy
- ✅ Run database migrations

---

## Step 3: Access the Application

After docker-compose finishes (2-3 minutes for first run):

**URL**: http://localhost

**Default Login:**
- Email: `admin@chatvault.local`
- Password: `admin123`

---

## Quick Commands Reference

**View logs:**
```bash
docker-compose logs -f
```

**Stop all services:**
```bash
docker-compose down
```

**Restart services:**
```bash
docker-compose restart
```

**View running containers:**
```bash
docker-compose ps
```

---

## What to Do Next

1. **Install Docker Desktop** (link above)
2. **Restart your computer**
3. **Wait for Docker to start**
4. **Let me know when Docker is ready** - I will automatically start the app

---

## Expected Timeline

- Docker Desktop download: 2-3 minutes
- Docker Desktop install: 3-5 minutes
- Computer restart: 2-3 minutes
- Docker startup: 1-2 minutes
- First app launch: 2-3 minutes
- **Total: ~15 minutes**

After the first run, starting the app takes only 10-20 seconds!
