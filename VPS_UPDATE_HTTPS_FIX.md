# VPS Update Commands - Fix HTTPS and 10GB Display

## Run these commands on VPS:

```bash
cd /opt/chatvault

# Pull latest changes
git pull origin main

# Rebuild only frontend (faster than full rebuild)
docker compose up -d --build frontend

# Wait for build
sleep 30

# Check status
docker compose ps

# Clear browser cache and test
echo "✅ Done! Clear your browser cache (Ctrl+Shift+Delete) and try uploading again"
```

## What was fixed:
1. ✅ Tus endpoint now uses HTTPS (fixes Mixed Content error)
2. ✅ Frontend displays "10GB" instead of "500MB"
3. ✅ Backend Dockerfile committed to use Node 20

## Test Steps:
1. Clear browser cache completely
2. Reload https://whatsappbackup.cloud
3. Login
4. Try uploading a large file
5. Should work without Mixed Content errors
