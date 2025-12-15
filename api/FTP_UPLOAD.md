# 📤 FTP Upload Guide for MENUPI API

## Option 1: Using FileZilla (Recommended)

### Step 1: Get FTP Credentials from Hostinger
1. Login to Hostinger hPanel
2. Go to: **Files** → **FTP Accounts**
3. Create new FTP account or use existing
4. Note down:
   - **FTP Host:** Usually `ftp.menupi.com` or your server IP
   - **FTP Username:** Your FTP username
   - **FTP Password:** Your FTP password
   - **Port:** Usually `21`

### Step 2: Connect with FileZilla
1. Download FileZilla: https://filezilla-project.org/
2. Open FileZilla
3. Enter credentials:
   - **Host:** `ftp.menupi.com` (or your FTP host)
   - **Username:** Your FTP username
   - **Password:** Your FTP password
   - **Port:** `21`
4. Click **Quickconnect**

### Step 3: Navigate to Upload Location
1. In **Remote site** (right side), navigate to:
   - `/domains/menupi.com/public_html/api`
   - OR `/public_html/api`
   - OR just `/api` (if subdomain points here)

### Step 4: Upload Files
1. In **Local site** (left side), navigate to:
   - `/Users/mdfakharuddin/Desktop/menupi-signage/api`
2. Select ALL files and folders
3. Drag and drop to remote site
4. Wait for upload to complete

### Step 5: Set Permissions
1. Right-click on folders → **File permissions** → `755`
2. Right-click on files → **File permissions** → `644`
3. Make sure `.htaccess` is readable

## Option 2: Using Hostinger File Manager

### Step 1: Access File Manager
1. Login to Hostinger hPanel
2. Go to: **Files** → **File Manager**
3. Navigate to: `/domains/menupi.com/public_html/api`
   - Or create `/api` folder if it doesn't exist

### Step 2: Upload Files
1. Click **Upload** button
2. Select all files from `api/` folder
3. Wait for upload to complete
4. **Important:** Upload folder structure:
   ```
   api/
   ├── index.php
   ├── .htaccess
   ├── .env.example
   ├── config/
   ├── middleware/
   ├── routes/
   ├── controllers/
   ├── utils/
   └── uploads/
   ```

### Step 3: Create .env File
1. In File Manager, find `.env.example`
2. Copy it to `.env`
3. Edit `.env` and fill in your database credentials

### Step 4: Set Permissions
1. Folders: Right-click → **Change Permissions** → `755`
2. Files: Right-click → **Change Permissions** → `644`

## Option 3: Using Terminal/Command Line

If you have SSH access:

```bash
# Navigate to your local api folder
cd /Users/mdfakharuddin/Desktop/menupi-signage

# Upload via SCP (if SSH enabled)
scp -r api/* username@your-server:/home/username/domains/menupi.com/public_html/api/

# Or use rsync
rsync -avz api/ username@your-server:/home/username/domains/menupi.com/public_html/api/
```

## 📁 Files to Upload

Upload the entire `api/` folder structure:

```
api/
├── index.php
├── .htaccess
├── .env.example
├── config/
│   ├── config.php
│   └── database.php
├── middleware/
│   └── auth.php
├── routes/
│   ├── auth.php
│   ├── screens.php
│   └── public.php
├── controllers/
│   ├── AuthController.php
│   ├── ScreenController.php
│   └── PublicController.php
├── utils/
│   ├── jwt.php
│   ├── response.php
│   ├── crypto.php
│   └── upload.php
└── uploads/
    └── .gitkeep
```

## ✅ After Upload

1. **Create `.env` file:**
   - Copy `.env.example` to `.env`
   - Fill in database credentials

2. **Test:**
   - `https://api.menupi.com/health` should work
   - `https://api.menupi.com/test-headers.php` should show headers

3. **Delete test files:**
   - `debug.php`
   - `test-headers.php`
   - `test-auth.php`
   - `test-api.html`

## 🔒 Security

- Make sure `.env` file is not publicly accessible
- Set proper file permissions (644 for files, 755 for folders)
- Don't upload `.env` to public repositories

