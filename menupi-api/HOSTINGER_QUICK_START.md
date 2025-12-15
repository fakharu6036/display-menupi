# ⚡ Hostinger Quick Start - 5 Steps

## 🎯 Quick Deployment Checklist

### ✅ Step 1: Create Subdomain
- hPanel → Domains → Subdomains
- Create: `api.menupi.com`
- Document Root: `/api`

### ✅ Step 2: Upload Files
- File Manager → Navigate to domain root
- Create folder: `api`
- Upload ALL files from `menupi-api/` folder

### ✅ Step 3: Create Node.js App
- hPanel → Advanced → Node.js
- Create App:
  - **App Root:** `/api`
  - **App URL:** `api.menupi.com`
  - **Start Command:** `npm start`
  - **Node Version:** 18.x

### ✅ Step 4: Configure Environment
- In Node.js app settings → Environment Variables
- OR create `.env` file in `/api` folder
- Add all variables (see `.env.example`)

### ✅ Step 5: Install & Start
- Terminal/SSH: `cd /api && npm install`
- Node.js app settings: Click **"Start"**

## 🧪 Test

```
https://api.menupi.com/api/health
```

Should return: `{"status":"ok",...}`

## 📚 Full Guide

See `HOSTINGER_DEPLOYMENT.md` for detailed instructions.

