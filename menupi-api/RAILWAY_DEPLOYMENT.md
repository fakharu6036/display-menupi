# 🚂 Railway Deployment Guide for MENUPI API

## Quick Start

### 1. Connect Repository to Railway

1. **Go to Railway Dashboard:** https://railway.app
2. **Click:** "New Project"
3. **Select:** "Deploy from GitHub repo"
4. **Choose:** `fakharu6036/display-menupi`
5. **Select Root Directory:** `menupi-api/`

### 2. Configure Environment Variables

In Railway project settings, add these environment variables:

```bash
# Server
PORT=3001
NODE_ENV=production

# Database (Railway provides MySQL addon)
DB_HOST=your_railway_db_host
DB_USER=your_railway_db_user
DB_PASSWORD=your_railway_db_password
DB_NAME=your_railway_db_name

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# CORS
ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

# File Uploads
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
```

### 3. Add MySQL Database

1. **In Railway project**, click "New"
2. **Select:** "Database" → "MySQL"
3. **Railway will provide:**
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

4. **Map to your env vars:**
   - `DB_HOST` = `MYSQLHOST`
   - `DB_USER` = `MYSQLUSER`
   - `DB_PASSWORD` = `MYSQLPASSWORD`
   - `DB_NAME` = `MYSQLDATABASE`

### 4. Configure Build Settings

Railway auto-detects Node.js, but verify:

- **Build Command:** (auto-detected, no build needed)
- **Start Command:** `npm start`
- **Root Directory:** `menupi-api/`

### 5. Deploy

Railway will automatically:
1. Install dependencies (`npm install`)
2. Start the server (`npm start`)
3. Assign a public URL

### 6. Custom Domain (Optional)

1. **In Railway project**, go to "Settings" → "Domains"
2. **Add custom domain:** `api.menupi.com`
3. **Configure DNS:**
   - Type: `CNAME`
   - Name: `api`
   - Value: Railway-provided domain

## ✅ Verification

### Test Health Endpoint

```bash
curl https://your-railway-url.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected",
  "uptime": ...
}
```

### Test Public Screen Endpoint

```bash
curl https://your-railway-url.up.railway.app/api/public/screen/TESTCODE
```

## 📋 Railway-Specific Configuration

### Port Configuration

Railway automatically assigns `PORT` environment variable. Your server.js already uses:
```javascript
const PORT = process.env.PORT || 3001;
```

This will work automatically with Railway.

### File Uploads

Railway provides persistent storage. The `uploads/` directory will persist between deployments.

**Note:** For production, consider using Railway's volume storage or external storage (S3, etc.) for better reliability.

### Environment Variables

Railway allows you to:
- Set variables per environment (production, preview)
- Use Railway's variable reference system
- Keep secrets encrypted

### Database Connection

Railway MySQL addon provides connection details automatically. Use Railway's variable references:

```bash
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
```

## 🔧 Railway Features

### Auto-Deploy

Railway automatically deploys on every push to `main` branch.

### Preview Deployments

Railway creates preview deployments for pull requests automatically.

### Logs

View real-time logs in Railway dashboard:
- Build logs
- Runtime logs
- Error logs

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request metrics

## 🐛 Troubleshooting

### Build Fails

1. **Check Node.js version:** Railway uses Node 18+ by default
2. **Verify package.json:** All dependencies listed
3. **Check build logs:** Railway dashboard → Deployments → Logs

### Database Connection Issues

1. **Verify MySQL addon is running**
2. **Check environment variables match Railway's MySQL vars**
3. **Test connection:** Use Railway's MySQL console

### Port Issues

Railway automatically sets `PORT`. Don't hardcode port numbers.

### File Upload Issues

1. **Check `uploads/` directory exists**
2. **Verify write permissions**
3. **Consider using Railway volumes for persistent storage**

## 📝 Railway Configuration File (Optional)

Create `railway.json` in `menupi-api/` for advanced configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🔐 Security Best Practices

1. **Use Railway secrets** for sensitive values (JWT_SECRET, DB_PASSWORD)
2. **Enable HTTPS** (Railway provides this automatically)
3. **Set CORS** correctly (only allow app.menupi.com and tv.menupi.com)
4. **Use environment-specific variables** (production vs preview)

## 📊 Monitoring

Railway provides:
- **Uptime monitoring**
- **Error tracking**
- **Performance metrics**
- **Log aggregation**

## 🚀 Next Steps

After deployment:

1. ✅ Test health endpoint
2. ✅ Verify database connection
3. ✅ Test authentication endpoints
4. ✅ Configure custom domain (api.menupi.com)
5. ✅ Update frontend `VITE_API_URL` to Railway URL
6. ✅ Test full integration

---

**Railway Dashboard:** https://railway.app  
**Documentation:** https://docs.railway.app  
**Support:** https://railway.app/support

