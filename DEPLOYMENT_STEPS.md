# ChatVault VPS Deployment - Step by Step Guide

## Step 1: Open PowerShell
1. Press `Windows + X`
2. Click "Windows PowerShell" or "Terminal"

## Step 2: Run These Commands (One at a Time)

### Command 1: Accept Host Key
Copy and paste this command, press Enter, then type `y` when asked:

```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh root@72.62.33.7 -pw "Mohaned2013@" "exit"
```

**What to expect:** It will ask "Store key in cache? (y/n)" - Type `y` and press Enter

---

### Command 2: Install Docker (Takes 2-3 minutes)
```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh root@72.62.33.7 -pw "Mohaned2013@" -batch "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && apt-get install -y docker-compose-plugin && rm get-docker.sh"
```

**What to expect:** You'll see installation progress. Wait until it finishes and returns to the prompt.

---

### Command 3: Clone Your App from GitHub
```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh root@72.62.33.7 -pw "Mohaned2013@" -batch "cd /opt && rm -rf chatvault && mkdir -p chatvault && cd chatvault && git clone https://github.com/ahmedhimaweza1994-web/finalwhatsappdelviry.git ."
```

**What to expect:** You'll see "Cloning into..." and download progress.

---

### Command 4: Create Configuration File
```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh root@72.62.33.7 -pw "Mohaned2013@" -batch @"
cd /opt/chatvault && cat > .env << 'EOF'
DB_HOST=postgres
DB_PORT=5432
DB_NAME=chatvault
DB_USER=chatvault
DB_PASSWORD=Mohaned2013@
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3001
NODE_ENV=production
JWT_SECRET=chatvault_secret_2024
JWT_EXPIRY=7d
FRONTEND_URL=http://72.62.33.7
VITE_API_URL=/api
UPLOADS_DIR=/var/www/chatvault/uploads
MEDIA_DIR=/var/www/chatvault/media
MAX_UPLOAD_SIZE=524288000
EOF
"@
```

**What to expect:** No output, just returns to prompt quickly.

---

### Command 5: Start the Application (Takes 5-10 minutes)
```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh root@72.62.33.7 -pw "Mohaned2013@" -batch "cd /opt/chatvault && docker compose up -d --build"
```

**What to expect:** You'll see Docker building images and starting containers. This is the longest step.

---

## Step 3: Access Your App

Once Command 5 completes, open your browser and go to:

**http://72.62.33.7**

### Login Credentials:
- **Email:** admin@chatvault.local
- **Password:** admin123

---

## Troubleshooting

If you need to check if it's running:
```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh root@72.62.33.7 -pw "Mohaned2013@" -batch "cd /opt/chatvault && docker compose ps"
```

To see logs:
```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh root@72.62.33.7 -pw "Mohaned2013@" -batch "cd /opt/chatvault && docker compose logs"
```
