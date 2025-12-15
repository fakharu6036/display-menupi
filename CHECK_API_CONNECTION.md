# 🔍 Check API Connection

## Quick Check

### 1. Check Current API URL

Open browser console (F12) and run:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
```

### 2. Test API Endpoint

In browser console, test the API:
```javascript
fetch('https://api.menupi.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Or use curl:
```bash
curl https://api.menupi.com/api/health
```

---

## 🔧 Fix Connection Issues

### Issue 1: API URL Not Set

**Problem:** `VITE_API_URL` environment variable not configured in Vercel

**Solution:**
1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Add: `VITE_API_URL = https://api.menupi.com/api`
4. Select: **Production**, **Preview**, **Development**
5. **Redeploy** the frontend

---

### Issue 2: Backend Not Running

**Problem:** PHP backend on Hostinger is not accessible

**Solution:**
1. Check if `https://api.menupi.com` is accessible
2. Test: `curl https://api.menupi.com/api/health`
3. If 404/500, check:
   - Files uploaded to Hostinger
   - `.htaccess` is in place
   - `.env` file exists with correct config
   - PHP version is 7.4+

---

### Issue 3: CORS Errors

**Problem:** Browser console shows CORS errors

**Solution:**
1. Check `api/config/config.php` or `.env`:
   ```
   ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
   ```
2. Verify both domains are in the allowed list
3. Restart PHP if needed (or wait for cache clear)

---

### Issue 4: Wrong API URL

**Problem:** Frontend is trying to connect to `localhost:3001`

**Solution:**
1. Check environment variable is set correctly
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Check Vercel deployment logs

---

## ✅ Verification Steps

### Step 1: Check Environment Variable

**In Vercel:**
- Settings → Environment Variables
- Verify `VITE_API_URL` exists
- Value: `https://api.menupi.com/api`

### Step 2: Test API Directly

```bash
# Test health endpoint
curl https://api.menupi.com/api/health

# Expected response:
# {"success":true,"data":{"status":"ok","timestamp":"...","database":"connected"}}
```

### Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Reload page
4. Look for requests to `api.menupi.com`
5. Check if they succeed (200) or fail (CORS/404/500)

### Step 4: Check API Response

In browser console:
```javascript
// Test API connection
fetch('https://api.menupi.com/api/health', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

---

## 🐛 Common Issues

### "Failed to fetch" Error

**Causes:**
- API server not running
- Wrong API URL
- CORS blocking
- Network issue

**Fix:**
1. Verify API is accessible: `curl https://api.menupi.com/api/health`
2. Check CORS configuration
3. Verify environment variable

### CORS Error

**Error:** `Access to fetch at 'https://api.menupi.com/api/...' from origin 'https://app.menupi.com' has been blocked by CORS policy`

**Fix:**
1. Check `ALLOWED_ORIGINS` in PHP backend
2. Ensure `app.menupi.com` and `tv.menupi.com` are in the list
3. Restart PHP or clear cache

### 404 Not Found

**Error:** API endpoint returns 404

**Fix:**
1. Check `.htaccess` is in `/api/` directory
2. Verify `mod_rewrite` is enabled
3. Check file paths are correct

### 500 Internal Server Error

**Error:** API returns 500

**Fix:**
1. Check PHP error logs in Hostinger
2. Verify `.env` file exists and is correct
3. Check database connection
4. Verify file permissions (755 for folders, 644 for files)

---

## 📋 Checklist

- [ ] `VITE_API_URL` set in Vercel environment variables
- [ ] Value is `https://api.menupi.com/api` (not localhost)
- [ ] Frontend redeployed after setting environment variable
- [ ] `https://api.menupi.com/api/health` returns success
- [ ] CORS allows `app.menupi.com` and `tv.menupi.com`
- [ ] No CORS errors in browser console
- [ ] API requests show in Network tab
- [ ] API responses are 200 (not 404/500)

---

## 🔗 Quick Links

- **Vercel Environment Variables:** https://vercel.com/[your-project]/settings/environment-variables
- **Hostinger File Manager:** https://hpanel.hostinger.com/file-manager
- **API Health Check:** https://api.menupi.com/api/health

---

**Last Updated:** After commit `402d398`

