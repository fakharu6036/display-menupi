# 📤 Upload Instructions for Hostinger

## Quick Upload Checklist

### ✅ Files to Upload

Upload **ALL** files from the `menupi-api/` folder:

```
menupi-api/
├── server.js          ✅ Upload
├── package.json       ✅ Upload
├── .env.example       ✅ Upload (rename to .env after)
├── uploads/           ✅ Upload (entire folder)
│   └── .gitkeep
└── README.md          ✅ Upload (optional, for reference)
```

### 📋 Step-by-Step Upload

1. **Access Hostinger File Manager**
   - Login to Hostinger Control Panel
   - Go to File Manager

2. **Navigate to Your Domain Root**
   - Usually: `public_html` or `domains/yourdomain.com/public_html`
   - Or create a subfolder: `api` or `menupi-api`

3. **Upload Files**
   - Upload `server.js`
   - Upload `package.json`
   - Upload `.env.example` (rename to `.env` after upload)
   - Upload `uploads/` folder (with `.gitkeep` file inside)

4. **Create `.env` File**
   - Rename `.env.example` to `.env`
   - Edit `.env` and fill in your actual values:
     - Database credentials
     - JWT_SECRET (generate a strong random string)
     - Port (usually auto-assigned by Hostinger)

5. **Create Node.js App in Hostinger**
   - Go to: Advanced → Node.js
   - Click: "Create Node.js App"
   - Configure:
     - **App Root:** `/api` (or your folder path)
     - **Start Command:** `npm start`
     - **Node Version:** 18.x or higher

6. **Set Environment Variables**
   - In Node.js App settings → Environment Variables
   - Add all variables from `.env` file
   - OR upload `.env` file directly

7. **Install Dependencies**
   - In Node.js App → Terminal/SSH
   - Run: `npm install`

8. **Start Application**
   - Click "Start" or "Restart" in Node.js App
   - Check logs for success message

9. **Test Health Endpoint**
   - Visit: `https://api.menupi.com/api/health`
   - Should return: `{"status":"ok",...}`

## ⚠️ Important Notes

- **Port:** Hostinger usually auto-assigns a port. Check your Node.js app settings.
- **Database:** Use `localhost` for DB_HOST if database is on same server.
- **CORS:** Only `app.menupi.com` and `tv.menupi.com` are allowed.
- **Uploads Folder:** Must exist and be writable (chmod 755).

## 🔍 Verification

After upload, test:

```bash
# Health check
curl https://api.menupi.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","database":"connected","uptime":...}
```

## 🐛 Troubleshooting

**Server won't start:**
- Check Node.js version (must be 18+)
- Verify all environment variables are set
- Check logs in Hostinger Node.js panel

**Database connection fails:**
- Verify DB credentials in `.env`
- Check database exists and is accessible
- Test connection from Hostinger MySQL panel

**File uploads fail:**
- Check `uploads/` folder exists
- Verify folder permissions (chmod 755)
- Check `MAX_FILE_SIZE` in `.env`

---

**Ready to upload!** 🚀

