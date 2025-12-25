# 🚨 IMMEDIATE FIX: Railway Service Link Issue

## Current Status

**Problem**: Railway CLI is linked to **MySQL service** instead of **Web service**
- Service status: `Service: MySQL` ❌
- Deployment status: `CRASHED` (correctly - code rejects port 3306)
- Port detected: `3306` (database port, not web port)

## ✅ Code Status

The code is **correctly detecting** the issue and exiting with clear error message. This is good!

## 🔧 REQUIRED FIX: Link Railway CLI to Web Service

### Step 1: Open Railway Dashboard

1. Go to: https://railway.app/dashboard
2. Select your project: **optimistic-hope**

### Step 2: Find Your Web Service

In your project, you should see **TWO services**:
- **MySQL** (database service) ❌ Currently linked
- **Web Service** or **Node.js Service** (your backend) ✅ Should be linked

**If you don't see a web service**, you need to create one:
1. Railway Dashboard → Your Project
2. Click **"+ New"** → **"Service"**
3. Select **"GitHub Repo"** → Connect to `fakharu6036/display-menupi`
4. Railway will auto-detect it's a Node.js app
5. This creates a new web service

### Step 3: Link Railway CLI to Web Service

**Option A: Using Service Name**
```bash
# List services to find the name
# Then link:
railway service link [web-service-name]
```

**Option B: Using Service ID**
1. Railway Dashboard → Your Web Service
2. Click on the service
3. Copy the **Service ID** from URL or settings
4. Run:
```bash
railway service link [service-id]
```

**Option C: Via Railway Dashboard**
1. Railway Dashboard → Your Web Service
2. Click **"Settings"** → **"CLI"**
3. Follow instructions to link via CLI

### Step 4: Verify Service Link

```bash
railway service status
```

**Should show**:
```
Service: [your-web-service-name]  ✅
Status: SUCCESS
```

**NOT**:
```
Service: MySQL  ❌
```

### Step 5: Check Variables

```bash
railway variables
```

**Should show**:
- ✅ `PORT=8080` (or similar web port, NOT 3306)
- ✅ `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- ❌ NOT `RAILWAY_TCP_APPLICATION_PORT=3306`

### Step 6: Redeploy

```bash
railway up --detach
```

## 📋 Expected Results After Fix

### Server Logs:
```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 8080  (NOT 3306)
🌐 Base URL: https://api.menupi.com
📅 Deployed: 2025-12-25 (v2.0.0)
✅ Code Version: a2b11ca
============================================================
✅ Database connected
✅ Tables ready
```

### Endpoints:
- ✅ `GET https://api.menupi.com/` → Returns API info JSON
- ✅ `GET https://api.menupi.com/api/health` → Returns health status JSON

## 🎯 Quick Test After Fix

```bash
# Test root endpoint
curl https://api.menupi.com/

# Test health endpoint  
curl https://api.menupi.com/api/health
```

Both should return JSON, not 404.

## ⚠️ Important Notes

1. **MySQL service** is for the database only - don't deploy code there
2. **Web service** is for your Node.js backend - deploy code there
3. Railway auto-sets `PORT` for web services (usually 8080)
4. Database variables should be **referenced** from MySQL service, not copied

---

**Status**: ⚠️ **CRITICAL** - Railway linked to wrong service  
**Action**: **Link Railway CLI to web service** (not MySQL)  
**Code Status**: ✅ **Working correctly** - Detects and rejects database ports

