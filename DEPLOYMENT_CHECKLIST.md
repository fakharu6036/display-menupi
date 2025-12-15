# 🚀 Deployment Checklist - Mixed Content Fix

## ✅ Code Changes Complete

All code has been updated and pushed to GitHub. The following fixes are in place:

### Backend Changes
- ✅ URL normalization in `server.js` and `menupi-api/server.js`
- ✅ Upload endpoint stores relative paths only
- ✅ Upload endpoint returns correct production URLs
- ✅ Media endpoints normalize URLs when returning data
- ✅ Avatar upload endpoint uses correct URLs

### Frontend Changes
- ✅ URL normalization utility (`utils/url.ts`)
- ✅ All components use normalized URLs
- ✅ Storage service normalizes URLs in API responses
- ✅ Storage service normalizes URLs in cached data

## 🔧 Required Actions

### 1. Backend Server Restart (CRITICAL)

**You MUST restart your backend server for changes to take effect:**

```bash
# If using PM2
pm2 restart menupi-api

# Or if running directly
# Stop the server (Ctrl+C) and restart:
node menupi-api/server.js
# OR
node server.js
```

### 2. Environment Variables

Ensure your backend has these environment variables set:

```bash
# Production API URL (required for correct media URLs)
API_URL=https://api.menupi.com

# OR set NODE_ENV to production
NODE_ENV=production

# Other required variables
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://app.menupi.com
```

**Where to set:**
- **Hostinger:** `.env` file in your server directory
- **Fly.io:** `fly secrets set API_URL=https://api.menupi.com`
- **Railway:** Railway dashboard → Variables
- **PM2:** In your ecosystem.config.js or .env file

### 3. Vercel Frontend Deployment

Vercel should auto-deploy after GitHub push (2-5 minutes).

**Check deployment:**
1. Go to https://vercel.com
2. Select your project
3. Check "Deployments" tab
4. Wait for latest deployment to complete (should show commit `2770be7`)

**If not auto-deploying:**
- Go to Deployments → Click "Redeploy" on latest
- Or trigger via: `vercel --prod` (if you have CLI)

### 4. Clear Browser Cache

After Vercel rebuilds:
- **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- **Or use incognito/private window** to test
- **Or clear browser cache** completely

## ✅ Verification Steps

### 1. Check Backend is Running

```bash
# Test health endpoint
curl https://api.menupi.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","database":"connected","uptime":...}
```

### 2. Check API Returns Correct URLs

```bash
# Test media endpoint (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.menupi.com/api/media

# Check that URLs are:
# ✅ https://api.menupi.com/uploads/...
# ❌ NOT http://localhost:3000/uploads/...
# ❌ NOT http://localhost:3001/uploads/...
```

### 3. Test Upload

1. Go to https://app.menupi.com/media
2. Upload a test image
3. Check browser DevTools → Network tab
4. Verify the upload response has correct URL:
   ```json
   {
     "success": true,
     "id": 123,
     "url": "https://api.menupi.com/uploads/..."
   }
   ```

### 4. Check Browser Console

1. Open https://app.menupi.com/media
2. Open DevTools → Console
3. Should see:
   - ✅ No "Mixed Content" warnings
   - ✅ No "ERR_CONNECTION_REFUSED" errors
   - ✅ Images loading from `https://api.menupi.com/uploads/...`

### 5. Check Network Requests

1. Open DevTools → Network tab
2. Filter by "Img" or "Media"
3. All image requests should be:
   - ✅ `https://api.menupi.com/uploads/...`
   - ❌ NOT `http://localhost:...`

## 🐛 Troubleshooting

### Still seeing localhost URLs?

**Backend not restarted?**
```bash
# Check if server is running
pm2 list
# Or
ps aux | grep node

# Restart if needed
pm2 restart menupi-api
```

**Environment variable not set?**
```bash
# Check environment variables
pm2 env menupi-api
# Or check your .env file

# Set if missing
export API_URL=https://api.menupi.com
# Or add to .env file
```

**Vercel not rebuilt?**
- Check Vercel dashboard for deployment status
- Look for commit `2770be7` in deployments
- Manually trigger redeploy if needed

**Browser cache?**
- Clear browser cache completely
- Try incognito/private window
- Hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`

### Backend normalization not working?

**Check server logs:**
```bash
# View PM2 logs
pm2 logs menupi-api

# Look for:
# - Any errors in normalizeMediaUrl
# - getMediaBaseUrl returning correct URL
# - API requests being processed
```

**Test getMediaBaseUrl:**
- Should return `https://api.menupi.com` in production
- Check if `API_URL` or `NODE_ENV=production` is set

### Database has old localhost URLs?

**This is OK!** The normalization functions will:
- ✅ Fix URLs when returning from API
- ✅ Fix URLs in frontend components
- ✅ Fix URLs in cached data

**New uploads** will automatically use correct URLs.

## 📋 Summary

### What's Fixed:
- ✅ Upload endpoint stores relative paths
- ✅ Upload endpoint returns correct production URLs
- ✅ Media endpoints normalize URLs
- ✅ Frontend components normalize URLs
- ✅ Storage service normalizes URLs
- ✅ Cached data gets normalized

### What You Need to Do:
1. ✅ **Restart backend server** (CRITICAL)
2. ✅ **Set API_URL environment variable** (if not set)
3. ✅ **Wait for Vercel rebuild** (2-5 minutes)
4. ✅ **Clear browser cache**
5. ✅ **Test upload and verify URLs**

### Expected Result:
- ✅ All media URLs use `https://api.menupi.com/uploads/...`
- ✅ No mixed content warnings
- ✅ Images load correctly
- ✅ No connection errors
- ✅ New uploads work immediately

---

**Last Updated:** After commit `2770be7`
**Status:** Code complete, ready for deployment

