# 🚨 CRITICAL: Create Web Service in Railway

## The Problem

You currently have **ONLY a MySQL service** in Railway. You need to **CREATE a separate Web Service** for your Node.js backend.

**Current situation:**
- ✅ MySQL service exists (for database)
- ❌ **Web service does NOT exist** (for Node.js backend)
- When you "redeploy", it redeploys MySQL (wrong service)

## ✅ SOLUTION: Create Web Service

### Step 1: Railway Dashboard

1. Go to: https://railway.app/dashboard
2. Open your project: **optimistic-hope**
3. You should see:
   - **MySQL** service (existing)
   - **No Web Service** (needs to be created)

### Step 2: Create New Service

1. Click **"+ New"** button (top right)
2. Select **"Empty Service"** or **"GitHub Repo"**
3. If "GitHub Repo":
   - Select your repo: `fakharu6036/display-menupi`
   - Branch: `master`
4. Railway will create a new service

### Step 3: Configure Web Service

1. **Service Name**: Rename to something like "API" or "Backend"
2. **Root Directory**: Leave empty (or set to `/` if needed)
3. **Start Command**: Should be `npm start` (Railway auto-detects this)
4. **Build Command**: Leave empty (or `npm install` if needed)

### Step 4: Add Environment Variables

Go to **Variables** tab in your new Web Service:

**Required Variables:**
```
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=CQuhrZNqfUvuIjEVLjSCXZbcTSwQYMDX
DB_NAME=railway
JWT_SECRET=your-secret-key-here
```

**Important:**
- ✅ **DO NOT set PORT** - Railway will auto-set this (usually 8080)
- ✅ **DO NOT set RAILWAY_TCP_APPLICATION_PORT** - Railway handles this
- ✅ Use `mysql.railway.internal` for DB_HOST (internal Railway network)

### Step 5: Link Database

1. In your **Web Service** → **Variables** tab
2. Click **"Add Reference"** or **"Link Variable"**
3. Select your **MySQL service**
4. Railway will auto-add database variables

**OR manually add:**
- `DB_HOST` = `mysql.railway.internal`
- `DB_USER` = (from MySQL service)
- `DB_PASSWORD` = (from MySQL service)
- `DB_NAME` = (from MySQL service)

### Step 6: Deploy

1. Railway will auto-deploy when you connect GitHub repo
2. **OR** click **"Deploy"** button
3. Wait 2-3 minutes
4. Check **Deploy Logs**

### Step 7: Verify Deployment

**Check Logs - Should show:**
```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 8080
✅ Database connected
✅ Tables ready
```

**NOT:**
```
❌ CRITICAL: PORT is set to a database port!
Current PORT: 3306
```

### Step 8: Set Custom Domain (Optional)

1. Go to **Settings** tab in Web Service
2. Click **"Generate Domain"** or **"Add Custom Domain"**
3. Set to: `api.menupi.com`
4. Update DNS if using custom domain

## 📋 Service Structure (After Setup)

You should have **TWO services**:

1. **MySQL Service**
   - Purpose: Database only
   - Port: 3306 (internal)
   - Variables: Auto-managed by Railway

2. **Web Service** (NEW)
   - Purpose: Node.js backend
   - Port: 8080 (auto-set by Railway)
   - Variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
   - Domain: api.menupi.com

## ⚠️ Common Mistakes

❌ **Don't deploy code to MySQL service**
❌ **Don't set PORT=3306 in web service**
❌ **Don't set PORT manually** (let Railway handle it)
✅ **Do create separate web service**
✅ **Do use `mysql.railway.internal` for DB_HOST**
✅ **Do let Railway auto-set PORT**

## 🎯 Quick Checklist

- [ ] Created new Web Service in Railway
- [ ] Connected GitHub repo (or uploaded code)
- [ ] Added environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET)
- [ ] **Did NOT set PORT variable**
- [ ] Deployed and checked logs
- [ ] Logs show `Port: 8080` (not 3306)
- [ ] Tested endpoints: `curl https://api.menupi.com/`

## 🆘 If Still Getting PORT=3306

1. **Check which service you're deploying to:**
   - Railway Dashboard → Check service name
   - Should be "API" or "Backend", NOT "MySQL"

2. **Remove PORT variable:**
   - Web Service → Variables → Delete `PORT` if it exists
   - Railway will auto-set it

3. **Check service type:**
   - Web Service should be "Web Service" type
   - NOT "Database" or "MySQL" type

---

**Status**: 🚨 **Action Required - Create Web Service**  
**Current**: Only MySQL service exists  
**Needed**: Separate Web Service for Node.js backend

