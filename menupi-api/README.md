# MENUPI Backend API

Standalone backend API server for MENUPI Digital Signage Platform.

## 📋 Requirements

- Node.js 18+ 
- MySQL Database
- Hostinger Node.js hosting (or compatible)

## 🚀 Quick Start

### 1. Upload to Hostinger

1. **Access Hostinger File Manager** or use FTP/SFTP
2. **Navigate to your domain's root** (usually `public_html` or `domains/yourdomain.com/public_html`)
3. **Create a folder** called `api` (or `menupi-api`)
4. **Upload all files** from this folder:
   - `server.js`
   - `package.json`
   - `.env.example` (rename to `.env` after upload)
   - `uploads/` directory

### 2. Create Node.js App in Hostinger

1. **Go to Hostinger Control Panel**
2. **Navigate to:** Advanced → Node.js
3. **Click:** "Create Node.js App"
4. **Configure:**
   - **App Name:** `menupi-api` (or your choice)
   - **Node.js Version:** 18.x or higher
   - **App Root:** `/api` (or the folder you uploaded to)
   - **App URL:** `api.menupi.com` (or your subdomain)
   - **Start Command:** `npm start`
   - **Port:** Leave default (usually auto-assigned)

### 3. Configure Environment Variables

1. **In Hostinger Node.js App settings**, find "Environment Variables"
2. **Add the following variables:**
   ```
   PORT=3001
   NODE_ENV=production
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_database_name
   JWT_SECRET=your_super_secret_jwt_key
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   MAX_FILE_SIZE=52428800
   ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
   ```

   **OR** upload `.env` file directly to the app root folder.

### 4. Install Dependencies

1. **In Hostinger Node.js App**, go to "Terminal" or "SSH"
2. **Navigate to your app directory:**
   ```bash
   cd /path/to/your/app
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```

### 5. Start the Application

1. **In Hostinger Node.js App settings**, click "Start" or "Restart"
2. **Check logs** to ensure the server started successfully
3. **Test the health endpoint:**
   ```
   GET https://api.menupi.com/api/health
   ```

## ✅ Verification

### Test Health Endpoint

```bash
curl https://api.menupi.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### Test Public Screen Endpoint

```bash
curl https://api.menupi.com/api/public/screen/TESTCODE
```

## 📁 Folder Structure

```
menupi-api/
├── server.js          # Main API server
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── .env               # Your actual environment variables (create this)
├── uploads/           # Media file uploads directory
│   └── .gitkeep
└── README.md          # This file
```

## 🔧 Configuration

### Database Setup

1. **Create MySQL database** in Hostinger
2. **Import schema** from `database/schema.sql` (if available)
3. **Update `.env`** with database credentials

### CORS Configuration

The API only allows requests from:
- `https://app.menupi.com` (Dashboard)
- `https://tv.menupi.com` (TV Player)

**DO NOT** add `menupi.com` or any other domains.

### File Uploads

- **Upload directory:** `uploads/`
- **Max file size:** 50MB (configurable via `MAX_FILE_SIZE`)
- **Allowed types:** Images, Videos, PDFs (configurable via `ALLOWED_MIME_TYPES`)

## 🔍 Troubleshooting

### Server Won't Start

1. **Check Node.js version:** Must be 18+
2. **Check logs:** View error messages in Hostinger Node.js logs
3. **Verify environment variables:** All required vars must be set
4. **Check database connection:** Verify DB credentials

### Database Connection Errors

1. **Verify database credentials** in `.env`
2. **Check database exists** and is accessible
3. **Test connection** from Hostinger MySQL panel
4. **Check firewall rules** if using remote database

### CORS Errors

1. **Verify `ALLOWED_ORIGINS`** includes your frontend domains
2. **Check request origin** matches exactly (including https://)
3. **Verify CORS middleware** is configured correctly

### File Upload Issues

1. **Check `uploads/` directory** exists and is writable
2. **Verify file size** is within `MAX_FILE_SIZE` limit
3. **Check file type** is in `ALLOWED_MIME_TYPES`

## 📝 API Endpoints

### Public Endpoints (No Auth)
- `GET /api/health` - Health check
- `GET /api/public/screen/:code` - Get screen data for TV player

### Authenticated Endpoints (JWT Required)
- `POST /api/login` - User login
- `GET /api/users/me` - Get current user
- `GET /api/screens` - List screens
- `POST /api/screens` - Create screen
- `PUT /api/screens/:id` - Update screen
- `DELETE /api/screens/:id` - Delete screen
- `GET /api/media` - List media
- `POST /api/media/upload` - Upload media
- And more...

## 🔐 Security Notes

- **JWT_SECRET:** Use a strong, random string (minimum 32 characters)
- **Database credentials:** Never commit `.env` to version control
- **CORS:** Only allow trusted origins
- **File uploads:** Validate file types and sizes
- **Rate limiting:** Consider adding rate limiting for production

## 📞 Support

For issues:
1. Check Hostinger Node.js logs
2. Verify all environment variables are set
3. Test database connection
4. Check API endpoint responses

---

**Version:** 1.0.0  
**Last Updated:** 2024

