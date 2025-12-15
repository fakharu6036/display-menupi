# ✅ Verify API Setup After Creating Subdomain

## 🔍 Current Status

- ✅ Files uploaded to Hostinger
- ✅ Subdomain `api.menupi.com` created
- ⏳ DNS propagation in progress (5-30 minutes)

---

## 📋 Verification Checklist

### 1. Verify Subdomain Configuration in Hostinger

1. **Go to:** Hostinger hPanel → **Domains** → **Subdomains**
2. **Check:** `api.menupi.com` is listed
3. **Verify:** Document Root points to `/public_html/api`
4. **Check:** Status is "Active"

### 2. Verify Files Are in Correct Location

1. **Go to:** File Manager → `/public_html/api/`
2. **Check these files exist:**
   - `index.php` ✅
   - `.htaccess` ✅
   - `.env` ✅
   - `fix-auth.php` ✅
   - Folders: `config/`, `controllers/`, `routes/`, `utils/`, `middleware/` ✅

### 3. Verify .env File

1. **Open:** `/public_html/api/.env`
2. **Check these values:**
   ```bash
   DB_HOST=srv653.hstgr.io
   DB_PORT=3306
   DB_USER=u859590789_disys
   DB_PASSWORD=hF~awOpY=0y
   DB_NAME=u859590789_disys
   
   BASE_URL=https://api.menupi.com
   API_URL=https://api.menupi.com
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   ```

### 4. Verify File Permissions

**In File Manager:**
- **Folders:** Right-click → Permissions → **755**
- **Files:** Right-click → Permissions → **644**
- **uploads/ folder:** Must be **755** (writable)

### 5. Verify SSL Certificate

1. **Go to:** SSL section in Hostinger
2. **Find:** `api.menupi.com`
3. **Check:** SSL is "Active" or "Installed"
4. **Wait:** 1-5 minutes if just enabled

---

## ⏳ Wait for DNS Propagation

DNS can take **5-30 minutes** to propagate globally.

### Test DNS Propagation

```bash
# Test from your computer
nslookup api.menupi.com

# Or use online tools:
# - https://dnschecker.org
# - https://www.whatsmydns.net
```

**When DNS is ready:**
- `nslookup` will return an IP address (not NXDOMAIN)
- You'll be able to access `https://api.menupi.com`

---

## 🧪 Test API After DNS Propagates

### Test 1: Health Endpoint

```bash
curl https://api.menupi.com/api/health
```

**Expected response:**
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

### Test 2: Direct File Access

```bash
curl https://api.menupi.com/api/index.php
```

Should return JSON (not 404 or 500)

### Test 3: Check .env Protection

```bash
curl https://api.menupi.com/api/.env
```

Should return **403 Forbidden** (not 200 OK)

---

## 🐛 Common Issues After Creating Subdomain

### Issue 1: DNS Still Not Resolving After 30 Minutes

**Check:**
1. Subdomain is "Active" in Hostinger
2. Document Root is correct: `/public_html/api`
3. DNS records in Hostinger DNS zone

**Fix:**
- Contact Hostinger support if DNS doesn't propagate after 1 hour

### Issue 2: SSL Not Working

**Check:**
1. SSL is enabled for `api.menupi.com`
2. Wait 5-10 minutes after enabling
3. Check SSL status in Hostinger

**Fix:**
- Re-enable SSL if needed
- Wait for activation

### Issue 3: API Returns 404

**Check:**
1. Files are in `/public_html/api/` (not `/public_html/`)
2. `index.php` exists
3. `.htaccess` exists and is readable

**Fix:**
- Verify file paths
- Check `.htaccess` permissions (644)

### Issue 4: API Returns 500 Error

**Check:**
1. PHP error logs in Hostinger
2. `.env` file exists and has correct values
3. Database connection in `.env` is correct
4. File permissions (755/644)

**Fix:**
- Check error logs
- Verify `.env` configuration
- Fix file permissions

---

## ✅ Success Indicators

When everything is working:

1. ✅ `nslookup api.menupi.com` returns IP address
2. ✅ `curl https://api.menupi.com/api/health` returns success JSON
3. ✅ No DNS errors in browser
4. ✅ SSL certificate is valid (green lock)
5. ✅ Frontend can connect to API

---

## 🎯 Next Steps

1. **Wait 10-15 minutes** for DNS propagation
2. **Test with:** `nslookup api.menupi.com`
3. **When DNS resolves, test:** `curl https://api.menupi.com/api/health`
4. **If working, frontend will connect automatically!**

---

**DNS propagation is in progress. Check back in 10-15 minutes!**

