# Railway Backend Configuration - Changes Summary

## 📋 Files Changed

### 1. `railway.json` ✅ MODIFIED

**Change:**
```json
// Before
"startCommand": "npm run server"

// After
"startCommand": "npm start"
```

**Why:**
- Railway standard uses `npm start`
- Maps to `"start": "node server.js"` in package.json
- More conventional and reliable

**Impact:** Railway will now correctly start the backend service

---

### 2. `.railwayignore` ✅ MODIFIED

**Change:**
Added frontend files/directories to ignore list:
- `components/`
- `pages/`
- `App.tsx`, `index.tsx`, `index.html`
- `vite.config.ts`, `tsconfig.json`
- `dist/`, `public/`
- `vercel.json`, `.vercelignore`

**Why:**
- Backend doesn't need frontend files
- Reduces deployment size
- Faster builds
- Prevents confusion

**Impact:** Smaller, faster Railway deployments

---

## ✅ Files Verified (No Changes Needed)

### 3. `package.json` ✅ CORRECT

**Status:** Already correct
```json
"start": "node server.js"  // ✅ Railway uses this
```

**Why No Change:**
- Already uses standard `npm start` command
- Frontend scripts remain (for local dev, not used by Railway)

---

### 4. `server.js` ✅ CORRECT

**Status:** Already correct
```javascript
const PORT = process.env.PORT || process.env.API_PORT || 3002;
```

**Why No Change:**
- Uses `process.env.PORT` (Railway auto-sets this) ✅
- Has fallback for local dev (3002) ✅
- No hardcoded production ports ✅
- No TypeScript syntax ✅
- Only imports backend dependencies ✅

**Note:** `DB_HOST` has fallback to `'localhost'` - this is fine for local dev, Railway will override with environment variable.

---

### 5. `Procfile` ✅ CORRECT

**Status:** Already correct
```
web: node server.js
```

**Why No Change:**
- Provides fallback if Railway doesn't use package.json
- Standard Railway/Heroku format

---

## 🔍 Verification Results

### Backend Isolation ✅
- ✅ `server.js` only imports: express, mysql, cors, bcrypt, jwt, multer, fs, path
- ✅ No React/Vite imports
- ✅ No frontend components referenced
- ✅ Frontend files excluded via .railwayignore

### Port Configuration ✅
- ✅ Uses `process.env.PORT` (Railway standard)
- ✅ Fallback to `process.env.API_PORT` (optional)
- ✅ Final fallback to `3002` (local dev only)
- ✅ No hardcoded production ports

### TypeScript ✅
- ✅ No TypeScript syntax in server.js
- ✅ All type annotations removed
- ✅ Pure JavaScript only

### Package Scripts ✅
- ✅ `"start": "node server.js"` - Railway uses this
- ✅ Frontend scripts remain (for local dev)

---

## 🚀 What Railway Will Do

1. **Detect**: Node.js project automatically
2. **Build**: `npm install` (installs dependencies)
3. **Start**: `npm start` → `node server.js`
4. **Set**: `process.env.PORT` automatically
5. **Expose**: Port via Railway's proxy

---

## 📋 Manual Steps in Railway UI

### Step 1: Add MySQL Database
1. Railway Dashboard → Project → **"+ New"** → **"Database"** → **"Add MySQL"**

### Step 2: Set Environment Variables
Railway Dashboard → Project → **"Variables"** tab:

```env
# Database (use Railway's format)
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

# Security (REQUIRED)
JWT_SECRET=[generate: openssl rand -base64 32]

# Optional
GEMINI_API_KEY=your-key-if-needed
```

**Important:** 
- ❌ DO NOT set `PORT` - Railway sets this automatically
- ❌ DO NOT set `VITE_*` variables - Frontend only

### Step 3: Run Database Migrations
1. Railway Dashboard → MySQL Service → **"Connect"** → **"MySQL Shell"**
2. Run:
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
2. **"Custom Domain"** → Add `api.menupi.com`
3. Update DNS with CNAME record

### Step 5: Verify
Check logs for:
```
✅ Database connected successfully
🚀 API Server running on port [PORT]
📡 API Base URL: https://api.menupi.com
```

Test:
```bash
curl https://api.menupi.com/api/health
```

---

## ✅ Final Status

**Backend Configuration:** ✅ **READY FOR RAILWAY**

- ✅ Uses `npm start` (standard)
- ✅ Uses `process.env.PORT` (Railway standard)
- ✅ No frontend dependencies required
- ✅ No TypeScript syntax
- ✅ Production-safe
- ✅ No secrets in code

**Next Steps:**
1. Push code to GitHub (Railway auto-deploys)
2. Add MySQL database in Railway
3. Set environment variables
4. Run migrations
5. Configure custom domain

---

**See `RAILWAY_BACKEND_CONFIG.md` for complete guide.**

