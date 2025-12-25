# GitHub Deployment Instructions

## Quick Start

Your repository is already connected to Railway. Follow these steps to deploy:

## Step 1: Initialize Git (if needed)

```bash
# Check git status
git status

# If not a git repo, initialize:
git init
git remote add origin https://github.com/fakharu6036/display-menupi.git
```

## Step 2: Commit and Push Changes

```bash
# Add all files
git add .

# Commit with descriptive message
git commit -m "Add TV management features, Railway config, and production setup

- Add TV deduplication system
- Add manual Android TV management
- Configure Railway deployment
- Add Vercel configuration for multi-project deployment
- Remove TypeScript syntax from server.js
- Add backward compatibility verification"

# Push to GitHub (Railway will auto-deploy)
git push -u origin main
```

## Step 3: Railway Auto-Deployment

Railway is already connected to your GitHub repo. It will:

1. ✅ Auto-detect the push
2. ✅ Run `npm install`
3. ✅ Start with `npm run start` (or `node server.js`)
4. ✅ Deploy to Railway

### Configure Railway Environment Variables

After first deployment, go to Railway dashboard:

1. Open your project
2. Go to **Variables** tab
3. Add these variables:

```env
# Database (Railway provides these automatically)
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

# Security (GENERATE: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here

# Optional
GEMINI_API_KEY=your-key-if-needed
```

### Run Database Migrations

1. In Railway, go to MySQL service
2. Click **"Connect"** → **"MySQL Shell"**
3. Run migrations:

```sql
SOURCE database.sql;
SOURCE migrate-hardware-tvs.sql;
SOURCE migrate-add-ip-tracking.sql;
SOURCE migrate-plan-requests.sql;
SOURCE migrate-manual-android-tvs.sql;
SOURCE migrate-tv-deduplication.sql;
```

## Step 4: Create Vercel Projects

### Project 1: TV Player (tv.menupi.com)

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import: `fakharu6036/display-menupi`
4. Configure:
   - **Name**: `menupi-tv-player`
   - **Framework**: Vite
   - **Root Directory**: `.`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://api.menupi.com
   ```
6. **Domains**: Add `tv.menupi.com`
7. Click **"Deploy"**

### Project 2: Admin Portal (portal.menupi.com)

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import: `fakharu6036/display-menupi` (same repo)
4. Configure:
   - **Name**: `menupi-admin-portal`
   - **Framework**: Vite
   - **Root Directory**: `.`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://api.menupi.com
   ```
6. **Domains**: Add `portal.menupi.com`
7. Click **"Deploy"**

## Step 5: Verify Deployments

### Railway Backend

```bash
# Check Railway logs
# Should see:
# ✅ Database connected successfully
# 🚀 API Server running on port [PORT]
# 📡 API Base URL: https://api.menupi.com

# Test API
curl https://api.menupi.com/api/health
```

### Vercel TV Player

1. Visit `https://tv.menupi.com`
2. Should see TV pairing screen
3. QR code should be visible

### Vercel Admin Portal

1. Visit `https://portal.menupi.com`
2. Should show admin login or dashboard

## 🔄 Future Updates

To deploy updates:

```bash
# Make changes
git add .
git commit -m "Your update message"
git push origin main
```

Both Railway and Vercel will auto-deploy on push.

## 📋 Deployment Checklist

- [ ] Git repository initialized
- [ ] Code pushed to GitHub
- [ ] Railway environment variables configured
- [ ] Database migrations run
- [ ] Railway custom domain configured (api.menupi.com)
- [ ] Vercel TV Player project created
- [ ] Vercel Admin Portal project created
- [ ] Vercel environment variables set
- [ ] Vercel custom domains configured
- [ ] DNS records updated
- [ ] All deployments verified

## 🎯 Expected Results

After deployment:

- ✅ **Railway**: Backend API at `https://api.menupi.com`
- ✅ **Vercel**: TV Player at `https://tv.menupi.com`
- ✅ **Vercel**: Admin Portal at `https://portal.menupi.com`
- ✅ **Auto-deploy**: All services deploy on git push

---

**Repository**: https://github.com/fakharu6036/display-menupi
**Railway**: Auto-connected, deploys on push
**Vercel**: Create 2 projects from same repo

