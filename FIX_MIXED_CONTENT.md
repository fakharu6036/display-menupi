# Fix Mixed Content Errors - Implementation Complete

## ✅ Code Changes Complete

All code changes have been implemented and pushed to GitHub:

1. **Backend URL Normalization** (`server.js`, `menupi-api/server.js`)
   - Added `normalizeMediaUrl()` function
   - Normalizes URLs when returning media from API
   - Fixes localhost URLs to use `https://api.menupi.com`

2. **Frontend URL Normalization** (`utils/url.ts`)
   - Created `normalizeMediaUrl()` utility
   - All components use this function

3. **Storage Service Normalization** (`services/storage.ts`)
   - Normalizes URLs when fetching from API
   - Normalizes URLs in cached data

## 🚨 Required Actions

### 1. Restart Backend Server

**CRITICAL:** The backend server must be restarted for URL normalization to work.

```bash
# If using PM2
pm2 restart menupi-api

# Or if running directly
# Stop the server (Ctrl+C) and restart it
```

### 2. Wait for Vercel Rebuild

Vercel will automatically rebuild after GitHub push (usually 2-5 minutes).

**Check deployment status:**
- Go to https://vercel.com
- Select your project
- Check "Deployments" tab
- Wait for latest deployment to complete

**Or manually trigger:**
- Vercel Dashboard → Deployments → "Redeploy"

### 3. Clear Browser Cache

After Vercel rebuilds:
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or clear browser cache completely

## 🔍 How to Verify Fix

1. **Check API Response:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.menupi.com/api/media
   ```
   URLs should be `https://api.menupi.com/uploads/...` not `http://localhost:...`

2. **Check Browser Console:**
   - Open DevTools → Network tab
   - Look for image requests
   - Should see `https://api.menupi.com/uploads/...`
   - No more `localhost:3000` or `localhost:3001` URLs

3. **Check for Errors:**
   - No more "Mixed Content" warnings
   - No more "ERR_CONNECTION_REFUSED" errors

## 📝 Environment Variables

Ensure backend has:
```bash
API_URL=https://api.menupi.com
# OR
NODE_ENV=production  # Will default to https://api.menupi.com
```

## 🐛 Troubleshooting

### Still seeing localhost URLs?

1. **Backend not restarted?**
   - Restart the backend server
   - Check server logs for errors

2. **Vercel not rebuilt?**
   - Check Vercel dashboard for deployment status
   - Manually trigger redeploy if needed

3. **Browser cache?**
   - Clear browser cache
   - Try incognito/private window

4. **Database has full URLs?**
   - Backend normalization should fix this
   - Check API response directly

### Backend normalization not working?

Check server logs:
```bash
# Should see normalized URLs in responses
# If not, check:
# 1. Is normalizeMediaUrl() being called?
# 2. Is getMediaBaseUrl() returning correct URL?
# 3. Are there any errors in logs?
```

## ✅ Expected Result

After backend restart and Vercel rebuild:
- ✅ All media URLs use `https://api.menupi.com/uploads/...`
- ✅ No mixed content warnings
- ✅ Images load correctly
- ✅ No connection errors

---

**Last Updated:** After commit `3719fe4`
**Status:** Code complete, awaiting deployment

