# Fixing Docker Installation Error

## Error: "Unpacking failed: WriteEntryTo or OpenEntryStream can only be called once"

This error usually happens when:
1. The Docker installer file is corrupted
2. Antivirus is interfering
3. Windows Defender is blocking it
4. Previous Docker installation remnants exist

---

## Solution 1: Clean Installation (Try This First)

### Step 1: Clean Up Previous Installation
```powershell
# Run PowerShell as Administrator
# Remove Docker Desktop (if partially installed)
wmic product where name="Docker Desktop" call uninstall

# Clean up folders
Remove-Item -Path "$env:ProgramFiles\Docker" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue
```

### Step 2: Disable Antivirus Temporarily
- Disable Windows Defender or your antivirus
- Disable real-time protection

### Step 3: Download Fresh Installer
- Delete the current installer
- Re-download from: https://www.docker.com/products/docker-desktop/
- Download to a simple path like `C:\Temp\DockerInstaller.exe`

### Step 4: Install as Administrator
- Right-click the installer
- Choose "Run as Administrator"
- Accept all defaults

### Step 5: Re-enable Antivirus
- Turn protection back on after installation completes

---

## Solution 2: Alternative - Run Without Docker (Faster!)

If Docker continues to fail, we can run the backend directly on Windows with PostgreSQL and Redis installed natively. This is actually **simpler and faster** for development!

### Install PostgreSQL (5 minutes)
1. Download: https://www.postgresql.org/download/windows/
2. Run the installer (accept defaults)
3. **Remember the password** you set for postgres user
4. Port: 5432 (default)

### Install Redis (2 minutes)
1. Download: https://github.com/tporadowski/redis/releases
2. Download `Redis-x64-5.0.14.1.zip`
3. Extract to `C:\Redis`
4. Open Command Prompt and run:
   ```
   cd C:\Redis
   redis-server.exe
   ```

### Start Backend (Without Docker)
I will automatically configure and start:
1. PostgreSQL database
2. Redis server
3. Backend API server (Node.js)
4. Worker process
5. Frontend dev server

---

## Which Should You Choose?

**Option A: Keep trying Docker** (if you want containerization)
- Good for: Production deployments
- Time: 15-30 minutes with troubleshooting

**Option B: Direct installation** (if you want to start NOW)
- Good for: Development, testing
- Time: 5-10 minutes
- Easier to debug issues

---

## Let Me Know:

1. **Try Docker again** after cleanup? (I'll wait)
2. **Go with PostgreSQL + Redis directly?** (Faster, I can set up immediately)
3. **Different approach?**
