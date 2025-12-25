# Railway Service Configuration Fix

## 🚨 Critical Issue Found

**Problem**: Server is running on port 3306 (MySQL port) instead of web port.

**Root Cause**: Railway is setting `PORT` from `RAILWAY_TCP_APPLICATION_PORT=3306` which comes from the MySQL service.

**Evidence**:
- Logs show: `📡 Port: 3306`
- Variables show: `RAILWAY_TCP_APPLICATION_PORT=3306`
- Endpoints return 404 because server is on wrong port

## ✅ Code Fix Applied

Updated `server.js` to:
1. Check both `PORT` and `RAILWAY_TCP_APPLICATION_PORT`
2. Reject database ports (3306, 5432, 27017)
3. Provide clear error messages with fix instructions

## 🔧 Railway Configuration Fix Required

### The Real Problem

Railway CLI is currently linked to the **MySQL service** instead of the **web service**. That's why it's getting port 3306.

### Solution: Link to Correct Service

1. **Find your web service name**:
   - Railway Dashboard → Your Project
   - Look for the service that runs your Node.js backend (not MySQL)

2. **Link Railway CLI to web service**:
   ```bash
   railway service link [web-service-name]
   ```
   
   Or in Railway Dashboard:
   - Go to your **web service**
   - Copy the service ID
   - Use: `railway service link [service-id]`

3. **Verify service**:
   ```bash
   railway service status
   ```
   Should show your web service, not MySQL

4. **Check variables**:
   ```bash
   railway variables
   ```
   Should NOT show `RAILWAY_TCP_APPLICATION_PORT=3306`
   Should show `PORT` set to web port (8080 or similar)

5. **Redeploy**:
   ```bash
   railway up --detach
   ```

## 📋 Expected Results

After fixing service link:

### Variables Should Show:
- ✅ `PORT=8080` (or similar web port)
- ❌ NOT `RAILWAY_TCP_APPLICATION_PORT=3306`
- ✅ Database variables: `DB_HOST`, `DB_USER`, etc.

### Logs Should Show:
```
📡 Port: 8080  (NOT 3306)
✅ Database connected
✅ Tables ready
```

### Endpoints Should Work:
- ✅ `GET https://api.menupi.com/` → Returns API info
- ✅ `GET https://api.menupi.com/api/health` → Returns health status

## 🎯 Quick Fix Steps

1. **Railway Dashboard** → Your Project
2. **Identify web service** (the one that should run Node.js, not MySQL)
3. **Railway CLI**: `railway service link [web-service-name]`
4. **Verify**: `railway service status` (should show web service)
5. **Redeploy**: `railway up --detach`
6. **Test**: `curl https://api.menupi.com/`

---

**Status**: ✅ **Code fix applied**  
**Action Required**: **Link Railway CLI to web service** (not MySQL service)  
**Latest Commit**: `[latest]`

