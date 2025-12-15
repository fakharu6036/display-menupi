# 🔧 Step-by-Step Fix: Backend Connection Issue

## 🔍 Problem Identified

**Issue:** `api.menupi.com` domain does not exist
- DNS error: `DNS_PROBE_FINISHED_NXDOMAIN`
- Frontend is deployed ✅
- Backend API is NOT deployed ❌

---

## ✅ Step 1: Deploy PHP Backend to Hostinger

### 1.1 Upload Files to Hostinger

1. **Log in to Hostinger hPanel**
2. **Go to File Manager**
3. **Navigate to:** `/public_html/api/` (create folder if needed)
4. **Upload all files from `api/` folder:**
   - `index.php`
   - `.htaccess`
   - `fix-auth.php`
   - All folders: `config/`, `controllers/`, `routes/`, `utils/`, `middleware/`
   - Create `uploads/` folder (set permissions to 755)

### 1.2 Create .env File

1. In File Manager, go to `/public_html/api/`
2. **Create new file:** `.env`
3. **Copy contents from:** `api/env.hostinger` (in your project)
4. **Paste into** `.env` file
5. **Save**

**Content:**
```bash
DB_HOST=srv653.hstgr.io
DB_PORT=3306
DB_USER=u859590789_disys
DB_PASSWORD=hF~awOpY=0y
DB_NAME=u859590789_disys

JWT_SECRET=3f8182141d350b5d19399b160196c7f170d905eaee523a35e9984fbdb198ede6

NODE_ENV=production

ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf

BASE_URL=https://api.menupi.com
API_URL=https://api.menupi.com
```

### 1.3 Set File Permissions

- **Folders:** 755
- **Files:** 644
- **uploads/:** 755 (must be writable)

---

## ✅ Step 2: Create API Subdomain in Hostinger

### 2.1 Create Subdomain

1. **Hostinger hPanel** → **Domains** → **Subdomains**
2. **Create subdomain:** `api`
3. **Point to:** `/public_html/api`
4. **Save**

This creates: `api.menupi.com`

### 2.2 Enable SSL

1. **Hostinger hPanel** → **SSL**
2. **Enable Free SSL** for `api.menupi.com`
3. **Wait for activation** (usually instant)

---

## ✅ Step 3: Configure DNS (If Not Auto-Configured)

If subdomain doesn't work automatically:

1. **Go to DNS Management** in Hostinger
2. **Add CNAME record:**
   - **Name:** `api`
   - **Value:** `menupi.com` (or your main domain)
   - **TTL:** 3600

---

## ✅ Step 4: Test API

After DNS propagates (5-30 minutes):

```bash
curl https://api.menupi.com/api/health
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "...",
    "database": "connected"
  }
}
```

---

## ✅ Step 5: Verify Frontend Connection

1. **Open your deployed frontend**
2. **Open browser console** (F12)
3. **Check API URL:**
   ```javascript
   console.log(import.meta.env.VITE_API_URL);
   ```
   Should show: `https://api.menupi.com/api`

4. **Test API call:**
   ```javascript
   fetch('https://api.menupi.com/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error);
   ```

---

## 📋 Checklist

- [ ] PHP files uploaded to `/public_html/api/`
- [ ] `.env` file created with correct credentials
- [ ] File permissions set (755/644)
- [ ] `uploads/` folder created (755)
- [ ] Subdomain `api.menupi.com` created in Hostinger
- [ ] SSL enabled for `api.menupi.com`
- [ ] DNS propagated (test with curl)
- [ ] API health endpoint returns success
- [ ] Frontend environment variable set in Vercel
- [ ] Frontend redeployed

---

## 🐛 Troubleshooting

### API Still Not Accessible

1. **Check DNS propagation:**
   ```bash
   nslookup api.menupi.com
   ```

2. **Check file permissions** in Hostinger File Manager

3. **Check PHP error logs** in Hostinger hPanel → Logs

4. **Verify `.htaccess`** is in `/public_html/api/`

5. **Test direct file access:**
   - `https://api.menupi.com/api/index.php` (should work)

### CORS Errors

1. **Check `ALLOWED_ORIGINS`** in `.env`:
   ```
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   ```

2. **Verify both domains are in the list**

3. **Clear PHP cache** (if using opcache)

---

## 🎯 Current Status

- ✅ Frontend deployed on Vercel
- ✅ Environment variable `VITE_API_URL` set
- ❌ Backend API not deployed (needs Step 1-3)
- ❌ `api.menupi.com` domain doesn't exist (needs Step 2)

**Next Action:** Deploy PHP backend to Hostinger (Step 1)

---

**See `api/DEPLOY_TO_HOSTINGER.md` for detailed instructions.**

