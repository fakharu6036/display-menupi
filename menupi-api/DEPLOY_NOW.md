# 🚀 Deploy to Railway - Step by Step

## Method 1: Railway Dashboard (Easiest)

### Step 1: Go to Railway
1. Open: https://railway.app
2. Login with GitHub (if not already)

### Step 2: Create New Project
1. Click **"New Project"** (top right)
2. Select **"Deploy from GitHub repo"**
3. Choose: **`fakharu6036/display-menupi`**
4. Click **"Deploy Now"**

### Step 3: Configure Service
1. Railway will detect Node.js automatically
2. **IMPORTANT:** Set **Root Directory** to: `menupi-api`
   - Click on the service
   - Go to **Settings** tab
   - Find **"Root Directory"**
   - Enter: `menupi-api`
   - Click **Save**

### Step 4: Add MySQL Database
1. In your project, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. Railway will create MySQL addon automatically

### Step 5: Configure Environment Variables
1. Click on your **API service** (not MySQL)
2. Go to **Variables** tab
3. Click **"+ New Variable"**
4. Add these variables:

```bash
# Server
NODE_ENV=production

# Database (Use Railway's MySQL variables)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# JWT (Generate a strong random string - min 32 chars)
JWT_SECRET=your_super_secret_jwt_key_change_this_minimum_32_characters_long

# CORS
ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

# File Uploads (optional)
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
```

**To use Railway's MySQL variables:**
- Click **"Reference Variable"** button
- Select **MySQL** service
- Choose the variable (MYSQLHOST, MYSQLUSER, etc.)
- Railway will auto-format as `${{MySQL.MYSQLHOST}}`

### Step 6: Deploy
1. Railway will automatically deploy after you save variables
2. Or click **"Deploy"** button manually
3. Wait for deployment to complete (1-2 minutes)

### Step 7: Check Logs
1. Click on your service
2. Go to **"Logs"** tab
3. Look for:
   ```
   ✅ MENUPI Digital Signage API running on 0.0.0.0:PORT
   ```

### Step 8: Test
1. Railway will assign a URL like: `your-app.up.railway.app`
2. Test health endpoint:
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```
3. Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "database": "connected"
   }
   ```

### Step 9: Add Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter: `api.menupi.com`
4. Railway will provide DNS instructions
5. Configure DNS at your domain registrar

---

## Method 2: Railway CLI (Advanced)

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Login
```bash
railway login
```

### Link Project
```bash
cd menupi-api
railway link
# Select your project or create new
```

### Set Variables
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_secret_here
railway variables set ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
```

### Deploy
```bash
railway up
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Logs show: `running on 0.0.0.0:PORT`
- [ ] Health endpoint works: `/api/health`
- [ ] Database status: `"database": "connected"`
- [ ] No errors in Railway logs
- [ ] Service shows "Active" status

---

## 🐛 Common Issues

### "Application failed to respond"
- ✅ **Fixed in latest code** - Make sure Railway has latest commit
- Check logs for binding: should see `0.0.0.0`, not `localhost`
- Verify Root Directory is `menupi-api/`

### Database connection errors
- Verify MySQL addon is running
- Check DB_* variables are set correctly
- Use Railway's variable references: `${{MySQL.MYSQLHOST}}`

### Port errors
- Railway auto-sets PORT - don't override it
- Server uses `process.env.PORT` automatically

---

## 📞 Need Help?

1. Check Railway logs first
2. Verify all environment variables
3. Test health endpoint
4. See `RAILWAY_TROUBLESHOOTING.md` for more

---

**Ready to deploy!** 🚀

