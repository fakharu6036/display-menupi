# 🚀 Quick Deployment Guide

## One-Command Deployment

Run this script to push to GitHub and trigger Railway deployment:

```bash
./deploy-to-github.sh
```

Or manually:

```bash
git add .
git commit -m "Add TV management features and production setup"
git push -u origin main
```

## 📋 Complete Deployment Steps

### 1. Push to GitHub (Triggers Railway)

```bash
./deploy-to-github.sh
```

Railway will automatically:
- ✅ Detect the push
- ✅ Install dependencies
- ✅ Deploy backend API

### 2. Configure Railway

After Railway deploys:

1. **Add Environment Variables** (Railway Dashboard → Variables):
   ```env
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   API_URL=https://api.menupi.com
   PROTOCOL=https
   DOMAIN=api.menupi.com
   NODE_ENV=production
   JWT_SECRET=[generate: openssl rand -base64 32]
   ```

2. **Run Database Migrations** (Railway MySQL Shell):
   ```sql
   SOURCE database.sql;
   SOURCE migrate-hardware-tvs.sql;
   SOURCE migrate-add-ip-tracking.sql;
   SOURCE migrate-plan-requests.sql;
   SOURCE migrate-manual-android-tvs.sql;
   SOURCE migrate-tv-deduplication.sql;
   ```

3. **Configure Custom Domain**: `api.menupi.com`

### 3. Create Vercel Projects

#### TV Player (tv.menupi.com)

1. Go to https://vercel.com/dashboard
2. **Add New** → **Project**
3. Import: `fakharu6036/display-menupi`
4. **Name**: `menupi-tv-player`
5. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://api.menupi.com
   ```
6. **Domain**: `tv.menupi.com`
7. **Deploy**

#### Admin Portal (portal.menupi.com)

1. Go to https://vercel.com/dashboard
2. **Add New** → **Project**
3. Import: `fakharu6036/display-menupi` (same repo)
4. **Name**: `menupi-admin-portal`
5. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://api.menupi.com
   ```
6. **Domain**: `portal.menupi.com`
7. **Deploy**

## ✅ Verification

### Railway Backend
```bash
curl https://api.menupi.com/api/health
```

### Vercel TV Player
Visit: `https://tv.menupi.com`

### Vercel Admin Portal
Visit: `https://portal.menupi.com`

## 📚 Full Documentation

- **Railway Setup**: See `RAILWAY_DEPLOYMENT.md`
- **GitHub Deployment**: See `GITHUB_DEPLOYMENT.md`
- **Complete Guide**: See `DEPLOYMENT_GUIDE.md`
- **Safety Check**: See `BACKWARD_COMPATIBILITY.md`

---

**Repository**: https://github.com/fakharu6036/display-menupi
**Status**: ✅ Ready to deploy

