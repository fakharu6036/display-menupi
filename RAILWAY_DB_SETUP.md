# Railway Database Environment Variables Setup

## 🚨 Current Issue

Railway deployment is working, but database environment variables are missing:
- ❌ `DB_HOST`
- ❌ `DB_USER`
- ❌ `DB_NAME`
- ❌ `DB_PASSWORD`

## ✅ Solution: Link MySQL Service

Railway needs the MySQL service to be **linked** to your backend service so it can automatically inject database credentials.

### Step 1: Link MySQL Service (Railway Dashboard)

1. **Railway Dashboard** → Your Project
2. Click on your **backend service** (the one that's failing)
3. Go to **"Variables"** tab
4. Look for **"Add Reference"** or **"Link Service"** button
5. Select your **MySQL service**
6. Railway will automatically add:
   - `MYSQL_HOST` → maps to `DB_HOST`
   - `MYSQL_USER` → maps to `DB_USER`
   - `MYSQL_PASSWORD` → maps to `DB_PASSWORD`
   - `MYSQL_DATABASE` → maps to `DB_NAME`

### Step 2: Map Railway Variables to Our Code

Railway MySQL service provides variables with `MYSQL_` prefix, but our code expects `DB_` prefix.

**Option A: Use Railway Variable References (Recommended)**

1. Railway Dashboard → Your Service → **Variables**
2. Add these **variable references**:
   - `DB_HOST` = Reference to `MYSQL_HOST` from MySQL service
   - `DB_USER` = Reference to `MYSQL_USER` from MySQL service
   - `DB_PASSWORD` = Reference to `MYSQL_PASSWORD` from MySQL service
   - `DB_NAME` = Reference to `MYSQL_DATABASE` from MySQL service

**Option B: Update Code to Use MYSQL_ Prefix**

Alternatively, we can update the code to use Railway's default variable names.

### Step 3: Verify Variables

After linking, check Railway Variables tab should show:
- ✅ `DB_HOST` (or `MYSQL_HOST`)
- ✅ `DB_USER` (or `MYSQL_USER`)
- ✅ `DB_PASSWORD` (or `MYSQL_PASSWORD`)
- ✅ `DB_NAME` (or `MYSQL_DATABASE`)

### Step 4: Redeploy

After setting variables, Railway should auto-redeploy, or manually trigger:
```bash
railway up --detach
```

---

## 🔧 Alternative: Set Variables Manually

If linking doesn't work, set variables manually:

1. **Railway Dashboard** → Your Service → **Variables**
2. **Add** these variables (get values from MySQL service):
   - `DB_HOST` = `[MySQL service host]`
   - `DB_USER` = `[MySQL service user]`
   - `DB_PASSWORD` = `[MySQL service password]`
   - `DB_NAME` = `[MySQL service database]`

---

## 📋 Required Variables Summary

| Variable | Source | Description |
|----------|--------|-------------|
| `DB_HOST` | MySQL Service | Database hostname |
| `DB_USER` | MySQL Service | Database username |
| `DB_PASSWORD` | MySQL Service | Database password |
| `DB_NAME` | MySQL Service | Database name |
| `JWT_SECRET` | Manual | JWT secret key (must set manually) |
| `PORT` | Railway | Auto-set by Railway |

---

## ✅ Expected Result

After linking MySQL service and setting variables, logs should show:

```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 8080
🌐 Base URL: https://api.menupi.com
📅 Deployed: 2025-12-25 (v2.0.0)
✅ Code Version: 9dc05f9
============================================================
✅ Database connected
✅ Tables ready
```

**No more**:
- ❌ "Database configuration missing"
- ❌ Missing environment variable errors

---

**Status**: ⚠️ **Database variables missing**  
**Action**: **Link MySQL service** in Railway Dashboard  
**Next**: Set variable references or update code to use `MYSQL_` prefix

