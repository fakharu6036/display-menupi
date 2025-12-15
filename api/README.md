# MENUPI PHP API

Pure PHP backend API for MENUPI Digital Signage Platform. Designed for Hostinger shared hosting.

## 📁 Folder Structure

```
api/
├── index.php              # Main router
├── .htaccess             # Apache routing & security
├── .env.example          # Environment variables template
├── config/
│   ├── config.php        # Configuration loader
│   └── database.php      # Database connection
├── middleware/
│   └── auth.php          # Authentication middleware
├── routes/
│   ├── auth.php          # Authentication routes
│   ├── screens.php       # Screen routes
│   └── public.php        # Public routes
├── controllers/
│   ├── AuthController.php
│   ├── ScreenController.php
│   └── PublicController.php
├── utils/
│   ├── jwt.php           # JWT generation/verification
│   ├── response.php      # Response helpers
│   ├── upload.php        # File upload utilities
│   └── crypto.php        # Cryptographic functions
└── uploads/              # Media file storage
```

## 🚀 Quick Start

### 1. Upload to Hostinger

1. Upload entire `api/` folder to your domain root
2. Ensure folder structure is preserved
3. Set permissions: folders `755`, files `644`

### 2. Configure Environment

1. Copy `.env.example` to `.env`
2. Fill in database credentials
3. Set `JWT_SECRET` (generate with: `php -r "echo bin2hex(random_bytes(32));"`)
4. Configure `ALLOWED_ORIGINS`

### 3. Database Setup

1. Create MySQL database in Hostinger
2. Import schema from `database/schema.sql`
3. Update `.env` with database credentials

### 4. Test

```bash
curl https://api.menupi.com/api/health
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

## 📝 API Endpoints

### Public (No Auth)
- `GET /api/health` - Health check
- `GET /api/public/screen/:code` - Get screen data for TV player
- `POST /api/screens/:id/ping` - Screen heartbeat

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /api/users/me` - Get current user
- `GET /api/users/me/refresh` - Refresh user data

### Screens (Auth Required)
- `GET /api/screens` - List screens
- `POST /api/screens` - Create screen
- `PUT /api/screens/:id` - Update screen
- `DELETE /api/screens/:id` - Delete screen

## 🔐 Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

Token expires after 5 hours.

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Database
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT
JWT_SECRET=your_32_character_secret_key

# CORS
ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

# File Uploads
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf

# Base URL
BASE_URL=https://api.menupi.com
```

## 🔒 Security

- JWT authentication
- Password hashing (bcrypt)
- Prepared statements (SQL injection protection)
- CORS restrictions
- File type validation
- File size limits
- `.htaccess` protection for sensitive files

## 📦 Requirements

- PHP 7.4+
- MySQL 5.7+
- Apache with mod_rewrite
- PDO extension
- OpenSSL extension

## 🐛 Troubleshooting

### 500 Internal Server Error
- Check `.htaccess` is readable
- Verify PHP version (7.4+)
- Check error logs in Hostinger

### Database Connection Failed
- Verify credentials in `.env`
- Check database exists
- Ensure user has proper permissions

### CORS Errors
- Verify `ALLOWED_ORIGINS` in `.env`
- Check request origin matches exactly

### Routes Not Working
- Ensure `mod_rewrite` is enabled
- Verify `.htaccess` is in root
- Check Apache `AllowOverride All`

## 📞 Support

For issues:
1. Check Hostinger error logs
2. Verify all environment variables
3. Test database connection
4. Verify file permissions

---

**Version:** 1.0.0  
**Last Updated:** 2024

