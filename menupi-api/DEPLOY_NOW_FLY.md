# 🚀 Deploy MENUPI API to Fly.io - Step by Step

## Prerequisites
- Fly.io account: https://fly.io (sign up if needed)
- GitHub repo connected to Fly.io (or deploy manually)

## Quick Deploy (5 minutes)

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

Or on macOS with Homebrew:
```bash
brew install flyctl
```

### Step 2: Login to Fly.io
```bash
fly auth login
```
This will open your browser to authenticate.

### Step 3: Navigate to API Folder
```bash
cd menupi-api
```

### Step 4: Launch/Deploy
```bash
fly launch
```

**When prompted:**
- **App name:** `display-menupi` (or press Enter to use suggested name)
- **Region:** Choose closest to your users (e.g., `iad` for US East, `lhr` for London)
- **Postgres:** `n` (No - we're using external MySQL)
- **Redis:** `n` (No)

### Step 5: Set Environment Variables

**Option A: All at once**
```bash
fly secrets set \
  DB_HOST=your_mysql_host \
  DB_USER=your_database_user \
  DB_PASSWORD=your_database_password \
  DB_NAME=your_database_name \
  JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long \
  ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com \
  NODE_ENV=production
```

**Option B: One by one (if you prefer)**
```bash
fly secrets set DB_HOST=your_mysql_host
fly secrets set DB_USER=your_database_user
fly secrets set DB_PASSWORD=your_database_password
fly secrets set DB_NAME=your_database_name
fly secrets set JWT_SECRET=your_jwt_secret_minimum_32_chars
fly secrets set ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
fly secrets set NODE_ENV=production
```

**Get your database credentials from:**
- Hostinger hPanel → Databases → MySQL Databases
- Or your database provider

**Generate JWT Secret:**
```bash
openssl rand -hex 32
```

### Step 6: Deploy (if not already deployed)
```bash
fly deploy
```

### Step 7: Add Custom Domain
```bash
fly certs add api.menupi.com
```

This will give you DNS instructions. Update your DNS:
- **Type:** `A` or `CNAME`
- **Name:** `api`
- **Value:** The IP or hostname Fly.io provides
- **TTL:** 3600

### Step 8: Verify Deployment

**Check status:**
```bash
fly status
```

**View logs:**
```bash
fly logs
```

**Test health endpoint:**
```bash
curl https://api.menupi.com/api/health
```

Or visit in browser: https://api.menupi.com/api/health

Should return:
```json
{"success":true,"data":{"status":"ok","timestamp":"...","database":"connected"}}
```

## Troubleshooting

### App won't start
```bash
fly logs
fly ssh console
```

### Can't connect to database
1. Check database allows connections from Fly.io IPs
2. Verify all secrets: `fly secrets list`
3. Test connection: `fly ssh console` then test DB connection

### Domain not working
1. Check DNS propagation: https://dnschecker.org
2. Verify cert: `fly certs show api.menupi.com`
3. Wait 5-10 minutes for DNS to propagate

### Update secrets
```bash
fly secrets set DB_PASSWORD=new_password
fly deploy
```

## Useful Commands

```bash
# View app info
fly info

# View logs
fly logs

# SSH into app
fly ssh console

# Restart app
fly apps restart display-menupi

# Scale resources
fly scale vm shared-cpu-1x --memory 1024

# View secrets (values hidden)
fly secrets list
```

## Next Steps After Deployment

1. ✅ Test API: `curl https://api.menupi.com/api/health`
2. ✅ Update frontend `VITE_API_URL` to `https://api.menupi.com/api`
3. ✅ Test login from frontend
4. ✅ Verify screens load correctly

## Support

- Fly.io Docs: https://fly.io/docs
- Fly.io Community: https://community.fly.io

