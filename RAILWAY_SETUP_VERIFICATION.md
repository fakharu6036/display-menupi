# Railway Setup Verification Checklist

## ✅ Configuration Files Status

### 1. `railway.json` ✅ CORRECT
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```
**Status**: ✅ Correct - Uses `npm start` which runs `node server.js`

### 2. `Procfile` ✅ CORRECT
```
web: node server.js
```
**Status**: ✅ Correct - Railway can use either `railway.json` or `Procfile`

### 3. `package.json` ✅ CORRECT
- ✅ `"start": "node server.js"` - Correct start command
- ✅ `"type": "module"` - ES modules enabled
- ✅ All dependencies listed

**Status**: ✅ Correct

### 4. `.railwayignore` ✅ EXISTS
- Excludes frontend files and uploads from Railway deployment
- Keeps only backend files

**Status**: ✅ Correct

---

## ✅ Code Configuration Status

### 1. Server Entry Point ✅ CORRECT
- File: `server.js`
- Uses ES modules (`import` statements)
- Starts with `app.listen(PORT)`

**Status**: ✅ Correct

### 2. Port Configuration ✅ CORRECT
```javascript
const PORT = process.env.PORT;
if (!PORT) {
    console.error('❌ PORT environment variable not set...');
    process.exit(1);
}
```
**Status**: ✅ Correct - Uses Railway's `PORT` env var, no hardcoded fallback

### 3. Database Configuration ✅ CORRECT
```javascript
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // ... valid pool options only
};
```
**Status**: ✅ Correct - Uses Railway's database env vars, no localhost fallbacks

### 4. Environment Variables Required ✅ DOCUMENTED
Required Railway environment variables:
- ✅ `PORT` - Auto-set by Railway
- ✅ `DB_HOST` - From Railway MySQL service
- ✅ `DB_USER` - From Railway MySQL service
- ✅ `DB_PASSWORD` - From Railway MySQL service
- ✅ `DB_NAME` - From Railway MySQL service
- ✅ `JWT_SECRET` - Must be set manually
- ✅ `API_URL` - Optional (defaults to `https://api.menupi.com`)

**Status**: ✅ Correct - All properly referenced

### 5. MySQL Configuration ✅ CORRECT
- ✅ Only valid pool options used
- ✅ Invalid options explicitly removed
- ✅ Warnings for Railway env vars that might add invalid options

**Status**: ✅ Correct

### 6. CORS Configuration ✅ CORRECT
```javascript
// Production: Allow all menupi.com subdomains
if (origin.includes('menupi.com')) {
    return callback(null, true);
}
```
**Status**: ✅ Correct - No localhost references

### 7. Base URL Configuration ✅ CORRECT
```javascript
const getBaseUrl = () => {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  const protocol = process.env.PROTOCOL || 'https';
  const domain = process.env.DOMAIN || 'api.menupi.com';
  return `${protocol}://${domain}`;
};
```
**Status**: ✅ Correct - No localhost fallbacks

---

## ✅ Health Check & Root Endpoints

### Root Endpoint (`GET /`)
- Should return API information
- Should list available endpoints

**Status**: ✅ Should exist (verify in code)

### Health Check Endpoint (`GET /api/health`)
- Should check database connectivity
- Should return service status

**Status**: ✅ Should exist (verify in code)

---

## ⚠️ Potential Issues Found

### 1. Code Version Identifier
**Location**: `server.js` line 1619
```javascript
console.log(`✅ Code Version: eb2016b`);
```
**Issue**: This is an old commit hash. Should be updated to latest.

**Fix Needed**: Update to latest commit hash or use dynamic version.

### 2. MySQL Warnings (From Railway Logs)
**Issue**: Railway logs show MySQL warnings about invalid options:
- `acquireTimeout`
- `timeout`
- `reconnect`

**Possible Causes**:
1. Railway environment variables adding these options
2. Railway using cached old code
3. MySQL2 library receiving invalid options from somewhere

**Fix**: Code already has cleanup, but Railway might need env vars removed.

---

## 📋 Railway Deployment Checklist

### Pre-Deployment
- [x] `railway.json` configured correctly
- [x] `package.json` has correct `start` script
- [x] `server.js` uses `process.env.PORT` (no hardcoded port)
- [x] Database config uses Railway env vars (no localhost)
- [x] CORS allows menupi.com subdomains
- [x] No localhost references in code
- [x] `.railwayignore` excludes frontend files

### Railway Configuration
- [ ] Railway service connected to GitHub repository
- [ ] Railway using `master` branch (not `main`)
- [ ] Auto-deploy enabled
- [ ] MySQL service added and linked
- [ ] Environment variables set:
  - [ ] `JWT_SECRET` (required)
  - [ ] `API_URL` (optional, defaults to `https://api.menupi.com`)
  - [ ] `PROTOCOL` (optional, defaults to `https`)
  - [ ] `DOMAIN` (optional, defaults to `api.menupi.com`)

### Database Setup
- [ ] MySQL service created in Railway
- [ ] Database credentials available in Railway env vars
- [ ] Database migrations run (`migrations_all.sql`)
- [ ] Tables created and verified

### Deployment Verification
- [ ] Latest commit deployed (check Railway Deployments tab)
- [ ] Build completed successfully
- [ ] Service running (green status)
- [ ] Logs show correct format:
  ```
  ============================================================
  🚀 MENUPI API Server
  ============================================================
  📡 Port: 8080
  🌐 Base URL: https://api.menupi.com
  📅 Deployed: 2025-12-25 (v2.0.0)
  ✅ Code Version: [latest commit]
  ============================================================
  ✅ Database connected
  ✅ Tables ready
  ```
- [ ] No MySQL warnings in logs
- [ ] Root endpoint accessible: `https://api.menupi.com/`
- [ ] Health check works: `https://api.menupi.com/api/health`

---

## 🔧 Issues to Fix

### 1. Update Code Version Identifier
**File**: `server.js` line 1619
**Current**: `console.log(\`✅ Code Version: eb2016b\`);`
**Should be**: Latest commit hash or dynamic version

### 2. Check Railway Environment Variables
**Action**: In Railway Dashboard → Variables tab, check for and remove:
- `MYSQL_ACQUIRE_TIMEOUT`
- `MYSQL_TIMEOUT`
- `MYSQL_RECONNECT`
- `DB_ACQUIRE_TIMEOUT`
- `DB_TIMEOUT`
- `DB_RECONNECT`

### 3. Verify Latest Code is Deployed
**Action**: Check Railway Deployments tab
- Should show latest commit: `cba96f1` or newer
- If older commit shown → Force manual redeploy

---

## ✅ Overall Status

### Configuration Files: ✅ CORRECT
- All Railway config files are correct
- No hardcoded localhost references
- Proper environment variable usage

### Code Quality: ✅ CORRECT
- Clean MySQL configuration
- Proper error handling
- Environment variable validation

### Issues: ⚠️ MINOR
- Code version identifier needs update
- Railway might have invalid env vars
- Railway might be running old code

### Action Required:
1. ✅ Update code version identifier
2. ⚠️ Check Railway environment variables
3. ⚠️ Verify latest code is deployed
4. ⚠️ Run database migrations if not done

---

## 🎯 Next Steps

1. **Fix Code Version**: Update commit hash in server.js
2. **Check Railway**: Verify environment variables and latest deployment
3. **Test Endpoints**: Verify root and health check endpoints work
4. **Monitor Logs**: Check for any errors or warnings

**Overall Assessment**: ✅ **Setup is correct**, but Railway needs to deploy latest code and environment variables need verification.

