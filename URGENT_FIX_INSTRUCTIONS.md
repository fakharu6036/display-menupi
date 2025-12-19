# 🚨 URGENT: Fix Double /api/ Prefix Issue

## Current Problem
The app is still making requests to `https://api.menupi.com/api/...` instead of `https://api.menupi.com/...`

## Root Cause
The `VITE_API_URL` environment variable in Vercel is likely set to `https://api.menupi.com/api` (with `/api` suffix).

## ✅ IMMEDIATE FIX REQUIRED

### Step 1: Update Vercel Environment Variable

1. Go to: https://vercel.com/fakharu6036s-projects/menupi-signage/settings/environment-variables

2. Find `VITE_API_URL` in the **Production** environment

3. **CHANGE IT FROM:**
   ```
   https://api.menupi.com/api
   ```

4. **TO:**
   ```
   https://api.menupi.com
   ```
   (Remove the `/api` suffix!)

5. Click **Save**

6. **Redeploy** the production deployment:
   - Go to: https://vercel.com/fakharu6036s-projects/menupi-signage/deployments
   - Find the latest deployment
   - Click the **"..."** menu → **"Redeploy"**

### Step 2: Clear Browser Cache

After redeployment:
1. Open your site
2. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to hard refresh
3. Or open DevTools → Application → Clear Storage → Clear site data

### Step 3: Verify

Open DevTools → Network tab and check:
- ✅ Should see: `https://api.menupi.com/login`
- ✅ Should see: `https://api.menupi.com/screens`
- ❌ Should NOT see: `https://api.menupi.com/api/login`

## Why This Happens

The `api.menupi.com` subdomain points directly to the `/api/` directory on Hostinger. So:
- ✅ Correct: `https://api.menupi.com/screens` → `/api/screens` on server
- ❌ Wrong: `https://api.menupi.com/api/screens` → `/api/api/screens` on server (404/403)

## Protection Layers (Already in Code)

Even if the env var is wrong, we have:
1. ✅ **Fetch Interceptor** - Catches and fixes URLs at runtime
2. ✅ **URL Sanitizer** - Removes double `/api/` prefix
3. ✅ **Centralized Utility** - All new code uses `apiUrl()` helper

But the **best fix** is to set the environment variable correctly!

---

**Status:** ⚠️ **Action Required** - Update Vercel environment variable NOW!

