# 🚀 Hostinger PHP Backend - Complete Setup

## ✅ What's Been Created

A complete PHP backend API optimized for Hostinger shared hosting with:

- ✅ **Media Upload Controller** - Handles file uploads with URL normalization
- ✅ **URL Normalization** - Fixes localhost URLs automatically
- ✅ **All Required Endpoints** - Auth, Media, Screens, Public
- ✅ **Production-Ready** - Uses correct `https://api.menupi.com` URLs
- ✅ **File Upload Support** - Images, videos, PDFs
- ✅ **Avatar Upload** - User profile pictures

---

## 📁 Deployment Path

**Hostinger File Path:**
```
/home/u859590789/domains/menupi.com/public_html/api
```

---

## 🚀 Quick Deployment Steps

### 1. Upload Files

1. **Hostinger File Manager** → `/public_html/api/`
2. **Upload entire `api/` folder** from this project
3. **Set permissions:**
   - Folders: **755**
   - Files: **644**
   - `uploads/`: **755** (writable)

### 2. Create .env File

Create `.env` in `/public_html/api/`:

```bash
# Database
DB_HOST=localhost
DB_USER=u859590789_your_db_user
DB_PASSWORD=your_password
DB_NAME=u859590789_your_db_name

# JWT Secret (generate: php -r "echo bin2hex(random_bytes(32));")
JWT_SECRET=your_64_character_hex_string_here

# Environment
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

# File Uploads
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf

# Base URLs (CRITICAL for correct media URLs)
BASE_URL=https://api.menupi.com
API_URL=https://api.menupi.com
```

### 3. Database Setup

1. **Hostinger hPanel** → **MySQL Databases** → Create database
2. **phpMyAdmin** → Import `database/schema.sql`
3. Update `.env` with database credentials

### 4. Domain Configuration

1. **Hostinger hPanel** → **Subdomains**
2. Create: `api.menupi.com` → `/public_html/api`
3. **Enable Free SSL**
4. Wait for DNS propagation (5-30 min)

### 5. Test

```bash
curl https://api.menupi.com/api/health
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

### 6. Frontend Configuration

**Vercel Environment Variable:**
```
VITE_API_URL=https://api.menupi.com/api
```

---

## 📋 API Endpoints

### Public (No Auth)
- `GET /api/health` - Health check
- `GET /api/public/screen/:code` - TV player screen data
- `POST /api/screens/:id/ping` - Screen heartbeat

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /api/users/me` - Get current user
- `GET /api/users/me/refresh` - Refresh user data
- `POST /api/users/me/avatar` - Upload avatar

### Media (Auth Required)
- `GET /api/media` - List all media
- `POST /api/media` - Upload media file
- `DELETE /api/media/:id` - Delete media

### Screens (Auth Required)
- `GET /api/screens` - List screens
- `POST /api/screens` - Create screen
- `PUT /api/screens/:id` - Update screen
- `DELETE /api/screens/:id` - Delete screen

---

## ✅ Key Features

### URL Normalization
- ✅ Automatically fixes localhost URLs in database
- ✅ Returns correct `https://api.menupi.com/uploads/...` URLs
- ✅ Works for both old and new uploads

### File Uploads
- ✅ Saves files to `uploads/` directory
- ✅ Stores relative paths in database
- ✅ Returns correct production URLs
- ✅ Validates file types and sizes

### Security
- ✅ JWT authentication
- ✅ CORS protection
- ✅ File type validation
- ✅ SQL injection protection
- ✅ `.env` file protection

---

## 🔧 Configuration

### Environment Variables

**Required:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `BASE_URL` or `API_URL` (for correct media URLs)

**Optional:**
- `NODE_ENV=production` (enables production mode)
- `ALLOWED_ORIGINS` (CORS)
- `MAX_FILE_SIZE` (default: 50MB)
- `ALLOWED_MIME_TYPES`

### File Permissions

```bash
# Folders
chmod 755 api/
chmod 755 api/uploads/
chmod 755 api/config/
chmod 755 api/controllers/
chmod 755 api/routes/
chmod 755 api/utils/
chmod 755 api/middleware/

# Files
chmod 644 api/*.php
chmod 644 api/.htaccess
chmod 644 api/.env
```

---

## 🧪 Testing

### 1. Health Check
```bash
curl https://api.menupi.com/api/health
```

### 2. Test Upload
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

✅ URL should be `https://api.menupi.com/uploads/...` NOT `localhost`

### 3. Test Media List
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.menupi.com/api/media
```

**Verify all URLs use `https://api.menupi.com/uploads/...`**

---

## 🐛 Troubleshooting

### 500 Error
- Check PHP error logs in Hostinger
- Verify `.htaccess` syntax
- Check file permissions

### Database Connection Failed
- Verify credentials in `.env`
- Check database exists
- Ensure user has permissions

### File Upload Fails
- Check `uploads/` folder is writable (755)
- Verify PHP upload limits in `.htaccess`
- Check file size within limits

### Media URLs Still Show localhost
- Verify `API_URL` or `BASE_URL` in `.env`
- Check `NODE_ENV=production` is set
- Restart PHP (if using PHP-FPM)

### Routes Return 404
- Verify `.htaccess` is in `/public_html/api/`
- Check `mod_rewrite` is enabled
- Verify Apache `AllowOverride All`

---

## 📊 Performance

PHP backend on Hostinger is:
- ✅ **Faster** - No Node.js overhead
- ✅ **More efficient** - Native PHP execution
- ✅ **Better for shared hosting** - Optimized for Hostinger
- ✅ **Lower resource usage** - Less memory than Node.js

---

## 📝 Files Created

### New Files:
- `api/controllers/MediaController.php` - Media uploads
- `api/routes/media.php` - Media routes
- `api/HOSTINGER_DEPLOYMENT_COMPLETE.md` - Detailed guide
- `api/QUICK_DEPLOY.md` - Quick reference

### Updated Files:
- `api/controllers/PublicController.php` - URL normalization
- `api/controllers/AuthController.php` - Avatar upload
- `api/index.php` - Added media routes
- `api/.htaccess` - Upload serving rules

---

## ✅ Deployment Checklist

- [ ] Upload all `api/` files to Hostinger
- [ ] Set file permissions (755/644)
- [ ] Create `.env` file with correct values
- [ ] Import database schema
- [ ] Configure subdomain `api.menupi.com`
- [ ] Enable SSL certificate
- [ ] Test health endpoint
- [ ] Test media upload
- [ ] Verify URLs use `https://api.menupi.com`
- [ ] Update Vercel `VITE_API_URL`
- [ ] Test frontend connection

---

## 🎯 Result

After deployment:
- ✅ PHP backend running on `https://api.menupi.com`
- ✅ All uploads go to Hostinger server
- ✅ All URLs use correct production domain
- ✅ No mixed content errors
- ✅ Frontend works perfectly

---

**See `api/HOSTINGER_DEPLOYMENT_COMPLETE.md` for step-by-step instructions.**

**See `api/QUICK_DEPLOY.md` for quick reference.**

---

**Last Updated:** After commit `0243410`
**Status:** Ready for Hostinger deployment

