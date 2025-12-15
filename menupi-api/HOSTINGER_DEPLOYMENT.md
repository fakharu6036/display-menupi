# 🚀 Hostinger Deployment Guide - MENUPI API

Complete step-by-step guide to deploy MENUPI backend API to Hostinger using `api.menupi.com` subdomain.

## 📋 Prerequisites

- Hostinger hosting account with Node.js support
- Domain `menupi.com` already configured in Hostinger
- MySQL database created in Hostinger
- FTP/File Manager access

## 🎯 Step 1: Create Subdomain in Hostinger

1. **Login to Hostinger hPanel**
2. **Go to:** Domains → Subdomains
3. **Create Subdomain:**
   - **Subdomain:** `api`
   - **Domain:** `menupi.com`
   - **Document Root:** `/api` (or `/public_html/api`)
   - **Click:** Create

**Note:** Document root will be where you upload files. Common paths:
- `/public_html/api`
- `/domains/menupi.com/public_html/api`
- `/api`

## 📁 Step 2: Upload Files via File Manager

1. **Go to:** File Manager in hPanel
2. **Navigate to:** Your domain's root (usually `public_html` or `domains/menupi.com/public_html`)
3. **Create folder:** `api` (if not created by subdomain)
4. **Upload ALL files from `menupi-api/` folder:**
   ```
   api/
   ├── server.js
   ├── package.json
   ├── .env.example
   ├── uploads/
   │   └── .gitkeep
   └── (all other files)
   ```

**Upload Methods:**
- **File Manager:** Upload → Select files → Upload
- **FTP/SFTP:** Use FileZilla or similar
- **Compress & Extract:** Zip files locally, upload zip, extract in File Manager

## ⚙️ Step 3: Create Node.js App in Hostinger

1. **Go to:** Advanced → Node.js (in hPanel)
2. **Click:** "Create Node.js App" or "Add Node.js App"
3. **Configure the app:**

   ```
   App Name: menupi-api
   Node.js Version: 18.x (or latest available)
   App Root: /api (or full path like /public_html/api)
   App URL: api.menupi.com
   Start Command: npm start
   Port: (Leave default - Hostinger will assign)
   ```

4. **Click:** Create/Install

**Important Notes:**
- **App Root** must match where you uploaded files
- **App URL** should be `api.menupi.com` (without http://)
- **Start Command** is `npm start` (runs `node server.js`)

## 🔐 Step 4: Configure Environment Variables

### Option A: Via Hostinger Node.js App Settings

1. **In Node.js App settings**, find "Environment Variables" or ".env"
2. **Add these variables:**

   ```bash
   PORT=3001
   NODE_ENV=production
   DB_HOST=localhost
   DB_USER=your_hostinger_db_user
   DB_PASSWORD=your_hostinger_db_password
   DB_NAME=your_hostinger_db_name
   JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   MAX_FILE_SIZE=52428800
   ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
   ```

### Option B: Create .env File Directly

1. **In File Manager**, navigate to `/api` folder
2. **Rename** `.env.example` to `.env`
3. **Edit** `.env` file and fill in values:

   ```bash
   PORT=3001
   NODE_ENV=production
   DB_HOST=localhost
   DB_USER=u123456789_menupi
   DB_PASSWORD=your_actual_password
   DB_NAME=u123456789_menupi_db
   JWT_SECRET=generate_a_random_32_character_string_here
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   MAX_FILE_SIZE=52428800
   ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
   ```

**To generate JWT_SECRET:**
```bash
# Run locally or in Hostinger terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Step 5: Configure MySQL Database

1. **Go to:** Databases → MySQL Databases (in hPanel)
2. **Note your database credentials:**
   - Host: Usually `localhost` or `127.0.0.1`
   - Username: Usually starts with `u` followed by numbers
   - Database Name: Usually same as username
   - Password: (the one you set)

3. **Update `.env` file** with these credentials

4. **Import database schema:**
   - Go to: phpMyAdmin (in hPanel)
   - Select your database
   - Import: `database/schema.sql` from the main project

## 📦 Step 6: Install Dependencies

### Option A: Via Hostinger Terminal/SSH

1. **Go to:** Advanced → Terminal (or SSH Access)
2. **Navigate to app directory:**
   ```bash
   cd /home/username/public_html/api
   # OR
   cd /home/username/domains/menupi.com/public_html/api
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```

### Option B: Via Node.js App Settings

Some Hostinger panels have "Install Dependencies" button in Node.js app settings. Use that if available.

## 🚀 Step 7: Start the Application

1. **In Node.js App settings**, click **"Start"** or **"Restart"**
2. **Check logs** to verify:
   - Go to: Node.js App → Logs
   - Should see: `MENUPI Digital Signage API running on 0.0.0.0:PORT`

## ✅ Step 8: Verify Deployment

### Test Health Endpoint

Open browser or use curl:
```
https://api.menupi.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX..."
}
```

### Test from Frontend

Update your frontend `.env`:
```bash
VITE_API_URL=https://api.menupi.com
```

## 🔧 Troubleshooting

### ❌ "Cannot find module" errors

**Fix:**
- Make sure `npm install` ran successfully
- Check `node_modules/` folder exists in `/api`
- Verify `package.json` is in `/api` folder

### ❌ "Port already in use"

**Fix:**
- Hostinger assigns port automatically
- Don't hardcode PORT in `.env` if Hostinger provides it
- Use `process.env.PORT` (already configured in server.js)

### ❌ "Database connection failed"

**Fix:**
- Verify DB credentials in `.env`
- Check database exists in phpMyAdmin
- Ensure database user has proper permissions
- Try `localhost` or `127.0.0.1` for DB_HOST

### ❌ "CORS errors"

**Fix:**
- Verify `ALLOWED_ORIGINS` in `.env` includes your frontend URLs
- Check `NODE_ENV=production` is set
- Ensure frontend is using correct API URL

### ❌ "Application not responding"

**Fix:**
- Check Node.js app is **Started** (not Stopped)
- Verify logs for errors
- Check file permissions (should be 644 for files, 755 for folders)
- Ensure `server.js` exists and is readable

### ❌ "Subdomain not working"

**Fix:**
- Verify DNS propagation (can take up to 48 hours)
- Check subdomain is created in Hostinger
- Ensure Node.js app URL matches subdomain
- Try accessing via IP first to test

## 📝 File Structure After Upload

```
/home/username/public_html/api/
├── server.js
├── package.json
├── .env
├── node_modules/
├── uploads/
│   └── (uploaded media files)
└── (other files)
```

## 🔒 Security Checklist

- [ ] `.env` file is not publicly accessible (Hostinger should protect it)
- [ ] `JWT_SECRET` is strong and random (32+ characters)
- [ ] Database password is strong
- [ ] `ALLOWED_ORIGINS` only includes your domains
- [ ] `NODE_ENV=production` is set
- [ ] File uploads directory has proper permissions

## 📞 Hostinger Support

If you encounter issues:
1. Check Hostinger documentation: https://support.hostinger.com
2. Contact Hostinger support via live chat
3. Check Node.js app logs in hPanel

## 🎉 Success!

Once deployed, your API will be available at:
- **API Base URL:** `https://api.menupi.com`
- **Health Check:** `https://api.menupi.com/api/health`
- **API Endpoints:** `https://api.menupi.com/api/*`

Update your frontend to use: `VITE_API_URL=https://api.menupi.com`

