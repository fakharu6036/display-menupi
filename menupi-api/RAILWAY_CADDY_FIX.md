# 🔧 Fix: Railway Using Caddy Instead of Node.js

## Problem
Railway logs show Caddy starting instead of Node.js:
```
Starting Container
HTTP/3 skipped because it requires TLS
serving initial configuration
```

This means Railway thinks this is a static site, not a Node.js API.

## ✅ Solution Applied

I've added:
1. **Procfile** - Tells Railway this is a web service that runs `npm start`
2. **Updated railway.json** - Explicit Node.js configuration
3. **.railwayignore** - Excludes unnecessary files

## 🚀 Next Steps

### 1. Redeploy in Railway
1. Go to Railway Dashboard
2. Your Service → **Deployments** tab
3. Click **"Redeploy"** on latest deployment
4. Or wait for auto-redeploy (should happen automatically)

### 2. Verify Service Type
1. Railway Dashboard → Your Service → **Settings**
2. Check **"Service Type"** should be: **"Web Service"**
3. If it says "Static Site" or "Caddy", change it to "Web Service"

### 3. Verify Start Command
1. Railway Dashboard → Your Service → **Settings**
2. **Start Command** should be: `npm start`
3. If different, change it to: `npm start`

### 4. Verify Root Directory
1. Railway Dashboard → Your Service → **Settings**
2. **Root Directory** should be: `menupi-api`
3. This is CRITICAL - Railway must know where package.json is

### 5. Check Logs After Redeploy
After redeploy, logs should show:
```
✅ npm start
✅ MENUPI Digital Signage API running on 0.0.0.0:PORT
```

**NOT:**
```
❌ Starting Container (Caddy)
❌ serving initial configuration
```

## 🔍 If Still Using Caddy

### Option 1: Delete and Recreate Service
1. Delete the current service in Railway
2. Create new service
3. Select: "Deploy from GitHub"
4. Choose: `fakharu6036/display-menupi`
5. **Set Root Directory:** `menupi-api`
6. **Service Type:** Web Service (not Static Site)
7. **Start Command:** `npm start`

### Option 2: Change Service Type Manually
1. Railway Dashboard → Your Service → **Settings**
2. Find **"Service Type"** or **"Runtime"**
3. Change from "Static Site" to **"Web Service"** or **"Node.js"**
4. Save and redeploy

### Option 3: Check Build Settings
1. Railway Dashboard → Your Service → **Settings**
2. **Build Command:** Should be empty or `npm install`
3. **Start Command:** Must be `npm start`
4. **Root Directory:** Must be `menupi-api`

## ✅ Verification

After fix, Railway logs should show:
```
> menupi-api@1.0.0 start
> node server.js

MENUPI Digital Signage API running on 0.0.0.0:PORT
Environment: production
```

**NOT Caddy logs!**

## 📝 Railway Service Configuration Checklist

- [ ] Service Type: **Web Service** (not Static Site)
- [ ] Root Directory: **menupi-api**
- [ ] Start Command: **npm start**
- [ ] Build Command: (empty or `npm install`)
- [ ] Procfile exists in `menupi-api/` folder
- [ ] package.json exists in `menupi-api/` folder
- [ ] server.js exists in `menupi-api/` folder

---

**The fix has been pushed to GitHub. Redeploy in Railway to apply!**

