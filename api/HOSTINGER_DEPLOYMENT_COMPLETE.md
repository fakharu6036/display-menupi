# 🚀 Complete Hostinger PHP Backend Deployment Guide

## 📋 Overview

This guide will help you deploy the MENUPI PHP API to Hostinger using File Manager. The PHP backend is faster and more efficient for Hostinger shared hosting.

**API Path:** `/home/u859590789/domains/menupi.com/public_html/api`

---

## ✅ Pre-Deployment Checklist

- [ ] Hostinger account with domain `api.menupi.com` configured
- [ ] MySQL database created in Hostinger
- [ ] Database credentials ready
- [ ] File Manager access to Hostinger
- [ ] Frontend deployed to Vercel (app.menupi.com)

---

## 📁 Step 1: Upload Files to Hostinger

### 1.1 Access File Manager

1. Log in to **Hostinger hPanel**
2. Go to **File Manager**
3. Navigate to: `/public_html/api` (or create the `api` folder if it doesn't exist)

### 1.2 Upload API Files

Upload the entire `api/` folder contents to `/public_html/api/`:

**Required Files:**
```
api/
├── index.php                    ✅ Main router
├── .htaccess                   ✅ Apache configuration
├── fix-auth.php                ✅ Authorization header fix
├── config/
│   ├── config.php              ✅ Configuration
│   └── database.php            ✅ Database connection
├── controllers/
│   ├── AuthController.php      ✅ Authentication
│   ├── MediaController.php     ✅ Media uploads (NEW)
│   ├── PublicController.php    ✅ Public endpoints
│   └── ScreenController.php    ✅ Screen management
├── middleware/
│   └── auth.php                ✅ Auth middleware
├── routes/
│   ├── auth.php                ✅ Auth routes
│   ├── media.php               ✅ Media routes (NEW)
│   ├── public.php              ✅ Public routes
│   └── screens.php             ✅ Screen routes
├── utils/
│   ├── crypto.php               ✅ Crypto functions
│   ├── jwt.php                  ✅ JWT handling
│   ├── response.php             ✅ Response helpers
│   └── upload.php               ✅ File upload
└── uploads/                     ✅ Media storage (create if missing)
```

### 1.3 Set File Permissions

**In Hostinger File Manager:**

1. Right-click on `api/` folder → **Change Permissions**
2. Set to: **755** (folders)
3. For files: **644**
4. For `uploads/` folder: **755** (must be writable)

**Or via SSH (if available):**
```bash
cd /home/u859590789/domains/menupi.com/public_html/api
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 uploads/
```

---

## ⚙️ Step 2: Configure Environment

### 2.1 Create .env File

1. In File Manager, go to `/public_html/api/`
2. Create new file: `.env`
3. Add the following content:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=u859590789_your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=u859590789_your_db_name

# JWT Secret (Generate a strong random string)
# Use: php -r "echo bin2hex(random_bytes(32));"
JWT_SECRET=your_32_character_secret_key_minimum_32_characters_long

# Environment
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

# File Upload Configuration
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf

# Base URL (for media file serving)
BASE_URL=https://api.menupi.com
API_URL=https://api.menupi.com
```

### 2.2 Generate JWT Secret

**Option 1: Via Hostinger Terminal (if available)**
```bash
php -r "echo bin2hex(random_bytes(32));"
```

**Option 2: Via Online Tool**
- Go to: https://www.random.org/strings/
- Generate 64-character hex string
- Use as `JWT_SECRET`

### 2.3 Protect .env File

Ensure `.htaccess` protects `.env` files (already configured, but verify):

```apache
<FilesMatch "\.(env|log|sql|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## 🗄️ Step 3: Database Setup

### 3.1 Create Database

1. Go to **Hostinger hPanel** → **MySQL Databases**
2. Create new database: `u859590789_menupi_db` (or your preferred name)
3. Create database user with full privileges
4. Note down credentials

### 3.2 Import Schema

1. Go to **phpMyAdmin** in Hostinger
2. Select your database
3. Go to **Import** tab
4. Upload `database/schema.sql` from your project
5. Click **Go** to import

**Or via SQL tab:**
1. Open `database/schema.sql` in a text editor
2. Copy all SQL
3. Paste into phpMyAdmin SQL tab
4. Execute

### 3.3 Verify Database

Run this query in phpMyAdmin:
```sql
SHOW TABLES;
```

Should see:
- `restaurants`
- `users`
- `screens`
- `media`
- `screen_media`
- `schedules`
- (and other tables)

---

## 🔧 Step 4: Configure Domain

### 4.1 Subdomain Setup

1. Go to **Hostinger hPanel** → **Domains** → **Subdomains**
2. Create subdomain: `api.menupi.com`
3. Point to: `/public_html/api`
4. Wait for DNS propagation (5-30 minutes)

### 4.2 SSL Certificate

1. Go to **Hostinger hPanel** → **SSL**
2. Enable **Free SSL** for `api.menupi.com`
3. Wait for activation (usually instant)

### 4.3 Verify Domain

Test in browser:
```
https://api.menupi.com/api/health
```

Should return:
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

---

## 📤 Step 5: Configure File Uploads

### 5.1 Create Uploads Directory

1. In File Manager, go to `/public_html/api/`
2. Create folder: `uploads/`
3. Set permissions: **755** (writable)

### 5.2 Configure PHP Upload Limits

**Option 1: Via .htaccess (already configured)**
```apache
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value max_execution_time 300
php_value memory_limit 256M
```

**Option 2: Via php.ini (if you have access)**
```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
```

### 5.3 Test Upload

Use the test endpoint or upload via frontend to verify.

---

## 🔐 Step 6: Security Configuration

### 6.1 Verify .htaccess

Ensure `.htaccess` is in `/public_html/api/` with:
- ✅ Rewrite rules for routing
- ✅ Authorization header passing
- ✅ File protection (`.env`, `.log`, etc.)
- ✅ CORS headers
- ✅ PHP upload limits

### 6.2 Test Security

1. Try accessing `.env` directly: `https://api.menupi.com/api/.env`
   - Should return **403 Forbidden**

2. Try accessing protected route without auth:
   ```bash
   curl https://api.menupi.com/api/media
   ```
   - Should return **401 Unauthorized**

---

## 🧪 Step 7: Test API Endpoints

### 7.1 Health Check

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

### 7.2 Test Registration

```bash
curl -X POST https://api.menupi.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "token": "...",
    "user": {...}
  }
}
```

### 7.3 Test Media Upload

```bash
curl -X POST https://api.menupi.com/api/media \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "url": "https://api.menupi.com/uploads/1765809195962-image.jpg",
    "duration": null
  }
}
```

**✅ Verify URL is `https://api.menupi.com/uploads/...` NOT `localhost`**

---

## 🎨 Step 8: Configure Frontend

### 8.1 Update Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Ensure `VITE_API_URL` is set:
   ```
   VITE_API_URL=https://api.menupi.com/api
   ```

### 8.2 Verify Frontend Connection

1. Open browser DevTools → Network tab
2. Go to `https://app.menupi.com/media`
3. Check API requests:
   - ✅ Should hit `https://api.menupi.com/api/...`
   - ✅ Should return correct URLs
   - ✅ No CORS errors

---

## ✅ Step 9: Verification Checklist

### Backend Tests

- [ ] Health endpoint works: `https://api.menupi.com/api/health`
- [ ] Database connection successful
- [ ] Registration works
- [ ] Login works
- [ ] Media upload works
- [ ] Media URLs use `https://api.menupi.com/uploads/...`
- [ ] No localhost URLs in responses
- [ ] File uploads save to `uploads/` directory
- [ ] Files are accessible via HTTPS

### Frontend Tests

- [ ] Frontend loads without errors
- [ ] Login works
- [ ] Media library loads
- [ ] Upload works
- [ ] Images display correctly
- [ ] No mixed content warnings
- [ ] No CORS errors
- [ ] All API calls succeed

### Security Tests

- [ ] `.env` file not accessible
- [ ] Protected routes require authentication
- [ ] CORS only allows app.menupi.com and tv.menupi.com
- [ ] File uploads validate file types
- [ ] File size limits enforced

---

## 🐛 Troubleshooting

### Issue: 500 Internal Server Error

**Check:**
1. PHP error logs in Hostinger
2. `.htaccess` syntax is correct
3. File permissions (755 for folders, 644 for files)
4. PHP version (needs 7.4+)

**Fix:**
```bash
# Check error logs
# Hostinger hPanel → Logs → Error Logs

# Verify PHP version
# Hostinger hPanel → PHP Configuration
```

### Issue: Database Connection Failed

**Check:**
1. Database credentials in `.env`
2. Database exists in Hostinger
3. User has proper permissions
4. `DB_HOST` is `localhost` (not IP)

**Fix:**
```bash
# Test connection in phpMyAdmin
# Verify credentials match .env file
```

### Issue: File Upload Fails

**Check:**
1. `uploads/` folder exists and is writable (755)
2. PHP upload limits in `.htaccess`
3. File size within limits
4. File type is allowed

**Fix:**
```bash
# Check folder permissions
chmod 755 uploads/

# Verify .htaccess has upload limits
php_value upload_max_filesize 50M
php_value post_max_size 50M
```

### Issue: Routes Return 404

**Check:**
1. `.htaccess` is in `/public_html/api/`
2. `mod_rewrite` is enabled
3. Apache `AllowOverride All` is set

**Fix:**
- Contact Hostinger support to enable `mod_rewrite`
- Verify `.htaccess` is readable

### Issue: Authorization Header Not Working

**Check:**
1. `.htaccess` has Authorization header rules
2. `fix-auth.php` is included in `index.php`

**Fix:**
- Verify `.htaccess` lines 22-31 are present
- Check `index.php` includes `fix-auth.php`

### Issue: Media URLs Still Show localhost

**Check:**
1. `API_URL` or `BASE_URL` in `.env`
2. `MediaController.php` uses `getMediaBaseUrl()`
3. `normalizeMediaUrl()` is called

**Fix:**
```bash
# In .env file, ensure:
API_URL=https://api.menupi.com
BASE_URL=https://api.menupi.com
NODE_ENV=production
```

---

## 📊 Performance Optimization

### 1. Enable PHP OPcache (if available)

In `php.ini` or via Hostinger:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### 2. Enable Gzip Compression

Add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/json
</IfModule>
```

### 3. Set Cache Headers

Add to `.htaccess`:
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType video/mp4 "access plus 1 year"
</IfModule>
```

---

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Error Logs**
   - Hostinger hPanel → Logs → Error Logs
   - Check weekly for issues

2. **Backup Database**
   - Hostinger hPanel → Backups
   - Or use phpMyAdmin → Export

3. **Clean Old Files**
   - Periodically clean `uploads/` folder
   - Remove unused media files

4. **Update PHP Version**
   - Keep PHP updated (7.4+)
   - Hostinger hPanel → PHP Configuration

---

## 📝 File Structure Summary

```
/home/u859590789/domains/menupi.com/public_html/
└── api/                          # API root
    ├── index.php                 # Main router
    ├── .htaccess                 # Apache config
    ├── .env                      # Environment variables (PROTECTED)
    ├── fix-auth.php              # Auth header fix
    ├── config/
    │   ├── config.php            # Configuration
    │   └── database.php          # Database
    ├── controllers/
    │   ├── AuthController.php
    │   ├── MediaController.php   # Media uploads
    │   ├── PublicController.php
    │   └── ScreenController.php
    ├── middleware/
    │   └── auth.php
    ├── routes/
    │   ├── auth.php
    │   ├── media.php             # Media routes
    │   ├── public.php
    │   └── screens.php
    ├── utils/
    │   ├── crypto.php
    │   ├── jwt.php
    │   ├── response.php
    │   └── upload.php
    └── uploads/                  # Media files (WRITABLE)
        └── (uploaded files here)
```

---

## ✅ Deployment Complete!

After completing all steps:

1. ✅ PHP API is running on `https://api.menupi.com`
2. ✅ Database is connected
3. ✅ File uploads work
4. ✅ Media URLs use correct production URLs
5. ✅ Frontend connects successfully
6. ✅ No mixed content errors
7. ✅ All security measures in place

---

## 🆘 Support

If you encounter issues:

1. Check Hostinger error logs
2. Verify all environment variables
3. Test database connection
4. Check file permissions
5. Verify `.htaccess` configuration
6. Contact Hostinger support if needed

---

**Last Updated:** After commit `ba0d0fa`
**API Path:** `/home/u859590789/domains/menupi.com/public_html/api`
**Status:** Ready for deployment

