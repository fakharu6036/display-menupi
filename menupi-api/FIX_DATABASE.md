# 🔧 Fix Database Connection on Fly.io

## Problem
Database shows "disconnected" in health check, causing 403 errors.

## Solution

### Step 1: Get Database Credentials from Hostinger

1. **Login to Hostinger hPanel**
   - Go to: https://hpanel.hostinger.com
   - Login with your credentials

2. **Navigate to Databases**
   - Click **Databases** in left menu
   - Click **MySQL Databases**

3. **Find Your Database**
   - Look for your database (usually `u859590789_menupi` or similar)
   - Note down:
     - **Database Host:** Usually `localhost` or `your-host.hostinger.com`
     - **Database User:** Usually `u859590789_menupi` or similar
     - **Database Password:** (the password you set)
     - **Database Name:** Usually same as username

### Step 2: Update Fly.io Secrets

```bash
cd menupi-api
fly secrets set \
  DB_HOST=your_database_host \
  DB_USER=your_database_user \
  DB_PASSWORD=your_database_password \
  DB_NAME=your_database_name \
  -a display-menupi
```

**Example:**
```bash
fly secrets set \
  DB_HOST=localhost \
  DB_USER=u859590789_menupi \
  DB_PASSWORD=your_password_here \
  DB_NAME=u859590789_menupi \
  -a display-menupi
```

### Step 3: Important - Remote Database Access

**Hostinger databases might not allow remote connections by default.**

#### Option A: Use Hostinger's Remote MySQL Host (if available)
- Some Hostinger plans allow remote MySQL connections
- Check Hostinger documentation for remote MySQL hostname
- It might be different from `localhost`

#### Option B: Use SSH Tunnel (Advanced)
If Hostinger doesn't allow remote connections, you'll need to:
1. Set up an SSH tunnel
2. Or use a database proxy service
3. Or migrate database to a cloud provider that allows remote access

#### Option C: Use Cloud Database (Recommended for Production)
Consider using:
- **PlanetScale** (MySQL-compatible, free tier)
- **Railway** (MySQL, easy setup)
- **Supabase** (PostgreSQL, free tier)
- **Aiven** (MySQL, free tier)

### Step 4: Verify Connection

After updating secrets:

```bash
# Redeploy to apply changes
fly deploy -a display-menupi

# Check health
curl https://api.menupi.com/api/health

# Should show: "database": "connected"
```

### Step 5: Check Logs

If still not working:

```bash
fly logs -a display-menupi | grep -i "database\|connection\|error"
```

Look for specific error messages like:
- `ECONNREFUSED` - Can't connect to host
- `ER_ACCESS_DENIED` - Wrong credentials
- `ETIMEDOUT` - Host not reachable

## Common Issues

### Issue 1: "Access denied for user"
- **Fix:** Check DB_USER and DB_PASSWORD are correct
- **Verify:** Login to Hostinger phpMyAdmin with same credentials

### Issue 2: "Can't connect to MySQL server"
- **Fix:** DB_HOST might be wrong
- **Try:** Use `localhost` if database is on Hostinger
- **Or:** Check if Hostinger provides a remote MySQL hostname

### Issue 3: "Connection timeout"
- **Fix:** Hostinger might block remote connections
- **Solution:** Use cloud database or SSH tunnel

## Alternative: Use Cloud Database

If Hostinger doesn't allow remote connections, use a cloud database:

### PlanetScale (Recommended)
1. Sign up: https://planetscale.com
2. Create database
3. Get connection string
4. Update Fly.io secrets with PlanetScale credentials

### Railway MySQL
1. Sign up: https://railway.app
2. Create MySQL service
3. Get connection details
4. Update Fly.io secrets

## Test Database Connection

```bash
# Test from Fly.io machine
fly ssh console -a display-menupi

# Then inside the machine:
node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ Connected!');
    await conn.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
"
```

## After Fixing

1. ✅ Database shows "connected" in health check
2. ✅ Login works from frontend
3. ✅ API endpoints return data instead of 403

