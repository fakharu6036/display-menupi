# 🔄 Manual Railway Redeploy Instructions

## If Railway Didn't Auto-Redeploy

### Option 1: Trigger Redeploy in Railway Dashboard

1. **Go to Railway Dashboard:** https://railway.app
2. **Select your project** (MENUPI API)
3. **Go to:** Deployments tab
4. **Click:** "Redeploy" button on the latest deployment
5. **Or:** Click "New Deployment" → Select latest commit

### Option 2: Push Empty Commit (Force Redeploy)

```bash
git commit --allow-empty -m "Trigger Railway redeploy - fix server binding"
git push origin main
```

### Option 3: Check Auto-Deploy Settings

1. **Railway Dashboard** → Your Service → Settings
2. **Check:** "Auto Deploy" is enabled
3. **Verify:** GitHub integration is connected
4. **Check:** Root directory is set to `menupi-api/`

## ✅ Verify the Fix is Deployed

### 1. Check Railway Logs

After redeploy, check logs for:
```
MENUPI Digital Signage API running on 0.0.0.0:PORT
```

**If you see:**
- `running on 0.0.0.0:PORT` ✅ **Fixed!**
- `running on port PORT` (no host) ❌ **Still needs fix**

### 2. Test Health Endpoint

```bash
curl https://api.menupi.com/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected",
  "uptime": ...
}
```

### 3. Check for Errors

Look in Railway logs for:
- ❌ `Error: listen EADDRINUSE` → Port conflict
- ❌ `ECONNREFUSED` → Database not connected
- ❌ `JWT_SECRET is required` → Missing env var
- ❌ `Cannot find module` → Missing dependency

## 🔍 Common Issues After Redeploy

### Issue: Still Getting "Application failed to respond"

**Possible causes:**

1. **Railway hasn't redeployed yet**
   - Wait 1-2 minutes after push
   - Check Railway dashboard for new deployment

2. **Wrong root directory**
   - Railway Dashboard → Service → Settings
   - Verify: Root Directory = `menupi-api/`

3. **Environment variables missing**
   - Railway Dashboard → Service → Variables
   - Check all required vars are set

4. **Database connection failing**
   - Check MySQL addon is running
   - Verify DB_* variables are correct

5. **Port binding still wrong**
   - Check logs for host binding
   - Should see `0.0.0.0`, not `localhost`

### Issue: Health Endpoint Returns 500

**Check:**
- Database connection (most common)
- Missing environment variables
- Check Railway logs for specific error

### Issue: CORS Errors

**Fix:**
- Add Railway URL to ALLOWED_ORIGINS temporarily:
  ```
  ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com,https://your-app.up.railway.app
  ```

## 🚀 Quick Fix Checklist

- [ ] Code pushed to GitHub (commit `840d00b` or later)
- [ ] Railway auto-deploy enabled OR manual redeploy triggered
- [ ] Root directory set to `menupi-api/`
- [ ] All environment variables set
- [ ] MySQL addon running
- [ ] Logs show `running on 0.0.0.0:PORT`
- [ ] Health endpoint responds: `/api/health`
- [ ] No errors in Railway logs

## 📞 Still Not Working?

1. **Share Railway logs** (last 50 lines)
2. **Share health endpoint response** (if any)
3. **Verify commit is deployed:**
   - Railway Dashboard → Deployments
   - Check latest commit hash matches GitHub

---

**Last Updated:** 2024

