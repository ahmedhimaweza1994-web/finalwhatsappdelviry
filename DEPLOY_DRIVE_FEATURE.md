# Deploy Google Drive Upload Feature

Run these commands on VPS:

```bash
cd /opt/chatvault
git pull origin main

# Rebuild backend (new dependencies) and frontend (UI changes)
docker compose down
docker compose up -d --build

# Check logs to ensure everything started correctly
docker compose logs -f backend
```

## What's New:
1. **Google Drive Upload**: New tab in upload modal.
2. **Direct Upload**: Chunk size increased to 100MB (faster, fewer requests).
3. **Backend**: New `axios` dependency and drive download logic.
