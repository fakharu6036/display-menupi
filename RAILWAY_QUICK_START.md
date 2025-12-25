# Railway Quick Start Guide

## 🚀 Quick Deployment Steps

### 1. Connect Repository to Railway
1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `menupi---digital-signage` repository

### 2. Add MySQL Database
1. In Railway project, click **"+ New"** → **"Database"** → **"Add MySQL"**
2. Railway will auto-provision MySQL

### 3. Set Environment Variables

Click **"Variables"** tab and add these (Railway will auto-fill MySQL vars):

```env
# Database (Railway auto-provides these - use ${{MySQL.MYSQLHOST}} format)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}

# API Configuration
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com
NODE_ENV=production

# Security (GENERATE THIS - run: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
```

### 4. Run Database Migrations

**Option A: Railway MySQL Shell**
1. Click on MySQL service → **"Connect"** → **"MySQL Shell"**
2. Run: `SOURCE database.sql;`
3. Then run all migration files in order

**Option B: Railway CLI**
```bash
railway link
railway run mysql < database.sql
railway run mysql < migrate-hardware-tvs.sql
railway run mysql < migrate-add-ip-tracking.sql
railway run mysql < migrate-plan-requests.sql
railway run mysql < migrate-manual-android-tvs.sql
railway run mysql < migrate-tv-deduplication.sql
```

### 5. Configure Custom Domain
1. Go to **"Settings"** → **"Networking"**
2. Click **"Custom Domain"** → Add `api.menupi.com`
3. Update DNS with CNAME record Railway provides

### 6. Deploy
Railway will auto-deploy on push, or click **"Deploy"** → **"Redeploy"**

## ✅ Verification

Check logs for:
```
✅ Database connected successfully
🚀 API Server running on port [PORT]
📡 API Base URL: https://api.menupi.com
```

Test endpoint:
```bash
curl https://api.menupi.com/api/health
```

## 📚 Full Documentation

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

