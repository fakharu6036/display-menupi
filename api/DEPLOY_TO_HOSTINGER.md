# 🚀 Deploy PHP Backend to Hostinger - Step by Step

## 📁 Deployment Path
```
/home/u859590789/domains/menupi.com/public_html/api
```

---

## ✅ Step 1: Upload Files via File Manager

### 1.1 Access File Manager
1. Log in to **Hostinger hPanel**
2. Go to **File Manager**
3. Navigate to: `/public_html/api/` (create folder if it doesn't exist)

### 1.2 Upload All API Files

Upload the **entire contents** of the `api/` folder:

**Required Files:**
```
api/
├── index.php
├── .htaccess
├── .env                    ⚠️ CREATE THIS (see Step 2)
├── fix-auth.php
├── config/
│   ├── config.php
│   └── database.php
├── controllers/
│   ├── AuthController.php
│   ├── MediaController.php
│   ├── PublicController.php
│   └── ScreenController.php
├── middleware/
│   └── auth.php
├── routes/
│   ├── auth.php
│   ├── media.php
│   ├── public.php
│   └── screens.php
├── utils/
│   ├── crypto.php
│   ├── jwt.php
│   ├── response.php
│   └── upload.php
└── uploads/                (create folder, set 755)
```

### 1.3 Set File Permissions

**In File Manager:**
1. Right-click each folder → **Change Permissions** → **755**
2. Right-click each file → **Change Permissions** → **644**
3. **uploads/** folder → **755** (must be writable)

---

## ⚙️ Step 2: Create .env File

### 2.1 Create .env in File Manager

1. In `/public_html/api/` folder
2. Click **New File** → Name: `.env`
3. Copy and paste this content:

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

### 2.2 Protect .env File

The `.htaccess` already protects `.env` files, but verify:
- `.env` should NOT be accessible via browser
- Test: `https://api.menupi.com/api/.env` → Should return 403

---

## 🗄️ Step 3: Database Setup

### 3.1 Verify Database Exists

Your database is already configured:
- **Host:** `srv653.hstgr.io`
- **Port:** `3306`
- **User:** `u859590789_disys`
- **Database:** `u859590789_disys`

### 3.2 Import Schema (If Not Already Done)

1. Go to **phpMyAdmin** in Hostinger
2. Select database: `u859590789_disys`
3. Go to **Import** tab
4. Upload `database/schema.sql`
5. Click **Go**

### 3.3 Verify Tables

Run in phpMyAdmin:
```sql
SHOW TABLES;
```

Should see: `restaurants`, `users`, `screens`, `media`, etc.

---

## 🌐 Step 4: Domain Configuration

### 4.1 Subdomain Setup

1. **Hostinger hPanel** → **Domains** → **Subdomains**
2. Create: `api.menupi.com`
3. Point to: `/public_html/api`
4. Save

### 4.2 SSL Certificate

1. **Hostinger hPanel** → **SSL**
2. Enable **Free SSL** for `api.menupi.com`
3. Wait for activation (usually instant)

### 4.3 DNS Propagation

Wait 5-30 minutes for DNS to propagate, then test:
```bash
curl https://api.menupi.com/api/health
```

---

## 📤 Step 5: Create Uploads Directory

1. In File Manager, go to `/public_html/api/`
2. Create folder: `uploads/`
3. Set permissions: **755** (writable)
4. Verify it's writable

---

## 🧪 Step 6: Test API

### 6.1 Health Check

```bash
curl https://api.menupi.com/api/health
```

**Expected:**
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

### 6.2 Test Registration

```bash
curl -X POST https://api.menupi.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 6.3 Test Media Upload

After login, get token, then:
```bash
curl -X POST https://api.menupi.com/api/media \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
```

**Verify response URL:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "url": "https://api.menupi.com/uploads/1765809195962-test-image.jpg"
  }
}
```

✅ **URL should be `https://api.menupi.com/uploads/...` NOT `localhost`**

---

## 🎨 Step 7: Configure Frontend

### 7.1 Update Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Set `VITE_API_URL`:
   ```
   VITE_API_URL=https://api.menupi.com/api
   ```
4. **Redeploy** frontend (or wait for auto-deploy)

---

## ✅ Verification Checklist

### Backend
- [ ] Health endpoint works: `https://api.menupi.com/api/health`
- [ ] Database connection successful
- [ ] Registration works
- [ ] Login works
- [ ] Media upload works
- [ ] Media URLs use `https://api.menupi.com/uploads/...`
- [ ] No localhost URLs in responses
- [ ] Files save to `uploads/` directory
- [ ] Files accessible via HTTPS

### Frontend
- [ ] Frontend loads without errors
- [ ] Login works
- [ ] Media library loads
- [ ] Upload works
- [ ] Images display correctly
- [ ] No mixed content warnings
- [ ] No CORS errors
- [ ] All API calls succeed

---

## 🐛 Troubleshooting

### 500 Internal Server Error
- Check PHP error logs: **Hostinger hPanel** → **Logs** → **Error Logs**
- Verify `.htaccess` syntax
- Check file permissions (755/644)
- Verify PHP version (7.4+)

### Database Connection Failed
- Verify credentials in `.env` match Hostinger
- Check database exists in phpMyAdmin
- Test connection in phpMyAdmin
- Verify `DB_HOST=srv653.hstgr.io` (not localhost)

### File Upload Fails
- Check `uploads/` folder exists and is writable (755)
- Verify PHP upload limits in `.htaccess`
- Check file size within 50MB limit
- Verify file type is allowed

### Media URLs Still Show localhost
- Verify `API_URL=https://api.menupi.com` in `.env`
- Verify `BASE_URL=https://api.menupi.com` in `.env`
- Check `NODE_ENV=production` is set
- Clear PHP opcache (if enabled)

### Routes Return 404
- Verify `.htaccess` is in `/public_html/api/`
- Check `mod_rewrite` is enabled
- Verify Apache `AllowOverride All` is set
- Test: `https://api.menupi.com/api/health` should work

---

## 📝 Important Notes

1. **.env file contains sensitive data** - Never commit to git
2. **File permissions are critical** - Folders 755, files 644
3. **uploads/ must be writable** - Set to 755
4. **API_URL and BASE_URL must be set** - For correct media URLs
5. **SSL certificate required** - Enable Free SSL in Hostinger

---

## ✅ Deployment Complete!

After completing all steps:
- ✅ PHP backend running on `https://api.menupi.com`
- ✅ Database connected
- ✅ File uploads working
- ✅ Media URLs use correct production domain
- ✅ Frontend connects successfully
- ✅ No mixed content errors

---

**Your .env file is ready in:** `/Users/mdfakharuddin/Desktop/menupi-signage/api/.env`

**Upload this file to Hostinger manually via File Manager (don't commit to git).**

---

**Last Updated:** After commit `4473e1a`
**Status:** Ready for deployment

