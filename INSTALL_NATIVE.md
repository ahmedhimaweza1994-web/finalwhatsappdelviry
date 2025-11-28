# Native Installation Guide - PostgreSQL & Redis

## Step 1: Install PostgreSQL (5 minutes)

### Download and Install
1. **Go to**: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. **Download**: PostgreSQL 16.x for Windows x86-64
3. **Run the installer** (pgAdmin will be included)

### Installation Settings
When the installer asks:

| Setting | Value | Notes |
|---------|-------|-------|
| **Installation Directory** | `C:\Program Files\PostgreSQL\16` | (default is fine) |
| **Components** | Select ALL | PostgreSQL Server, pgAdmin 4, Command Line Tools, Stack Builder |
| **Data Directory** | `C:\Program Files\PostgreSQL\16\data` | (default is fine) |
| **Password** | Choose a strong password | ⚠️ **REMEMBER THIS!** You'll need it! |
| **Port** | `5432` | (default - don't change) |
| **Locale** | Default locale | (default is fine) |

### After Installation
- ✅ PostgreSQL service should start automatically
- ✅ You can skip Stack Builder at the end

---

## Step 2: Install Redis (2 minutes)

### Download
1. **Go to**: https://github.com/tporadowski/redis/releases
2. **Download**: `Redis-x64-5.0.14.1.zip` (or latest version)
3. **Extract** the ZIP to `C:\Redis`

### Start Redis
Open Command Prompt and run:
```cmd
cd C:\Redis
redis-server.exe
```

Keep this window open - Redis needs to stay running!

You should see:
```
[PID] Server started, Redis version 5.0.14.1
[PID] Ready to accept connections
```

---

## Step 3: Tell Me When Ready!

Once you've completed both installations, let me know:

1. ✅ PostgreSQL installed?
2. ✅ Redis running?
3. 🔑 What password did you set for PostgreSQL?

**I will then automatically:**
- Configure the database connection
- Create the database and tables
- Start the backend API server
- Start the background worker
- Start the frontend
- Open the app in your browser!

---

## Verification Commands

If you want to verify the installations:

**PostgreSQL:**
```cmd
psql --version
```
Should show: `psql (PostgreSQL) 16.x`

**Redis:**
Just check if the redis-server window shows "Ready to accept connections"

---

## Common Issues

### PostgreSQL port already in use?
- Check if another instance is running
- Try port 5433 instead (tell me if you change it)

### Redis won't start?
- Close any existing Redis windows
- Run as Administrator

---

**Ready? Let me know when both are installed!** 🚀
