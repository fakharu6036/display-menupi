# 🖥️ Local Backend Setup Guide

This guide explains how to run the backend and database on your local server while deploying the frontend to Vercel.

## Architecture

- **Backend**: Local server (Node.js + Express)
- **Database**: Local MySQL server
- **Frontend**: Vercel (React app)

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MySQL** server running locally
3. **Public IP or Tunneling** (ngrok, Cloudflare Tunnel, etc.) - to expose local backend to internet

## Step 1: Setup Local Database

### Install MySQL (if not already installed)

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Windows:**
Download from: https://dev.mysql.com/downloads/mysql/

### Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE menupi_db;
CREATE USER 'menupi_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON menupi_db.* TO 'menupi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Run Migrations

```bash
mysql -u menupi_user -p menupi_db < migrations_all.sql
```

## Step 2: Configure Backend

### Create `.env` file in project root:

```env
# Database Configuration (Local)
DB_HOST=localhost
DB_USER=menupi_user
DB_PASSWORD=your_secure_password
DB_NAME=menupi_db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3002
NODE_ENV=production

# API URL (for file URLs - use your public backend URL)
# If using ngrok: https://your-ngrok-url.ngrok.io
# If using public IP: http://your-public-ip:3002
API_URL=http://localhost:3002

# Frontend URL (for CORS - your Vercel domain)
FRONTEND_URL=app.menupi.com
```

## Step 3: Expose Local Backend to Internet

Your Vercel frontend needs to access your local backend. You have two options:

### Option A: ngrok (Easiest - Recommended)

1. **Install ngrok:**
   ```bash
   brew install ngrok  # macOS
   # or download from https://ngrok.com/
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3002
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Update `.env`:**
   ```env
   API_URL=https://abc123.ngrok.io
   ```

5. **Update Vercel environment variable:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_API_BASE_URL=https://abc123.ngrok.io`

**Note:** Free ngrok URLs change on restart. For production, use:
- **ngrok paid plan** (static domain)
- **Cloudflare Tunnel** (free, static domain)
- **Public IP + Port forwarding** (if you have static IP)

### Option B: Cloudflare Tunnel (Free, Static Domain)

1. **Install cloudflared:**
   ```bash
   brew install cloudflared  # macOS
   ```

2. **Login:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel:**
   ```bash
   cloudflared tunnel create menupi-backend
   ```

4. **Configure tunnel:**
   Create `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: ~/.cloudflared/<tunnel-id>.json
   
   ingress:
     - hostname: api.menupi.com
       service: http://localhost:3002
     - service: http_status:404
   ```

5. **Run tunnel:**
   ```bash
   cloudflared tunnel run menupi-backend
   ```

6. **Update DNS:**
   - Add CNAME: `api.menupi.com` → `<tunnel-id>.cfargotunnel.com`

### Option C: Public IP + Port Forwarding

1. **Get your public IP:**
   ```bash
   curl ifconfig.me
   ```

2. **Configure router port forwarding:**
   - Forward port 3002 to your local machine
   - Or use a different port (e.g., 8080)

3. **Update `.env`:**
   ```env
   API_URL=http://your-public-ip:3002
   ```

4. **Update Vercel:**
   - `VITE_API_BASE_URL=http://your-public-ip:3002`

## Step 4: Start Backend Server

```bash
npm install
npm run server:api
```

**Expected output:**
```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 3002
🌐 Base URL: http://localhost:3002
✅ Database connected
✅ Tables ready
============================================================
```

## Step 5: Configure Vercel Frontend

### Environment Variables in Vercel

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add:
```
VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io
```

Or if using Cloudflare Tunnel:
```
VITE_API_BASE_URL=https://api.menupi.com
```

### Deploy to Vercel

```bash
git add .
git commit -m "Configure for local backend"
git push origin master
```

Vercel will auto-deploy. Your frontend will now connect to your local backend.

## Step 6: Test Setup

### Test Backend Locally

```bash
curl http://localhost:3002/
curl http://localhost:3002/api/health
```

### Test from Vercel Frontend

1. Open your Vercel deployment URL
2. Check browser console for API calls
3. Verify they're going to your local backend URL

## Troubleshooting

### CORS Errors

If you see CORS errors, check:
1. **Backend CORS** allows your Vercel domain
2. **FRONTEND_URL** in `.env` matches your Vercel domain
3. **ngrok/Cloudflare** URL is correct

### Database Connection Errors

```bash
# Test MySQL connection
mysql -u menupi_user -p menupi_db -e "SELECT 1;"

# Check MySQL is running
brew services list  # macOS
sudo systemctl status mysql  # Linux
```

### Port Already in Use

```bash
# Find process using port 3002
lsof -i :3002

# Kill process
kill -9 <PID>
```

### ngrok URL Changed

If ngrok URL changes:
1. Update `.env` with new URL
2. Restart backend server
3. Update Vercel environment variable
4. Redeploy frontend (or wait for auto-deploy)

## Production Considerations

### Security

1. **Use HTTPS** (ngrok provides this, or use Cloudflare Tunnel)
2. **Strong JWT_SECRET** (generate with: `openssl rand -base64 32`)
3. **Database password** (strong, unique)
4. **Firewall rules** (only allow necessary ports)

### Reliability

1. **Keep backend running** (use PM2 or systemd)
2. **Monitor uptime** (UptimeRobot, Pingdom)
3. **Backup database** regularly
4. **Static ngrok domain** (paid plan) or Cloudflare Tunnel

### Performance

1. **Database indexing** (already in migrations)
2. **Connection pooling** (already configured)
3. **File uploads** (consider cloud storage for production)

## Running Backend as Service

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start server.js --name menupi-api
pm2 save
pm2 startup  # Auto-start on boot
```

### Using systemd (Linux)

Create `/etc/systemd/system/menupi-api.service`:
```ini
[Unit]
Description=MENUPI API Server
After=network.target mysql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/menupi---digital-signage
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable menupi-api
sudo systemctl start menupi-api
```

## Quick Start Commands

```bash
# 1. Setup database
mysql -u root -p < migrations_all.sql

# 2. Configure .env
cp .env.example .env
# Edit .env with your settings

# 3. Start ngrok (in separate terminal)
ngrok http 3002

# 4. Update .env with ngrok URL
# API_URL=https://abc123.ngrok.io

# 5. Start backend
npm run server:api

# 6. Update Vercel env var
# VITE_API_BASE_URL=https://abc123.ngrok.io

# 7. Deploy frontend
git push origin master
```

---

**Status**: ✅ **Ready for Local Backend Setup**  
**Next**: Follow steps above to configure local backend + Vercel frontend

