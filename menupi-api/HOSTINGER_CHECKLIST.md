# ✅ Hostinger Deployment Checklist

Use this checklist to ensure everything is set up correctly.

## 📋 Pre-Deployment

- [ ] Hostinger account has Node.js support enabled
- [ ] Domain `menupi.com` is configured in Hostinger
- [ ] MySQL database is created in Hostinger
- [ ] Database credentials are noted down
- [ ] All files from `menupi-api/` folder are ready to upload

## 🎯 Step 1: Subdomain Setup

- [ ] Subdomain `api.menupi.com` is created in Hostinger
- [ ] Document root is set to `/api` (or `/public_html/api`)
- [ ] DNS propagation is complete (can take up to 48 hours)

## 📁 Step 2: File Upload

- [ ] All files uploaded to `/api` folder:
  - [ ] `server.js`
  - [ ] `package.json`
  - [ ] `.env.example` (will rename to `.env`)
  - [ ] `.htaccess`
  - [ ] `uploads/` folder (with `.gitkeep`)
  - [ ] All other files

## ⚙️ Step 3: Node.js App

- [ ] Node.js app created in Hostinger
- [ ] App Name: `menupi-api`
- [ ] Node.js Version: 18.x or higher
- [ ] App Root: `/api` (matches upload location)
- [ ] App URL: `api.menupi.com`
- [ ] Start Command: `npm start`
- [ ] Port: (auto-assigned by Hostinger)

## 🔐 Step 4: Environment Variables

- [ ] `.env` file created (renamed from `.env.example`)
- [ ] All variables filled in:
  - [ ] `PORT=3001`
  - [ ] `NODE_ENV=production`
  - [ ] `DB_HOST=localhost` (or remote host)
  - [ ] `DB_USER=` (your Hostinger DB user)
  - [ ] `DB_PASSWORD=` (your Hostinger DB password)
  - [ ] `DB_NAME=` (your Hostinger DB name)
  - [ ] `JWT_SECRET=` (32+ character random string)
  - [ ] `ALLOWED_ORIGINS=` (comma-separated frontend URLs)
  - [ ] `MAX_FILE_SIZE=52428800`
  - [ ] `ALLOWED_MIME_TYPES=` (comma-separated MIME types)

## 🗄️ Step 5: Database

- [ ] Database schema imported (from `database/schema.sql`)
- [ ] Database connection tested
- [ ] Database credentials match `.env` file

## 📦 Step 6: Dependencies

- [ ] `npm install` completed successfully
- [ ] `node_modules/` folder exists in `/api`
- [ ] No installation errors in logs

## 🚀 Step 7: Start Application

- [ ] Node.js app is **Started** (not Stopped)
- [ ] Logs show: `MENUPI Digital Signage API running on 0.0.0.0:PORT`
- [ ] No errors in application logs

## ✅ Step 8: Verification

- [ ] Health endpoint works: `https://api.menupi.com/api/health`
- [ ] Returns: `{"status":"ok","timestamp":"..."}`
- [ ] Frontend can connect to API
- [ ] CORS is working (no CORS errors in browser console)
- [ ] Database queries work (test login or other endpoint)

## 🔒 Security Check

- [ ] `.env` file is not publicly accessible
- [ ] `JWT_SECRET` is strong and random (32+ characters)
- [ ] Database password is strong
- [ ] `ALLOWED_ORIGINS` only includes your domains
- [ ] `NODE_ENV=production` is set
- [ ] File uploads directory has proper permissions (755)

## 📝 Post-Deployment

- [ ] Frontend `.env` updated with: `VITE_API_URL=https://api.menupi.com`
- [ ] Frontend deployed and tested
- [ ] All API endpoints tested
- [ ] File uploads tested
- [ ] Database operations tested
- [ ] Logs monitored for errors

## 🎉 Success Criteria

- ✅ API responds at `https://api.menupi.com/api/health`
- ✅ Frontend can authenticate and make API calls
- ✅ File uploads work
- ✅ Database operations work
- ✅ No errors in logs
- ✅ CORS allows frontend domains

---

**Once all items are checked, your API is ready for production!**

