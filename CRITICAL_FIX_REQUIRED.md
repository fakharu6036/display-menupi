# 🚨 CRITICAL: Railway Service Configuration Issue

## Problem Identified

**Railway CLI is linked to MySQL service instead of Web service!**

**Evidence**:
- `railway service status` shows: `Service: MySQL`
- Server is getting `PORT=3306` from MySQL service
- Endpoints return 404 because server can't start on database port

## ✅ Code Fix Applied

The code now:
1. ✅ Detects if PORT is set to database port (3306, 5432, 27017)
2. ✅ Exits with clear error message if database port detected
3. ✅ Provides instructions to fix the issue

**Latest commit**: `117bde0`

## 🔧 REQUIRED: Fix Railway Service Link

### Step 1: Find Your Web Service

1. **Railway Dashboard** → https://railway.app/dashboard
2. Go to your project: **optimistic-hope**
3. You should see **TWO services**:
   - **MySQL** (database service) ❌ Currently linked
   - **Web Service** or **Node.js Service** (your backend) ✅ Should be linked

### Step 2: Link Railway CLI to Web Service

**Option A: Via Railway Dashboard**
1. Railway Dashboard → Your Project
2. Click on your **Web Service** (not MySQL)
3. Copy the **Service ID** from the URL or settings
4. In terminal:
   ```bash
   railway service link [service-id]
   ```

**Option B: Via Railway Dashboard - Service Name**
1. Railway Dashboard → Your Project
2. Note the **name** of your web service
3. In terminal:
   ```bash
   railway service link [web-service-name]
   ```

### Step 3: Verify Service Link

```bash
railway service status
```

Should show:
```
Service: [your-web-service-name]  ✅
Status: SUCCESS
```

NOT:
```
Service: MySQL  ❌
```

### Step 4: Check Variables

```bash
railway variables
```

Should show:
- ✅ `PORT=8080` (or similar web port, NOT 3306)
- ✅ `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- ❌ NOT `RAILWAY_TCP_APPLICATION_PORT=3306`

### Step 5: Redeploy

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
✅ Code Version: 117bde0
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

---

**Status**: ⚠️ **CRITICAL** - Railway linked to wrong service  
**Action**: **Link Railway CLI to web service** (not MySQL)  
**Code Status**: ✅ **Fixed** - Will reject database ports

