# MENUPI Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying MENUPI to:
1. **Railway** - Backend API (api.menupi.com)
2. **Vercel** - TV Player (tv.menupi.com)
3. **Vercel** - Admin Portal (portal.menupi.com)
4. **Vercel** - Dashboard (app.menupi.com) - Optional, can use same as admin

## 📋 Prerequisites

- GitHub repository: https://github.com/fakharu6036/display-menupi
- Railway account (already connected)
- Vercel account
- Domain configured: menupi.com with subdomains

## Step 1: Push Code to GitHub

### Initialize Git (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized, run:
git init
git remote add origin https://github.com/fakharu6036/display-menupi.git
```

### Commit and Push

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add TV management features and production configuration"

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy Backend to Railway

Railway is already connected to your GitHub repo. It will auto-deploy on push.

### Configure Railway Environment Variables

In Railway dashboard, go to your project → **Variables** tab and add:

```env
# Database (Railway MySQL - use ${{MySQL.MYSQLHOST}} format)
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
GEMINI_API_KEY=your-gemini-key-if-needed
```

### Run Database Migrations

1. In Railway, go to MySQL service
2. Click **"Connect"** → **"MySQL Shell"**
3. Run migrations in order:

```sql
SOURCE database.sql;
SOURCE migrate-hardware-tvs.sql;
SOURCE migrate-add-ip-tracking.sql;
SOURCE migrate-plan-requests.sql;
SOURCE migrate-manual-android-tvs.sql;
SOURCE migrate-tv-deduplication.sql;
```

### Configure Custom Domain

1. Go to Railway project → **Settings** → **Networking**
2. Add custom domain: `api.menupi.com`
3. Update DNS with CNAME record Railway provides

### Verify Deployment

```bash
curl https://api.menupi.com/api/health
```

## Step 3: Deploy TV Player to Vercel (tv.menupi.com)

### Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import from GitHub: `fakharu6036/display-menupi`
4. Configure project:
   - **Project Name**: `menupi-tv-player`
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Set Environment Variables

In Vercel project settings → **Environment Variables**:

```env
VITE_API_BASE_URL=https://api.menupi.com
NODE_ENV=production
```

### Configure Custom Domain

1. Go to project → **Settings** → **Domains**
2. Add domain: `tv.menupi.com`
3. Update DNS with CNAME record Vercel provides

### Deploy

Vercel will auto-deploy on every push to `main` branch.

## Step 4: Deploy Admin Portal to Vercel (portal.menupi.com)

### Create Second Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import from GitHub: `fakharu6036/display-menupi` (same repo)
4. Configure project:
   - **Project Name**: `menupi-admin-portal`
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Set Environment Variables

In Vercel project settings → **Environment Variables**:

```env
VITE_API_BASE_URL=https://api.menupi.com
NODE_ENV=production
```

### Configure Custom Domain

1. Go to project → **Settings** → **Domains**
2. Add domain: `portal.menupi.com`
3. Update DNS with CNAME record Vercel provides

### Deploy

Vercel will auto-deploy on every push to `main` branch.

## Step 5: Deploy Dashboard to Vercel (app.menupi.com) - Optional

You can create a third Vercel project for the dashboard, or use the same codebase with different routing.

### Option A: Separate Project (Recommended)

1. Create third Vercel project: `menupi-dashboard`
2. Same configuration as above
3. Domain: `app.menupi.com`

### Option B: Use Admin Portal Project

The app automatically detects the domain and routes accordingly. You can use the admin portal project for both.

## 🔍 Verification Checklist

### Backend (Railway)

- [ ] API responds at `https://api.menupi.com`
- [ ] Database migrations completed
- [ ] Environment variables set
- [ ] Custom domain configured

### TV Player (Vercel)

- [ ] Deployed at `https://tv.menupi.com`
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] Can access TV login page

### Admin Portal (Vercel)

- [ ] Deployed at `https://portal.menupi.com`
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] Can access admin login

### Dashboard (Vercel) - Optional

- [ ] Deployed at `https://app.menupi.com`
- [ ] Environment variables set
- [ ] Custom domain configured

## 🧪 Testing

### Test Backend

```bash
# Test API health
curl https://api.menupi.com/api/health

# Test login
curl -X POST https://api.menupi.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Test TV Player

1. Visit `https://tv.menupi.com`
2. Should see TV login/pairing screen
3. QR code should be visible

### Test Admin Portal

1. Visit `https://portal.menupi.com`
2. Should redirect to `/admin/dashboard` (if logged in)
3. Should show login if not authenticated

## 🔄 Continuous Deployment

All deployments are automatic:

- **Railway**: Auto-deploys on push to `main` branch
- **Vercel**: Auto-deploys on push to `main` branch

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

## 📝 DNS Configuration

Configure these DNS records:

```
Type: CNAME
Name: api
Value: [railway-domain].railway.app
TTL: 3600

Type: CNAME
Name: tv
Value: [vercel-domain].vercel.app
TTL: 3600

Type: CNAME
Name: portal
Value: [vercel-domain].vercel.app
TTL: 3600

Type: CNAME
Name: app
Value: [vercel-domain].vercel.app
TTL: 3600
```

## 🛠️ Troubleshooting

### Railway Issues

- Check Railway logs for errors
- Verify environment variables are set
- Ensure database migrations ran successfully

### Vercel Issues

- Check Vercel build logs
- Verify environment variables
- Ensure custom domain DNS is configured

### CORS Issues

- Verify `api.menupi.com` allows requests from `*.menupi.com`
- Check Railway CORS configuration

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- See `RAILWAY_DEPLOYMENT.md` for detailed Railway setup
- See `BACKWARD_COMPATIBILITY.md` for safety verification

---

**Status**: ✅ Ready for deployment
**Last Updated**: $(date)

