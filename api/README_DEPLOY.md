# ⚡ Quick Deploy to Hostinger

## 🎯 Your Configuration

**Database:**
- Host: `srv653.hstgr.io`
- Port: `3306`
- User: `u859590789_disys`
- Database: `u859590789_disys`

**Deployment Path:**
```
/home/u859590789/domains/menupi.com/public_html/api
```

---

## 📤 Upload Steps

### 1. Upload Files
1. **Hostinger File Manager** → `/public_html/api/`
2. **Upload entire `api/` folder** contents
3. **Set permissions:** Folders 755, Files 644, uploads/ 755

### 2. Create .env File
Create `.env` in `/public_html/api/` with:

```bash
DB_HOST=srv653.hstgr.io
DB_PORT=3306
DB_USER=u859590789_disys
DB_PASSWORD=hF~awOpY=0y
DB_NAME=u859590789_disys

JWT_SECRET=3f8182141d350b5d19399b160196c7f170d905eaee523a35e9984fbdb198ede6

NODE_ENV=production

ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com

MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf

BASE_URL=https://api.menupi.com
API_URL=https://api.menupi.com
```

### 3. Configure Domain
1. **Hostinger hPanel** → **Subdomains**
2. Create: `api.menupi.com` → `/public_html/api`
3. **Enable Free SSL**

### 4. Test
```bash
curl https://api.menupi.com/api/health
```

### 5. Frontend
**Vercel:** Set `VITE_API_URL=https://api.menupi.com/api`

---

## ✅ Done!

**See `DEPLOY_TO_HOSTINGER.md` for detailed instructions.**

