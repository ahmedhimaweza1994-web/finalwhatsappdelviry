$server = "72.62.33.7"
$user = "root"
$password = "Mohaned2013@"
$plink = "C:\Program Files\PuTTY\plink.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ChatVault VPS Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Accept host key
Write-Host "Step 1: Accepting host key..." -ForegroundColor Yellow
echo y | & $plink -ssh "$user@$server" -pw $password "exit" 2>$null

# Step 2: Install Docker
Write-Host "Step 2: Installing Docker (this may take a few minutes)..." -ForegroundColor Yellow
& $plink -ssh "$user@$server" -pw $password -batch "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && apt-get install -y docker-compose-plugin && rm -f get-docker.sh"

# Step 3: Setup directory and clone
Write-Host "Step 3: Cloning application from GitHub..." -ForegroundColor Yellow
& $plink -ssh "$user@$server" -pw $password -batch "cd /opt && rm -rf chatvault && mkdir -p chatvault && cd chatvault && git clone https://github.com/ahmedhimaweza1994-web/finalwhatsappdelviry.git ."

# Step 4: Create .env file
Write-Host "Step 4: Configuring environment..." -ForegroundColor Yellow
$envContent = @"
DB_HOST=postgres
DB_PORT=5432
DB_NAME=chatvault
DB_USER=chatvault
DB_PASSWORD=Mohaned2013@
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3001
NODE_ENV=production
JWT_SECRET=chatvault_secret_key_2024
JWT_EXPIRY=7d
FRONTEND_URL=http://72.62.33.7
VITE_API_URL=/api
UPLOADS_DIR=/var/www/chatvault/uploads
MEDIA_DIR=/var/www/chatvault/media
MAX_UPLOAD_SIZE=524288000
"@

$envContent | & $plink -ssh "$user@$server" -pw $password -batch "cd /opt/chatvault && cat > .env"

# Step 5: Start application
Write-Host "Step 5: Starting application (this will take 5-10 minutes)..." -ForegroundColor Yellow
& $plink -ssh "$user@$server" -pw $password -batch "cd /opt/chatvault && docker compose up -d --build"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at: http://72.62.33.7" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default login:" -ForegroundColor Yellow
Write-Host "  Email: admin@chatvault.local"
Write-Host "  Password: admin123"
Write-Host ""
