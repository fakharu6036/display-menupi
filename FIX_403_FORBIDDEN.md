# 🔧 Fix 403 Forbidden Errors

## 🔍 Problem

All API endpoints are returning **403 Forbidden**:
- `GET https://api.menupi.com/api/screens` - 403
- `GET https://api.menupi.com/api/media` - 403
- `GET https://api.menupi.com/api/storage/usage` - 403
- `GET https://api.menupi.com/api/users/me/refresh` - 403

**Root Cause:** Frontend is still using **double `/api/` prefix**:
- ❌ `https://api.menupi.com/api/screens` (wrong - double prefix)
- ✅ `https://api.menupi.com/screens` (correct)

---

## ✅ Solution

### The Issue

The deployed frontend build still has the old `VITE_API_URL` value (`https://api.menupi.com/api`). Even though we updated the environment variable, **Vercel needs to rebuild** the frontend to use the new value.

### Fix Applied

1. ✅ **Updated Vercel Environment Variable:**
   - Changed from: `https://api.menupi.com/api`
   - Changed to: `https://api.menupi.com`

2. ✅ **Triggered Redeploy:**
   - Pushed empty commit to trigger auto-deploy
   - Vercel will rebuild with new environment variable

---

## ⏳ Wait for Deployment

**Vercel is now rebuilding** with the correct API URL. This usually takes **1-3 minutes**.

### Check Deployment Status:

1. Go to: https://vercel.com/fakharu6036s-projects/menupi-signage
2. Check the latest deployment
3. Wait for it to complete

---

## ✅ After Deployment

Once Vercel finishes deploying:

1. **Hard refresh browser:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache** or use incognito mode
3. **Test login again**

The frontend should now call:
- ✅ `https://api.menupi.com/screens` (no double prefix)
- ✅ `https://api.menupi.com/media`
- ✅ `https://api.menupi.com/storage/usage`

---

## 🔍 Verify Fix

After deployment, check browser console:
- Should see: `GET https://api.menupi.com/screens` (not `/api/screens`)
- Should return: `200 OK` (not `403 Forbidden`)

---

## 📝 Why This Happened

1. **Environment variables** are baked into the build at build time
2. **Changing the variable** doesn't automatically rebuild
3. **Need to trigger a new deployment** to pick up the change

---

**Status:** ✅ Environment variable updated, redeploy triggered. Wait 1-3 minutes for deployment to complete.

