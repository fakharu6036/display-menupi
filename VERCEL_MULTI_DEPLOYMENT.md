# 🚀 Multi-Subdomain Vercel Deployment Guide

This guide explains how to deploy the MENUPI application to three separate Vercel projects for different subdomains.

## Architecture

- **app.menupi.com** → Main Dashboard (restaurant management)
- **portal.menupi.com** → Admin Portal (super admin only)
- **tv.menupi.com** → Public TV Player (for Android TVs)

All three deployments use the **same codebase** but route differently based on the subdomain.

## Current Deployment Status

✅ **app.menupi.com** - Already deployed (use current Vercel project)  
⏳ **portal.menupi.com** - Needs new Vercel project  
⏳ **tv.menupi.com** - Needs new Vercel project

## Step 1: Verify Current Deployment (app.menupi.com)

Your current Vercel deployment should already be working for `app.menupi.com`. Verify:

1. Go to Vercel Dashboard → Your Project
2. Check **Settings** → **Domains**
3. Ensure `app.menupi.com` is configured
4. Test: https://app.menupi.com

## Step 2: Create Portal Deployment (portal.menupi.com)

### Option A: New Vercel Project (Recommended)

1. **Vercel Dashboard** → **Add New Project**
2. **Import Git Repository** → Select `fakharu6036/display-menupi`
3. **Configure Project:**
   - **Project Name**: `menupi-portal` (or `menupi-admin`)
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables:**
   - Add: `VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io` (or your backend URL)
   - Same as your main dashboard project

5. **Deploy**

6. **Add Custom Domain:**
   - Go to **Settings** → **Domains**
   - Add: `portal.menupi.com`
   - Follow DNS setup instructions

### Option B: Use Same Project with Multiple Domains

1. Go to existing Vercel project
2. **Settings** → **Domains**
3. Add: `portal.menupi.com`
4. Configure DNS (CNAME to Vercel)

**Note:** This works, but both domains will serve the same build. The app will auto-detect the subdomain and show the correct interface.

## Step 3: Create TV Player Deployment (tv.menupi.com)

### Option A: New Vercel Project (Recommended)

1. **Vercel Dashboard** → **Add New Project**
2. **Import Git Repository** → Select `fakharu6036/display-menupi`
3. **Configure Project:**
   - **Project Name**: `menupi-tv` (or `menupi-player`)
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables:**
   - Add: `VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io` (or your backend URL)
   - Same as your main dashboard project

5. **Deploy**

6. **Add Custom Domain:**
   - Go to **Settings** → **Domains**
   - Add: `tv.menupi.com`
   - Follow DNS setup instructions

### Option B: Use Same Project with Multiple Domains

1. Go to existing Vercel project
2. **Settings** → **Domains**
3. Add: `tv.menupi.com`
4. Configure DNS (CNAME to Vercel)

## Step 4: DNS Configuration

For each subdomain, add a CNAME record:

```
Type: CNAME
Name: app (or portal or tv)
Value: cname.vercel-dns.com (or your Vercel domain)
TTL: Auto (or 3600)
```

**Example DNS Records:**
```
app.menupi.com    CNAME    cname.vercel-dns.com
portal.menupi.com CNAME    cname.vercel-dns.com
tv.menupi.com     CNAME    cname.vercel-dns.com
```

## Step 5: Verify Deployments

### Test app.menupi.com
```bash
curl -I https://app.menupi.com
# Should return 200 OK
```

**Expected:**
- Shows main dashboard
- Login/Register available
- Dashboard, Media, Screens, TVs, Schedules, Settings routes work
- Admin routes redirect to portal.menupi.com (or show 404)

### Test portal.menupi.com
```bash
curl -I https://portal.menupi.com
# Should return 200 OK
```

**Expected:**
- Shows admin login
- Only admin routes available (`/admin/*`)
- Redirects root (`/`) to `/admin/dashboard`
- Dashboard routes not accessible

### Test tv.menupi.com
```bash
curl -I https://tv.menupi.com
# Should return 200 OK
```

**Expected:**
- Shows TV login screen at root (`/`)
- Screen code routes work (`/ABC123`)
- No dashboard or admin routes
- Optimized for TV displays

## How Subdomain Detection Works

The app automatically detects the subdomain and shows the correct interface:

### app.menupi.com
- **Routes**: `/dashboard`, `/media`, `/screens`, `/tvs`, `/schedules`, `/settings`
- **Layout**: Full dashboard with sidebar navigation
- **Access**: Restaurant owners and users

### portal.menupi.com
- **Routes**: `/admin/*` only
- **Layout**: Admin dashboard (no regular dashboard)
- **Access**: Super admins only
- **Redirects**: All other routes → `/admin/dashboard`

### tv.menupi.com
- **Routes**: `/` (TV login), `/:screenCode` (player)
- **Layout**: Fullscreen TV player interface
- **Access**: Public (no authentication for player)
- **Redirects**: All other routes → `/`

## Environment Variables

All three deployments need the same environment variable:

```
VITE_API_BASE_URL=https://your-backend-url
```

**For local backend:**
```
VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io
```

**For production backend:**
```
VITE_API_BASE_URL=https://api.menupi.com
```

## Deployment Workflow

### Initial Setup (One Time)

1. ✅ Create 3 Vercel projects (or use 1 project with 3 domains)
2. ✅ Configure DNS for all subdomains
3. ✅ Add environment variables to each project
4. ✅ Deploy each project

### Regular Updates

When you push code to GitHub:

**Option A: Separate Projects**
- Each project auto-deploys independently
- Update each project's environment variables separately

**Option B: Single Project**
- One deployment serves all domains
- Update environment variables once
- All domains update together

## Troubleshooting

### Subdomain Not Detecting Correctly

**Problem:** Wrong interface shows on subdomain

**Solution:**
1. Check browser console for hostname detection
2. Verify DNS is pointing to correct Vercel project
3. Clear browser cache
4. Check `services/config.ts` subdomain detection logic

### CORS Errors

**Problem:** API calls fail with CORS errors

**Solution:**
1. Verify `VITE_API_BASE_URL` is set correctly
2. Check backend CORS allows all menupi.com subdomains
3. Verify backend is running and accessible

### Routes Not Working

**Problem:** Routes return 404

**Solution:**
1. Check `vercel.json` has SPA rewrite rule
2. Verify build completed successfully
3. Check Vercel deployment logs

### Admin Portal Not Accessible

**Problem:** Can't access admin routes on portal.menupi.com

**Solution:**
1. Verify you're logged in as SUPER_ADMIN
2. Check `components/ProtectedAdminRoute.tsx`
3. Verify user role in database

## Quick Reference

### Vercel Projects Structure

```
menupi-dashboard (app.menupi.com)
├── Domain: app.menupi.com
├── Env: VITE_API_BASE_URL
└── Routes: Dashboard, Media, Screens, etc.

menupi-portal (portal.menupi.com)
├── Domain: portal.menupi.com
├── Env: VITE_API_BASE_URL
└── Routes: /admin/* only

menupi-tv (tv.menupi.com)
├── Domain: tv.menupi.com
├── Env: VITE_API_BASE_URL
└── Routes: /, /:screenCode
```

### DNS Records

```
app.menupi.com    → Vercel Project 1
portal.menupi.com → Vercel Project 2 (or same as 1)
tv.menupi.com     → Vercel Project 3 (or same as 1)
```

---

**Status**: ✅ **Code Ready** - Just need to create Vercel projects  
**Next**: Create Vercel projects and configure domains

