# 🚨 URGENT: Create Web Service in Railway

## Problem

Railway is deploying your backend code to the **MySQL service** (wrong!). You need a **separate web service** for your Node.js backend.

**Current Status**:
- ❌ Backend deployed to MySQL service
- ❌ Server gets `PORT=3306` (database port)
- ❌ Server exits immediately (correctly rejects port 3306)
- ❌ All endpoints return 404

## ✅ SOLUTION: Create Web Service

### Step-by-Step Instructions

1. **Open Railway Dashboard**
   - Go to: https://railway.app/dashboard
   - Login if needed

2. **Go to Your Project**
   - Click on project: **optimistic-hope**

3. **Create New Web Service**
   - Click **"+ New"** button (top right)
   - Select **"Service"**
   - Choose **"GitHub Repo"**
   - Connect to: `fakharu6036/display-menupi`
   - Select branch: **`master`**
   - Click **"Deploy"**

4. **Railway Will Auto-Configure**
   - Railway detects Node.js automatically
   - Creates web service
   - Sets `PORT` automatically (usually 8080)
   - Starts building and deploying

5. **Link MySQL Service to Web Service**
   - In your new **Web Service**
   - Go to **"Variables"** tab
   - Click **"Add Reference"** or **"New Variable"**
   - Select **MySQL service**
   - Railway will auto-add:
     - `MYSQLHOST` → `DB_HOST`
     - `MYSQLUSER` → `DB_USER`
     - `MYSQLPASSWORD` → `DB_PASSWORD`
     - `MYSQLDATABASE` → `DB_NAME`

6. **Add JWT_SECRET**
   - Web Service → **Variables** tab
   - Click **"New Variable"**
   - Name: `JWT_SECRET`
   - Value: `[generate a random secret]`
   - Click **"Add"**

7. **Wait for Deployment**
   - Railway will build and deploy automatically
   - Wait 2-3 minutes
   - Check **"Logs"** tab

## 📋 Expected Results

### Server Logs (After Web Service Created):
```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 8080  (NOT 3306)
🌐 Base URL: https://api.menupi.com
📅 Deployed: 2025-12-25 (v2.0.0)
✅ Code Version: fe9af59
============================================================
✅ Database connected
✅ Tables ready
```

### Endpoints (After Web Service Created):
- ✅ `GET https://api.menupi.com/` → Returns API info JSON
- ✅ `GET https://api.menupi.com/api/health` → Returns health status JSON

## 🎯 Why This Works

**Before (Wrong)**:
- Backend → MySQL service → `PORT=3306` → Server exits → 404

**After (Correct)**:
- Backend → Web service → `PORT=8080` → Server starts → Routes work ✅

## ⚠️ Important Notes

1. **MySQL service** = Database only (don't deploy code here)
2. **Web service** = Your Node.js backend (deploy code here)
3. Railway auto-sets `PORT` for web services
4. Link MySQL to web service for database access

## 🔧 After Creating Web Service

### Link Railway CLI (Optional)

If you want to use Railway CLI:
```bash
# Get service ID from Railway Dashboard
railway service link [web-service-id]
```

### Verify

```bash
railway service status
```

Should show your web service, not MySQL.

---

**Status**: 🚨 **URGENT** - Need to create web service  
**Action**: **Create web service in Railway Dashboard** (see steps above)  
**Code Status**: ✅ **Ready** - Will work once deployed to web service

