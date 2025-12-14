# 🐛 Railway Troubleshooting Guide

## Common Issues and Fixes

### ❌ "Application failed to respond"

**Cause:** Server binding to localhost instead of 0.0.0.0

**Fix:** ✅ Already fixed in latest commit
- Server now binds to `0.0.0.0` which allows Railway to connect
- Redeploy after pulling latest code

**Verify:** Check deploy logs for:
```
MENUPI Digital Signage API running on 0.0.0.0:PORT
```

---

### ❌ Database Connection Errors

**Symptoms:**
- `ER_ACCESS_DENIED_ERROR`
- `ECONNREFUSED`
- `ETIMEDOUT`

**Fixes:**

1. **Verify MySQL addon is running:**
   - Railway Dashboard → Your Project → MySQL Service
   - Check status is "Active"

2. **Use Railway's MySQL variables:**
   ```bash
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   ```

3. **Or manually set from MySQL service:**
   - Go to MySQL service → Variables
   - Copy `MYSQLHOST`, `MYSQLUSER`, etc.
   - Set in your API service environment variables

4. **Test connection:**
   - Use Railway's MySQL console
   - Or check health endpoint: `/api/health`

---

### ❌ Port Configuration Issues

**Symptoms:**
- Server starts but no response
- Port already in use errors

**Fix:**
- Railway automatically sets `PORT` environment variable
- Don't hardcode port numbers
- Server uses: `process.env.PORT || 3001`

**Verify:**
- Check Railway logs for: `running on 0.0.0.0:PORT`
- Port should match Railway's assigned port

---

### ❌ Missing Environment Variables

**Symptoms:**
- `JWT_SECRET is not defined`
- `DB_HOST is not defined`
- CORS errors

**Fix:**
1. **Go to Railway Dashboard → Your Service → Variables**
2. **Add all required variables:**
   ```bash
   NODE_ENV=production
   PORT=3001  # Usually auto-set by Railway
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   JWT_SECRET=your_secret_here_min_32_chars
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   ```

3. **Redeploy after adding variables**

---

### ❌ Build/Dependency Errors

**Symptoms:**
- `npm install` fails
- Module not found errors
- Build timeout

**Fixes:**

1. **Check Node.js version:**
   - Railway uses Node 18+ by default
   - Verify in `package.json`: `"node": ">=18.0.0"`

2. **Clear build cache:**
   - Railway Dashboard → Service → Settings
   - Click "Clear Build Cache"
   - Redeploy

3. **Check package.json:**
   - All dependencies listed correctly
   - No conflicting versions

---

### ❌ CORS Errors

**Symptoms:**
- `Access-Control-Allow-Origin` errors
- Frontend can't connect to API

**Fix:**
1. **Verify `ALLOWED_ORIGINS` includes your frontend:**
   ```bash
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   ```

2. **For testing, temporarily add Railway URL:**
   ```bash
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com,https://your-app.up.railway.app
   ```

3. **Check CORS middleware is configured** (already done in server.js)

---

### ❌ File Upload Issues

**Symptoms:**
- Uploads fail
- `ENOENT` errors
- Permission denied

**Fix:**
1. **Verify `uploads/` directory exists:**
   - Should be created automatically
   - Check Railway logs for directory creation

2. **For persistent storage, use Railway volumes:**
   - Railway Dashboard → Service → Volumes
   - Mount volume to `/uploads`

3. **Check file size limits:**
   - `MAX_FILE_SIZE=52428800` (50MB)
   - Adjust if needed

---

### ❌ Health Endpoint Not Responding

**Test:**
```bash
curl https://your-app.up.railway.app/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected",
  "uptime": ...
}
```

**If fails:**
1. Check Railway logs for errors
2. Verify server started successfully
3. Check database connection status
4. Verify PORT is set correctly

---

### ❌ Service Keeps Restarting

**Causes:**
- Application crashes on startup
- Database connection fails
- Missing environment variables
- Port binding issues

**Debug:**
1. **Check Railway logs:**
   - Railway Dashboard → Service → Logs
   - Look for error messages

2. **Common errors:**
   - `Cannot find module` → Missing dependency
   - `ECONNREFUSED` → Database not connected
   - `EADDRINUSE` → Port conflict
   - `JWT_SECRET is required` → Missing env var

3. **Fix and redeploy**

---

## 🔍 Debugging Steps

### 1. Check Logs
```bash
# Railway Dashboard → Service → Logs
# Look for:
- Server startup message
- Database connection status
- Error messages
- Port binding confirmation
```

### 2. Test Health Endpoint
```bash
curl https://your-app.up.railway.app/api/health
```

### 3. Verify Environment Variables
- Railway Dashboard → Service → Variables
- All required vars should be set
- Check for typos

### 4. Check Database Connection
- Railway Dashboard → MySQL Service
- Verify service is running
- Check connection variables

### 5. Test Locally First
```bash
# Clone repo
git clone https://github.com/fakharu6036/display-menupi.git
cd display-menupi/menupi-api

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run locally
npm start

# Test
curl http://localhost:3001/api/health
```

---

## ✅ Quick Checklist

Before reporting issues, verify:

- [ ] Server binds to `0.0.0.0` (not localhost)
- [ ] All environment variables are set
- [ ] MySQL addon is running
- [ ] Database variables are correct
- [ ] `JWT_SECRET` is set (min 32 chars)
- [ ] `ALLOWED_ORIGINS` includes frontend domains
- [ ] Health endpoint responds: `/api/health`
- [ ] Railway logs show successful startup
- [ ] No errors in Railway logs

---

## 📞 Getting Help

1. **Check Railway logs** first
2. **Test health endpoint** to verify server is running
3. **Verify environment variables** are all set
4. **Check this troubleshooting guide**
5. **Railway Support:** https://railway.app/support

---

**Last Updated:** 2024

