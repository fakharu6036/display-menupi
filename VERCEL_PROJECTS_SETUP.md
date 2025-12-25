# 🚀 Vercel Projects Setup Guide

## Current Status

✅ **app.menupi.com** - Already deployed on Vercel project: `menupi-signage`  
⏳ **portal.menupi.com** - Needs new Vercel project  
⏳ **tv.menupi.com** - Needs new Vercel project

## Step 1: Update Existing Project (app.menupi.com)

### Update Environment Variable

1. Go to: https://vercel.com/dashboard
2. Find project: **menupi-signage**
3. Click on it
4. Go to **Settings** → **Environment Variables**
5. Check if `VITE_API_BASE_URL` exists:
   - **If exists**: Click **Edit** → Update value to: `https://tingliest-patience-tragic.ngrok-free.dev`
   - **If not exists**: Click **Add New** → Add:
     - **Key**: `VITE_API_BASE_URL`
     - **Value**: `https://tingliest-patience-tragic.ngrok-free.dev`
     - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### Redeploy

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Verify Domain

1. Go to **Settings** → **Domains**
2. Verify `app.menupi.com` is configured
3. If not, add it:
   - Click **Add Domain**
   - Enter: `app.menupi.com`
   - Follow DNS setup instructions

## Step 2: Create Portal Project (portal.menupi.com)

### Create New Project

1. Go to: https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. **Import Git Repository**:
   - Select: `fakharu6036/display-menupi`
   - Or search for your repo
4. Click **Import**

### Configure Project

1. **Project Name**: `menupi-portal` (or `menupi-admin`)
2. **Framework Preset**: Vite (should auto-detect)
3. **Root Directory**: `./` (leave as root)
4. **Build Command**: `npm run build` (should be auto-filled)
5. **Output Directory**: `dist` (should be auto-filled)
6. **Install Command**: `npm install` (should be auto-filled)

### Add Environment Variable

1. Before deploying, click **Environment Variables**
2. Click **Add New**
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://tingliest-patience-tragic.ngrok-free.dev`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Deploy

1. Click **Deploy**
2. Wait for deployment to complete (2-3 minutes)

### Add Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `portal.menupi.com`
4. Click **Add**
5. Follow DNS setup instructions:
   - Add CNAME record: `portal` → `cname.vercel-dns.com`
   - Or use the provided DNS values

## Step 3: Create TV Player Project (tv.menupi.com)

### Create New Project

1. Go to: https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. **Import Git Repository**:
   - Select: `fakharu6036/display-menupi`
   - Same repo as portal project
4. Click **Import**

### Configure Project

1. **Project Name**: `menupi-tv` (or `menupi-player`)
2. **Framework Preset**: Vite (should auto-detect)
3. **Root Directory**: `./` (leave as root)
4. **Build Command**: `npm run build` (should be auto-filled)
5. **Output Directory**: `dist` (should be auto-filled)
6. **Install Command**: `npm install` (should be auto-filled)

### Add Environment Variable

1. Before deploying, click **Environment Variables**
2. Click **Add New**
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://tingliest-patience-tragic.ngrok-free.dev`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Deploy

1. Click **Deploy**
2. Wait for deployment to complete (2-3 minutes)

### Add Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `tv.menupi.com`
4. Click **Add**
5. Follow DNS setup instructions:
   - Add CNAME record: `tv` → `cname.vercel-dns.com`
   - Or use the provided DNS values

## Step 4: Verify All Deployments

### Test app.menupi.com

```bash
curl -I https://app.menupi.com
```

**Expected:**
- Returns 200 OK
- Shows main dashboard
- Login/Register available
- Dashboard, Media, Screens, TVs routes work

### Test portal.menupi.com

```bash
curl -I https://portal.menupi.com
```

**Expected:**
- Returns 200 OK
- Shows admin login
- Only `/admin/*` routes available
- Redirects root to `/admin/dashboard`

### Test tv.menupi.com

```bash
curl -I https://tv.menupi.com
```

**Expected:**
- Returns 200 OK
- Shows TV login screen
- Only `/` and `/:screenCode` routes work
- Optimized for TV displays

## Project Summary

| Project Name | Domain | Purpose | Status |
|-------------|--------|---------|--------|
| `menupi-signage` | app.menupi.com | Main Dashboard | ✅ Update env var |
| `menupi-portal` | portal.menupi.com | Admin Portal | ⏳ Create new |
| `menupi-tv` | tv.menupi.com | TV Player | ⏳ Create new |

## Environment Variables (All Projects)

All three projects need the same environment variable:

```
VITE_API_BASE_URL=https://tingliest-patience-tragic.ngrok-free.dev
```

## DNS Configuration

Add these CNAME records to your DNS provider:

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com (or value from Vercel)
TTL: Auto

Type: CNAME
Name: portal
Value: cname.vercel-dns.com (or value from Vercel)
TTL: Auto

Type: CNAME
Name: tv
Value: cname.vercel-dns.com (or value from Vercel)
TTL: Auto
```

## Auto-Deploy Setup

All three projects are connected to the same GitHub repo, so:

- ✅ When you push to `master` branch, all projects auto-deploy
- ✅ Each project deploys independently
- ✅ You can manually redeploy each project separately

## Troubleshooting

### Project Not Deploying

**Solution:**
1. Check GitHub connection in Vercel project settings
2. Verify branch is set to `master`
3. Check build logs for errors

### Domain Not Working

**Solution:**
1. Verify DNS records are correct
2. Wait for DNS propagation (can take up to 24 hours)
3. Check domain status in Vercel dashboard

### Wrong Interface Showing

**Solution:**
1. Clear browser cache
2. Check subdomain detection in browser console
3. Verify domain is pointing to correct Vercel project

---

**Status**: ✅ **Ready to Setup**  
**Next**: Update existing project, create 2 new projects

