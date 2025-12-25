# 🚨 EXACT STEPS: Fix Railway Deployment

## Current Problem

Railway is deploying your **Node.js backend code to the MySQL service**. This is **WRONG**.

**What's happening**:
- MySQL service gets `PORT=3306` (database port)
- Your code correctly rejects it ✅
- Server exits immediately
- All endpoints return 404

## ✅ SOLUTION: Create Web Service

### Step 1: Open Railway Dashboard

1. Go to: **https://railway.app/dashboard**
2. Login if needed
3. Click on project: **optimistic-hope**

### Step 2: Check Current Services

You should see:
- **MySQL** service (database) ❌ Currently has your code (WRONG!)

### Step 3: Create New Web Service

**IMPORTANT**: You need a **separate service** for your backend code.

1. In Railway Dashboard, click **"+ New"** button (top right)
2. Select **"Service"**
3. Choose **"GitHub Repo"**
4. If prompted, authorize Railway to access GitHub
5. Select repository: **`fakharu6036/display-menupi`**
6. Select branch: **`master`**
7. Click **"Deploy"** or **"Add Service"**

### Step 4: Railway Auto-Configuration

Railway will:
- ✅ Detect it's a Node.js app
- ✅ Create a **web service** (not database service)
- ✅ Auto-set `PORT` (usually 8080, NOT 3306)
- ✅ Start building and deploying
- ✅ Assign domain: `api.menupi.com`

### Step 5: Link MySQL Service to Web Service

**This gives your web service access to the database:**

1. In your **new Web Service** (not MySQL)
2. Go to **"Variables"** tab
3. Click **"New Variable"** or **"Add Reference"**
4. Select **"Reference Variable"** or **"Add from Service"**
5. Choose **MySQL service**
6. Railway will auto-add these references:
   - `MYSQLHOST` → Use as `DB_HOST`
   - `MYSQLUSER` → Use as `DB_USER`
   - `MYSQLPASSWORD` → Use as `DB_PASSWORD`
   - `MYSQLDATABASE` → Use as `DB_NAME`

**OR** manually add these variables (get values from MySQL service):
- `DB_HOST` = `mysql.railway.internal`
- `DB_USER` = `root`
- `DB_PASSWORD` = `[from MySQL service]`
- `DB_NAME` = `railway`

### Step 6: Add JWT_SECRET

1. Web Service → **Variables** tab
2. Click **"New Variable"**
3. Name: `JWT_SECRET`
4. Value: Generate a random secret (e.g., use: `openssl rand -base64 32`)
5. Click **"Add"**

### Step 7: Wait for Deployment

1. Railway will build and deploy automatically
2. Wait 2-3 minutes
3. Check **"Logs"** tab in your **Web Service**

## 📋 Expected Results

### Server Logs (In Web Service):
```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 8080  (NOT 3306)
🌐 Base URL: https://api.menupi.com
📅 Deployed: 2025-12-25 (v2.0.0)
✅ Code Version: 8aafa71
============================================================
✅ Database connected
✅ Tables ready
```

### Endpoints (After Web Service Created):
- ✅ `GET https://api.menupi.com/` → Returns API info JSON
- ✅ `GET https://api.menupi.com/api/health` → Returns health status JSON

## 🎯 Why This Works

**Current (Wrong)**:
```
GitHub Repo → MySQL Service → PORT=3306 → Server exits → 404
```

**After Fix (Correct)**:
```
GitHub Repo → Web Service → PORT=8080 → Server starts → Routes work ✅
MySQL Service → Linked to Web Service → Database access ✅
```

## ⚠️ Important

- **MySQL service** = Database ONLY (don't deploy code here)
- **Web service** = Your Node.js backend (deploy code here)
- Railway auto-sets `PORT` for web services
- Link MySQL to web service for database variables

## 🔧 After Creating Web Service

### Optional: Link Railway CLI

If you want to use Railway CLI with the new web service:

1. Get Service ID from Railway Dashboard (web service URL)
2. Run:
   ```bash
   railway service link [web-service-id]
   ```

### Verify

```bash
railway service status
```

Should show your web service, not MySQL.

---

**Status**: 🚨 **URGENT** - Need to create web service  
**Action**: **Follow steps above in Railway Dashboard**  
**Code Status**: ✅ **Ready** - Will work once deployed to web service

