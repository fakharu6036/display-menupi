# 🚀 Manual Redeploy to Fix Double /api/ Prefix

## 🔍 Problem

Frontend is still calling `https://api.menupi.com/api/...` (double prefix) because the deployed build is 4 hours old and doesn't have the updated environment variable.

---

## ✅ Solution: Trigger Manual Redeploy

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/fakharu6036s-projects/menupi-signage

2. **Click "Redeploy"** button on the latest deployment
   - Or go to **Deployments** tab
   - Find the latest deployment
   - Click **"..."** menu → **"Redeploy"**

3. **Wait 1-3 minutes** for deployment to complete

4. **Hard refresh browser:**
   - `Ctrl+Shift+R` (Windows)
   - `Cmd+Shift+R` (Mac)

### Option 2: Wait for Auto-Deploy

Since we pushed commits to GitHub, Vercel should auto-deploy. Check:
- https://vercel.com/fakharu6036s-projects/menupi-signage
- Look for a new deployment in progress
- Wait for it to complete

---

## ✅ Verify After Deployment

After redeploy completes:

1. **Hard refresh browser** (clear cache)
2. **Check browser console:**
   - Should see: `GET https://api.menupi.com/storage/usage` ✅
   - NOT: `GET https://api.menupi.com/api/storage/usage` ❌

3. **Test login** - should work now

---

## 🔍 Current Status

- ✅ **Environment Variable:** Updated to `https://api.menupi.com`
- ✅ **Code:** Fixed to remove `/api` suffix
- ⏳ **Deployment:** Needs to be rebuilt (4 hours old)

---

## 📝 Quick Steps

1. Go to Vercel Dashboard
2. Click "Redeploy" on latest deployment
3. Wait 1-3 minutes
4. Hard refresh browser (`Ctrl+Shift+R`)
5. Test again

---

**The fix is ready - just needs a new deployment!**

