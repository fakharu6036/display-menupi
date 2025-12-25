# Railway Backend Configuration - Complete Guide

## ✅ Backend Configuration Status

### Files Modified for Railway

1. **`railway.json`** ✅
   - Changed `startCommand` from `"npm run server"` to `"npm start"`
   - Why: Railway standard uses `npm start`, which maps to `"start": "node server.js"` in package.json

2. **`.railwayignore`** ✅
   - Added frontend directories to ignore (components/, pages/, App.tsx, etc.)
   - Why: Backend doesn't need frontend files, reduces deployment size

3. **`package.json`** ✅ (Already correct)
   - `"start": "node server.js"` - Correct for Railway
   - Frontend scripts (dev, build) remain for local development

4. **`server.js`** ✅ (Already correct)
   - Uses `process.env.PORT || process.env.API_PORT || 3002`
   - Railway automatically sets `process.env.PORT`
   - No hardcoded ports in production

5. **`Procfile`** ✅ (Already correct)
   - `web: node server.js` - Fallback if Railway doesn't use package.json

## 🔍 Verification Checklist

### ✅ Backend Isolation
- [x] `server.js` only imports backend dependencies (express, mysql, etc.)
- [x] No React/Vite imports in server.js
- [x] No frontend components referenced
- [x] Frontend files excluded via .railwayignore

### ✅ Port Configuration
- [x] Uses `process.env.PORT` (Railway auto-sets this)
- [x] Fallback to `process.env.API_PORT` (optional)
- [x] Final fallback to `3002` (local dev only)
- [x] No hardcoded production ports

### ✅ TypeScript
- [x] No TypeScript syntax in server.js
- [x] All type annotations removed
- [x] Pure JavaScript only

### ✅ Package.json Scripts
- [x] `"start": "node server.js"` - Railway uses this
- [x] Frontend scripts remain (for local dev, not used by Railway)

## 🚀 Railway Deployment Configuration

### What Railway Will Do

1. **Detect Node.js** project automatically
2. **Run**: `npm install` (installs all dependencies)
3. **Start**: `npm start` → `node server.js`
4. **Set**: `process.env.PORT` automatically
5. **Expose**: Port via Railway's proxy

### Required Environment Variables (Set in Railway UI)

Go to Railway Dashboard → Your Project → Variables tab:

```env
# Database (Railway MySQL - use ${{MySQL.MYSQLHOST}} format)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}

# API Configuration
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com
NODE_ENV=production

# Security (REQUIRED - generate: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-key-here-minimum-32-characters

# Optional
GEMINI_API_KEY=your-gemini-key-if-needed
```

### What NOT to Set

❌ **DO NOT SET**:
- `PORT` - Railway sets this automatically
- `API_PORT` - Not needed (Railway uses PORT)
- Any `VITE_*` variables - These are frontend only

### Custom Domain Setup

1. Railway Dashboard → Project → Settings → Networking
2. Click **"Generate Domain"** first (for testing)
3. Click **"Custom Domain"** → Add `api.menupi.com`
4. Update DNS with CNAME record Railway provides

## 📋 Manual Steps in Railway UI

### Step 1: Add MySQL Database

1. Railway Dashboard → Your Project
2. Click **"+ New"** → **"Database"** → **"Add MySQL"**
3. Railway will provision MySQL automatically

### Step 2: Set Environment Variables

1. Railway Dashboard → Your Project → **"Variables"** tab
2. Click **"New Variable"**
3. Add each variable from the list above
4. Use `${{MySQL.MYSQLHOST}}` format for database variables

### Step 3: Run Database Migrations

1. Railway Dashboard → MySQL Service
2. Click **"Connect"** → **"MySQL Shell"**
3. Run migrations in order:

```sql
SOURCE database.sql;
SOURCE migrate-hardware-tvs.sql;
SOURCE migrate-add-ip-tracking.sql;
SOURCE migrate-plan-requests.sql;
SOURCE migrate-manual-android-tvs.sql;
SOURCE migrate-tv-deduplication.sql;
```

### Step 4: Configure Custom Domain

1. Railway Dashboard → Project → **"Settings"** → **"Networking"**
2. Click **"Custom Domain"** → **"Add Domain"**
3. Enter: `api.menupi.com`
4. Update DNS with CNAME record

### Step 5: Verify Deployment

Check Railway logs for:
```
✅ Database connected successfully
🚀 API Server running on port [PORT]
📡 API Base URL: https://api.menupi.com
```

Test API:
```bash
curl https://api.menupi.com/api/health
```

## 🔒 Security Notes

1. **Never commit secrets** - All secrets go in Railway Variables
2. **JWT_SECRET** - Generate strong random string (32+ characters)
3. **Database credentials** - Use Railway's MySQL service variables
4. **CORS** - Already configured for `*.menupi.com` only

## 🐛 Troubleshooting

### Port Issues
- Railway sets `PORT` automatically
- Your code uses `process.env.PORT` ✅
- No action needed

### Build Failures
- Check Railway logs
- Verify `npm install` completes
- Ensure no frontend build step is attempted

### Database Connection
- Verify MySQL service is running
- Check environment variables are set
- Use Railway's private networking if available

### Start Command Issues
- Railway uses `npm start` → `node server.js` ✅
- Procfile provides fallback: `web: node server.js` ✅

## ✅ Final Checklist

Before deploying:
- [x] `railway.json` uses `npm start`
- [x] `package.json` has `"start": "node server.js"`
- [x] `server.js` uses `process.env.PORT`
- [x] `.railwayignore` excludes frontend files
- [x] No TypeScript syntax in server.js
- [x] Environment variables documented

After deploying:
- [ ] MySQL database added
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Custom domain configured
- [ ] API responds correctly

---

**Status**: ✅ **READY FOR RAILWAY DEPLOYMENT**
**Last Updated**: $(date)

