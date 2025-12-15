# 🔧 Fix "Failed to fetch" - Login 404 Issue

## 🔍 Problem

The `/login` endpoint is returning a **404 HTML page from Hostinger's CDN** instead of reaching the PHP API.

**Symptoms:**
- Root endpoint (`/`) works ✅
- `/login` endpoint returns 404 HTML page ❌
- Server header shows: `server: hcdn` (Hostinger CDN)

---

## ✅ Solution

### Step 1: Upload Fixed `.htaccess` File

I've updated the `.htaccess` file to ensure all requests are routed to `index.php`:

**File to upload:**
- `api/.htaccess`

**Key changes:**
- Moved rewrite rule BEFORE file/directory checks
- Ensures all routes (including `/login`) reach `index.php`

### Step 2: Clear Hostinger CDN Cache

The CDN might be caching the 404 response. Try:

1. **Wait 5-10 minutes** for CDN cache to expire
2. **Or contact Hostinger support** to clear CDN cache for `api.menupi.com`
3. **Or disable CDN temporarily** in Hostinger panel (if option available)

### Step 3: Verify After Upload

After uploading the new `.htaccess` file:

```bash
# Test login endpoint
curl -X POST https://api.menupi.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Should return JSON (not HTML 404)
```

---

## 📋 What Changed

### `.htaccess` Fix:

**Before:**
```apache
# Check for files/directories FIRST (stops routing)
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule . - [L]

# Then route to index.php (never reached for /login)
RewriteRule ^(.*)$ index.php [QSA,L]
```

**After:**
```apache
# Route to index.php FIRST (catches all routes)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

This ensures `/login` (and all other routes) reach `index.php` for PHP routing.

---

## 🐛 Why This Happens

Hostinger's CDN (`hcdn`) is intercepting requests before they reach PHP:
- Root `/` might be cached as working
- `/login` might be cached as 404
- CDN returns cached 404 HTML instead of routing to PHP

---

## ✅ After Fix

1. **Upload** `api/.htaccess` to Hostinger
2. **Wait** 5-10 minutes for CDN cache to clear
3. **Test** login endpoint
4. **Should work** ✅

---

## 🔍 Alternative: Bypass CDN

If CDN continues to cause issues:

1. **Contact Hostinger support** to:
   - Clear CDN cache for `api.menupi.com`
   - Or disable CDN for API subdomain
   - Or whitelist API paths from CDN

2. **Or use direct server IP** (temporary workaround):
   - Find server IP in Hostinger panel
   - Test directly (won't work for production, but confirms PHP works)

---

**Status:** ✅ `.htaccess` file fixed and ready to upload

