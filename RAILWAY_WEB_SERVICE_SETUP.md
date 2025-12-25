# Railway Web Service Setup Guide

## 🚨 Current Issue

Railway is deploying your backend code to the **MySQL service** instead of a **web service**. This is why:
- Server gets `PORT=3306` (MySQL port)
- Code correctly rejects it
- Server never starts
- All endpoints return 404

## ✅ Solution: Create/Link Web Service

Railway needs a **separate web service** for your Node.js backend. The MySQL service is only for the database.

### Option 1: Create New Web Service (Recommended)

1. **Railway Dashboard** → https://railway.app/dashboard
2. Go to your project: **optimistic-hope**
3. Click **"+ New"** → **"Service"**
4. Select **"GitHub Repo"**
5. Connect to: `fakharu6036/display-menupi`
6. Select branch: **`master`**
7. Railway will:
   - Auto-detect it's a Node.js app
   - Create a new web service
   - Auto-set `PORT` (usually 8080)
   - Start deploying

### Option 2: Check if Web Service Already Exists

1. **Railway Dashboard** → Your Project
2. Look for services - you should see:
   - **MySQL** (database service) ❌
   - **Web Service** or **Node.js Service** (backend) ✅
3. If web service exists:
   - Click on it
   - Copy the **Service ID** from URL
   - Link Railway CLI:
     ```bash
     railway service link [web-service-id]
     ```

### Option 3: Use Railway Dashboard to Deploy

1. **Railway Dashboard** → Your Project
2. Click **"+ New"** → **"Service"** → **"GitHub Repo"**
3. Select your repo: `fakharu6036/display-menupi`
4. Railway will create web service automatically
5. **Link MySQL service** to web service:
   - Web Service → **Variables** tab
   - Click **"Add Reference"**
   - Select **MySQL service**
   - Railway will auto-add database variables

## 📋 After Creating Web Service

### Step 1: Link Railway CLI

```bash
railway service link [web-service-id]
```

### Step 2: Verify

```bash
railway service status
```

Should show:
```
Service: [web-service-name]  ✅
Status: SUCCESS
```

### Step 3: Check Variables

```bash
railway variables
```

Should show:
- ✅ `PORT=8080` (or similar, NOT 3306)
- ✅ Database variables (from MySQL service reference)

### Step 4: Redeploy

```bash
railway up --detach
```

## 🎯 Expected Results

### Server Logs:
```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 8080  (NOT 3306)
🌐 Base URL: https://api.menupi.com
📅 Deployed: 2025-12-25 (v2.0.0)
✅ Code Version: dfcc61d
============================================================
✅ Database connected
✅ Tables ready
```

### Endpoints:
- ✅ `GET https://api.menupi.com/` → Returns API info JSON
- ✅ `GET https://api.menupi.com/api/health` → Returns health status JSON

## ⚠️ Important

- **MySQL service** = Database only (don't deploy code here)
- **Web service** = Your Node.js backend (deploy code here)
- Railway auto-sets `PORT` for web services
- Link MySQL service to web service for database access

---

**Status**: ⚠️ **Need to create/link web service**  
**Action**: **Create web service in Railway Dashboard**  
**Code Status**: ✅ **Ready** - Will work once deployed to web service

