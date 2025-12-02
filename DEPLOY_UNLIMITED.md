# Deploy Unlimited Upload Configuration

Run these commands on VPS:

```bash
cd /opt/chatvault
git pull origin main
docker compose restart nginx backend
docker compose ps
```

## What Changed:
- ✅ **File size: UNLIMITED** (`client_max_body_size 0`)
- ✅ **Rate limiting: REMOVED** completely
- ✅ **Timeouts: 24 hours** (86400s)
- ✅ **Worker connections: 10,000**
- ✅ **Keepalive: 100,000 requests**
- ✅ **Backend rate limiter: REMOVED**

## Test:
Upload any size file - should work without rate limiting or size restrictions.
