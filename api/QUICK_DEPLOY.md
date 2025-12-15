# ⚡ Quick Deploy to Hostinger - PHP Backend

## 🎯 Goal
Deploy PHP backend to: `/home/u859590789/domains/menupi.com/public_html/api`

---

## 📤 Step 1: Upload Files

1. **Hostinger File Manager** → Navigate to `/public_html/api/`
2. **Upload entire `api/` folder** contents
3. **Set permissions:**
   - Folders: **755**
   - Files: **644**
   - `uploads/` folder: **755** (writable)

---

## ⚙️ Step 2: Create .env File

In `/public_html/api/` create `.env`:

```bash
DB_HOST=localhost
DB_USER=u859590789_your_db_user
DB_PASSWORD=your_password
DB_NAME=u859590789_your_db_name

JWT_SECRET=generate_64_char_hex_string_here
NODE_ENV=production

ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf

BASE_URL=https://api.menupi.com
API_URL=https://api.menupi.com
```

**Generate JWT Secret:**
```bash
php -r "echo bin2hex(random_bytes(32));"
```

---

## 🗄️ Step 3: Database

1. **Hostinger hPanel** → **MySQL Databases**
2. **Create database** and user
3. **phpMyAdmin** → **Import** `database/schema.sql`

---

## 🌐 Step 4: Domain

1. **Hostinger hPanel** → **Subdomains**
2. **Create:** `api.menupi.com` → `/public_html/api`
3. **Enable SSL** (Free SSL)
4. **Wait 5-30 minutes** for DNS

---

## ✅ Step 5: Test

```bash
curl https://api.menupi.com/api/health
```

Should return:
```json
{"success":true,"data":{"status":"ok","database":"connected"}}
```

---

## 🎨 Step 6: Frontend

**Vercel Environment Variable:**
```
VITE_API_URL=https://api.menupi.com/api
```

---

## ✅ Done!

Your PHP backend is now running on Hostinger!

**See `HOSTINGER_DEPLOYMENT_COMPLETE.md` for detailed guide.**

