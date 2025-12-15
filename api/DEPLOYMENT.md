# 🚀 MENUPI PHP API - Deployment Guide

## ✅ Complete PHP Backend Ready for Hostinger

This is a **pure PHP backend** that works on Hostinger shared hosting without Node.js.

## 📁 What's Included

### Core Files
- ✅ `index.php` - Main router (all requests go here)
- ✅ `.htaccess` - Apache routing & security
- ✅ `.env.example` - Environment template

### Configuration
- ✅ `config/config.php` - Loads environment variables
- ✅ `config/database.php` - PDO database connection

### Authentication
- ✅ `middleware/auth.php` - JWT authentication
- ✅ `utils/jwt.php` - JWT generation/verification
- ✅ `controllers/AuthController.php` - Login, register, user data

### Routes
- ✅ `routes/auth.php` - Authentication endpoints
- ✅ `routes/public.php` - Public endpoints (health, screen data)
- ✅ `routes/screens.php` - Screen management

### Controllers
- ✅ `controllers/AuthController.php` - Authentication logic
- ✅ `controllers/ScreenController.php` - Screen CRUD
- ✅ `controllers/PublicController.php` - Public TV player endpoint

### Utilities
- ✅ `utils/response.php` - JSON response helpers
- ✅ `utils/upload.php` - File upload validation
- ✅ `utils/crypto.php` - Code generation

## 🎯 Implemented Endpoints

### Public (No Auth)
- ✅ `GET /api/health` - Health check
- ✅ `GET /api/public/screen/:code` - TV player screen data
- ✅ `POST /api/screens/:id/ping` - Screen heartbeat

### Authentication
- ✅ `POST /api/login` - User login
- ✅ `POST /api/register` - User registration
- ✅ `GET /api/users/me` - Get current user
- ✅ `GET /api/users/me/refresh` - Refresh user data

### Screens (Auth Required)
- ✅ `GET /api/screens` - List all screens
- ✅ `POST /api/screens` - Create new screen
- ✅ `PUT /api/screens/:id` - Update screen & playlist
- ✅ `DELETE /api/screens/:id` - Delete screen

## 📤 Upload Instructions

### Step 1: Upload Files
1. **Via File Manager:**
   - Go to Hostinger hPanel → File Manager
   - Navigate to domain root (usually `public_html`)
   - Create folder: `api`
   - Upload ALL files from `api/` folder

2. **Via FTP/SFTP:**
   - Connect to your Hostinger server
   - Upload entire `api/` folder to root
   - Preserve folder structure

### Step 2: Set Permissions
```bash
Folders: 755
Files: 644
```

### Step 3: Configure Environment
1. Copy `.env.example` to `.env`
2. Edit `.env` and fill in:
   ```bash
   DB_HOST=localhost
   DB_USER=your_hostinger_db_user
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   JWT_SECRET=generate_random_32_char_string
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   ```

### Step 4: Test
```bash
curl https://api.menupi.com/api/health
```

## ✅ Verification Checklist

- [ ] All files uploaded to `/api` folder
- [ ] `.env` file created and configured
- [ ] Database credentials correct
- [ ] File permissions set (755/644)
- [ ] Health endpoint returns `{"success":true}`
- [ ] Login endpoint works
- [ ] Screens endpoint works (with auth)

## 🔧 Requirements

- PHP 7.4+ (Hostinger supports this)
- MySQL 5.7+ (Hostinger supports this)
- Apache with `mod_rewrite` (enabled by default)
- PDO extension (enabled by default)

## 🎉 Ready to Deploy!

The backend is **complete and ready** for Hostinger shared hosting.

**No Node.js required!**  
**No background processes!**  
**No VPS needed!**

Just upload and configure `.env` file.

