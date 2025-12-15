# 🔧 Setup .env File on Hostinger

## ⚠️ Current Issue

The API is showing a database configuration error because the `.env` file is missing or incomplete.

---

## ✅ Solution: Create .env File

### Step 1: Access Hostinger File Manager

1. Log in to **Hostinger hPanel**
2. Go to **File Manager**
3. Navigate to: `/home/u859590789/domains/menupi.com/public_html/api/`

### Step 2: Create .env File

1. **Click "New File"** in File Manager
2. **Name it:** `.env` (with the dot at the beginning)
3. **Copy and paste** the following content:

```env
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

1. **Right-click** on `.env` file
2. **Select "Change Permissions"**
3. **Set to:** `644` (or `600` for more security)
4. **Save**

---

## 🔍 Verify .env File

### Option 1: Via File Manager
- Check that `.env` file exists in `/api/` directory
- Verify file size is not 0 bytes

### Option 2: Via SSH (if available)
```bash
cd /home/u859590789/domains/menupi.com/public_html/api/
ls -la .env
cat .env
```

---

## ✅ Test After Setup

### Test Root Endpoint:
```bash
curl https://api.menupi.com/
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "name": "MENUPI API",
    "version": "1.0.0",
    "status": "online",
    "endpoints": {...}
  }
}
```

### Test Health Endpoint:
```bash
curl https://api.menupi.com/api/health
```

**Expected Response:**
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

## ⚠️ Important Notes

1. **File Name:** Must be exactly `.env` (with the dot)
2. **Location:** Must be in `/api/` directory
3. **Permissions:** Should be `644` or `600` (not `777`)
4. **No Spaces:** Don't add spaces around `=` signs
5. **No Quotes:** Don't wrap values in quotes (unless needed)

---

## 🐛 Troubleshooting

### If .env file doesn't show in File Manager:
- Enable "Show Hidden Files" in File Manager settings
- Or create via SSH if available

### If database still fails:
- Verify database credentials in Hostinger MySQL section
- Check that database `u859590789_disys` exists
- Verify user `u859590789_disys` has access

### If file permissions error:
- Set permissions to `644` or `600`
- Make sure file is readable by PHP

---

## 📝 Quick Copy-Paste Template

```env
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

---

**After creating the `.env` file, the API should work correctly!**

