# 🔧 Fix Backend Connection

## ⚡ Quick Fix

### Step 1: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/[your-project]/settings/environment-variables

2. **Add Environment Variable:**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://api.menupi.com/api`
   - **Environment:** Select **Production**, **Preview**, and **Development**

3. **Save and Redeploy:**
   - After adding, Vercel will prompt to redeploy
   - Or manually redeploy from Deployments tab

---

## 🔍 Verify Connection

### Test 1: Check Environment Variable

Open browser console (F12) and run:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

**Expected:** `https://api.menupi.com/api`  
**If shows:** `undefined` → Environment variable not set

---

### Test 2: Test API Endpoint

In browser console:
```javascript
fetch('https://api.menupi.com/api/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ API Connected:', data);
  })
  .catch(err => {
    console.error('❌ API Error:', err);
  });
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "...",
    "database": "connected"
  }
}
```

---

## 🐛 Common Issues

### Issue 1: Environment Variable Not Set

**Symptom:** API calls go to `http://localhost:3001/api`

**Fix:**
1. Add `VITE_API_URL` in Vercel
2. Value: `https://api.menupi.com/api`
3. Redeploy

---

### Issue 2: Backend Not Accessible

**Symptom:** "Failed to fetch" or CORS errors

**Fix:**
1. Test API directly: `curl https://api.menupi.com/api/health`
2. If 404/500:
   - Check PHP files uploaded to Hostinger
   - Verify `.htaccess` exists
   - Check `.env` file is configured
3. If CORS error:
   - Check `ALLOWED_ORIGINS` in PHP backend
   - Ensure `app.menupi.com` and `tv.menupi.com` are allowed

---

### Issue 3: Wrong API URL

**Symptom:** Requests fail or go to wrong domain

**Fix:**
1. Verify `VITE_API_URL` value is exactly: `https://api.menupi.com/api`
2. No trailing slash
3. Includes `/api` at the end
4. Clear browser cache and hard refresh

---

## 📋 Checklist

- [ ] `VITE_API_URL` environment variable added in Vercel
- [ ] Value is `https://api.menupi.com/api` (exact)
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Frontend redeployed after setting variable
- [ ] `https://api.menupi.com/api/health` returns success
- [ ] Browser console shows correct API URL
- [ ] No CORS errors in console
- [ ] API requests succeed (200 status)

---

## 🚀 Quick Steps Summary

1. **Vercel Dashboard** → Settings → Environment Variables
2. **Add:** `VITE_API_URL` = `https://api.menupi.com/api`
3. **Redeploy** frontend
4. **Test:** Open browser console, check API URL
5. **Verify:** API calls should go to `api.menupi.com`

---

**See `CHECK_API_CONNECTION.md` for detailed troubleshooting.**

