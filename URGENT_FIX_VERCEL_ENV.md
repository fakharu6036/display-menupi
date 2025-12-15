# 🚨 URGENT: Fix Vercel Environment Variable

## Problem
The production deployment is still using the old environment variable value that includes `/api` suffix.

## Solution: Update Vercel Environment Variable

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/fakharu6036s-projects/menupi-signage/settings/environment-variables

### Step 2: Update Production Environment Variable
1. Find `VITE_API_URL` in the **Production** environment
2. **Current (WRONG):** `https://api.menupi.com/api`
3. **Change to (CORRECT):** `https://api.menupi.com` (remove `/api`)
4. Click **Save**

### Step 3: Redeploy
After updating the environment variable, you MUST redeploy:

**Option A: Via Dashboard**
1. Go to: https://vercel.com/fakharu6036s-projects/menupi-signage/deployments
2. Click the **three dots** (⋯) on the latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete (1-3 minutes)

**Option B: Via CLI**
```bash
cd /Users/mdfakharuddin/Desktop/menupi-signage
vercel --prod
```

## Why This Matters

- Vite bakes environment variables into the build at **build time**
- If `VITE_API_URL = https://api.menupi.com/api`, the build will use that value
- Our code removes `/api` suffix, but if the build was done with the wrong value, it's already baked in
- **New deployment with correct env var is required**

## Verification

After redeploying, check:
1. Open DevTools → Network tab
2. Try to login
3. API calls should be: `https://api.menupi.com/login` (NOT `https://api.menupi.com/api/login`)

---

**Status:** ⚠️ **ACTION REQUIRED** - Update Vercel env var and redeploy!

