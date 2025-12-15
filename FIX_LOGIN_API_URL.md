# 🔧 Fix "Failed to fetch" on Login

## 🔍 Problem

Login is failing with "Failed to fetch" because the frontend is using the wrong API URL format.

**Current (Wrong):**
- `VITE_API_URL` = `https://api.menupi.com/api`
- Frontend calls: `https://api.menupi.com/api/login` ❌ (double `/api/` prefix)

**Should Be:**
- `VITE_API_URL` = `https://api.menupi.com`
- Frontend calls: `https://api.menupi.com/login` ✅

---

## ✅ Solution

### Step 1: Update Vercel Environment Variable

1. **Go to Vercel Dashboard:**
   - https://vercel.com/fakharu6036s-projects/menupi-signage/settings/environment-variables

2. **Find `VITE_API_URL`** and **change it:**
   - **From:** `https://api.menupi.com/api`
   - **To:** `https://api.menupi.com`

3. **Save** and **redeploy** (or wait for auto-deploy)

### Step 2: Verify After Deployment

After redeploy, test login:
- Should connect to: `https://api.menupi.com/login`
- Should work correctly ✅

---

## 📝 Why This Happens

The `api.menupi.com` subdomain points directly to the `/api/` directory on Hostinger. So:

- ✅ `https://api.menupi.com/login` → Routes to `/api/login` → Works
- ❌ `https://api.menupi.com/api/login` → Tries to access `/api/api/login` → 404

---

## 🔄 Code Changes

I've also updated `services/storage.ts` to automatically handle this:
- Removes `/api` suffix from `VITE_API_URL` if present
- Works with both old and new configurations
- Maintains backward compatibility

---

## ✅ Quick Fix

**Just update the Vercel environment variable:**
```
VITE_API_URL = https://api.menupi.com
```

(Remove the `/api` suffix)

Then redeploy or wait for auto-deploy.

---

**After this change, login should work!** ✅

