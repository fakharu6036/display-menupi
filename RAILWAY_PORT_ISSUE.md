# Railway Port Issue - Server Running on Wrong Port

## 🚨 Problem Identified

The server is running on **port 3306** (MySQL port) instead of the web service port (usually 8080).

**Evidence from logs**:
```
📡 Port: 3306
```

**This is wrong!** The server should be running on Railway's web service port, not the MySQL port.

## Root Cause

Railway is setting `PORT=3306` from the MySQL service instead of the web service port.

## ✅ Solution

### Step 1: Check Railway Service Configuration

1. **Railway Dashboard** → Your Project
2. Check which service is running the backend
3. The **web service** (not MySQL) should have `PORT` set automatically by Railway
4. Make sure you're deploying to the **web service**, not the MySQL service

### Step 2: Verify Service Type

The backend should be deployed as a **web service**, not a database service.

1. Railway Dashboard → Your Service
2. Check **Service Type** - should be "Web Service" or "Node.js"
3. If it's showing as "MySQL" or "Database", that's the problem

### Step 3: Check Railway Variables

1. Railway Dashboard → Your **Web Service** (not MySQL)
2. **Variables** tab
3. Check if `PORT` is set
4. Railway should auto-set `PORT` for web services (usually 8080 or similar)
5. If `PORT` is missing or set to 3306, that's the issue

### Step 4: Fix Port Variable

**Option A: Let Railway Auto-Set (Recommended)**
- Remove any manual `PORT` variable
- Railway will automatically set it for web services

**Option B: Set Correct Port**
- If you need to set it manually, use a web port (8080, 3000, etc.)
- NOT 3306 (that's MySQL)

### Step 5: Redeploy

After fixing the port:
```bash
railway up --detach
```

## Expected Result

After fix, logs should show:
```
📡 Port: 8080  (or similar web port, NOT 3306)
```

And the API should be accessible at:
- `https://api.menupi.com/` ✅
- `https://api.menupi.com/api/health` ✅

## Why This Happens

Railway might be:
1. Deploying to the wrong service (MySQL instead of web)
2. Using MySQL service's PORT variable
3. Not setting PORT for the web service

## Quick Fix Checklist

- [ ] Verify backend is deployed to **web service** (not MySQL)
- [ ] Check web service has `PORT` variable (or Railway auto-sets it)
- [ ] Remove any `PORT=3306` from web service variables
- [ ] Redeploy web service
- [ ] Verify logs show correct port (8080, not 3306)
- [ ] Test endpoints work

---

**Status**: ⚠️ **Server running on wrong port (3306)**  
**Action**: **Fix Railway service configuration**  
**Expected**: Server should run on web port (8080), not MySQL port (3306)

