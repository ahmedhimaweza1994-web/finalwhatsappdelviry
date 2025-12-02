# VPS Deployment Instructions for Resumable Upload

## What Changed
- ✅ Backend: Added tus server for resumable uploads
- ✅ Frontend: Replaced standard upload with tus-js-client
- ✅ Nginx: Added tus endpoint configuration
- ✅ Pushed to GitHub

## Deploy to VPS

SSH into your VPS and run these commands:

```bash
cd /opt/chatvault

# Pull latest changes from GitHub
git pull origin main

# Rebuild containers with new dependencies
docker compose down
docker compose up -d --build

# Wait for build to complete (may take 2-3 minutes)
sleep 120

# Check all containers are running
docker compose ps

# Check backend logs for tus server
docker compose logs backend | grep -i tus

# Test the deployment
curl -I https://whatsappbackup.cloud/health
```

## How It Works Now

### For Users:
1. Upload starts with tus protocol
2. File is split into 50MB chunks
3. Each chunk uploads separately
4. If connection drops, upload resumes automatically
5. Works on Safari, Chrome, mobile browsers

### Technical Details:
- **Chunk Size**: 50MB per chunk
- **Retry Logic**: Automatic retry with exponential backoff
- **Endpoint**: `/api/upload/tus/`
- **Storage**: Temporary storage in `uploads/tus-temp/`
- **Processing**: Triggers existing parse job after upload completes

## Testing

After deployment, test with:
1. Upload a large file (3GB+) from Safari/iPhone
2. Verify upload progress shows correctly
3. Interrupt upload (close browser) and reopen - should resume
4. Check that processing works after upload completes

## Rollback (if needed)

If there are issues:
```bash
cd /opt/chatvault
git reset --hard HEAD~1
docker compose down
docker compose up -d --build
```

## Expected Result

Users can now upload files up to 10GB from any browser/device without timeout issues. Upload will automatically resume if interrupted.
