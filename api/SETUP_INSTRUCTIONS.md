# 🚀 Hostinger PHP Backend Setup Instructions

## ✅ Your Configuration is Ready!

I've created your `.env` configuration file. Here's what to do:

---

## 📋 Step-by-Step Deployment

### Step 1: Upload Files to Hostinger

1. **Log in to Hostinger hPanel**
2. **Go to File Manager**
3. **Navigate to:** `/public_html/api/` (create folder if needed)
4. **Upload entire `api/` folder** contents from this project

**Files to upload:**
- All `.php` files
- `.htaccess`
- All folders: `config/`, `controllers/`, `routes/`, `utils/`, `middleware/`
- Create `uploads/` folder (set permissions to 755)

### Step 2: Create .env File

1. In File Manager, go to `/public_html/api/`
2. **Create new file** named `.env`
3. **Copy the contents** from `env.hostinger` file (in this project)
4. **Paste into** `.env` file
5. **Save**

**Or copy this directly:**

```bash
# Database Configuration
DB_HOST=srv653.hstgr.io
DB_PORT=3306
DB_USER=u859590789_disys
DB_PASSWORD=hF~awOpY=0y
DB_NAME=u859590789_disys

# JWT Secret (Generated secure random string)
JWT_SECRET=3f8182141d350b5d19399b160196c7f170d905eaee523a35e9984fbdb198ede6

# Environment
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

# File Upload Configuration
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf

# Base URL (for media file serving) - CRITICAL for correct URLs
BASE_URL=https://api.menupi.com
API_URL=https://api.menupi.com
```

### Step 3: Set File Permissions

**In Hostinger File Manager:**

1. **Folders:** Right-click → Change Permissions → **755**
   - `api/`
   - `api/config/`
   - `api/controllers/`
   - `api/routes/`
   - `api/utils/`
   - `api/middleware/`
   - `api/uploads/` ← **Must be 755 (writable)**

2. **Files:** Right-click → Change Permissions → **644**
   - All `.php` files
   - `.htaccess`
   - `.env`

### Step 4: Configure Subdomain

1. **Hostinger hPanel** → **Domains** → **Subdomains**
2. **Create subdomain:** `api.menupi.com`
3. **Point to:** `/public_html/api`
4. **Save**

### Step 5: Enable SSL

1. **Hostinger hPanel** → **SSL**
2. **Enable Free SSL** for `api.menupi.com`
3. **Wait for activation** (usually instant)

### Step 6: Test API

Wait 5-30 minutes for DNS propagation, then test:

```bash
curl https://api.menupi.com/api/health
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-...",
    "database": "connected"
  }
}
```

### Step 7: Update Frontend

**Vercel Environment Variable:**
1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Set: `VITE_API_URL=https://api.menupi.com/api`
4. **Redeploy** frontend

---

## ✅ Verification

After deployment, verify:

1. **Health check works:** `https://api.menupi.com/api/health`
2. **Database connected:** Response shows `"database": "connected"`
3. **Upload works:** Upload a file and verify URL is `https://api.menupi.com/uploads/...`
4. **Frontend works:** Login and check media library loads correctly
5. **No mixed content:** Browser console shows no localhost URLs

---

## 🐛 Common Issues

### 500 Error
- Check PHP error logs in Hostinger
- Verify `.htaccess` is readable
- Check file permissions

### Database Connection Failed
- Verify credentials in `.env` match Hostinger
- Check database exists in phpMyAdmin
- Test connection in phpMyAdmin

### File Upload Fails
- Check `uploads/` folder is writable (755)
- Verify PHP upload limits
- Check file size within 50MB

### Media URLs Show localhost
- Verify `API_URL=https://api.menupi.com` in `.env`
- Verify `BASE_URL=https://api.menupi.com` in `.env`
- Check `NODE_ENV=production` is set

---

## 📝 Important Notes

1. **`.env` file contains sensitive data** - Never share or commit to git
2. **File permissions are critical** - Folders 755, files 644
3. **uploads/ must be writable** - Set to 755
4. **API_URL and BASE_URL must be set** - For correct media URLs

---

## ✅ You're Ready!

Your configuration is complete. Just:
1. Upload files to Hostinger
2. Create `.env` file (copy from `env.hostinger`)
3. Set permissions
4. Configure subdomain
5. Test!

**See `DEPLOY_TO_HOSTINGER.md` for detailed instructions.**

---

**Your .env content is in:** `api/env.hostinger` (copy this to `.env` on Hostinger)

