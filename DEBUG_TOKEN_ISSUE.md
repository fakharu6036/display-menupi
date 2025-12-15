# 🔍 Debug "Unauthorized: No token provided" Error

## 🔍 Problem

Getting `{"success":false,"error":"Unauthorized: No token provided"}` when accessing:
- `https://api.menupi.com/storage/usage`
- `https://api.menupi.com/storage/breakdown`
- `https://api.menupi.com/screens`
- `https://api.menupi.com/media`

---

## ✅ API Endpoint Works

**Tested with curl:**
```bash
# Login to get token
curl -X POST https://api.menupi.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hello@gmail.com","password":"hello123"}'

# Use token to access storage
curl -X GET https://api.menupi.com/storage/usage \
  -H "Authorization: Bearer [TOKEN]"

# Result: {"usedMB":1.01} ✅
```

**Conclusion:** The API endpoint works correctly when token is provided.

---

## 🔍 Possible Causes

### 1. **Frontend Not Sending Token**

**Check in Browser Console:**
```javascript
// Check if token exists
localStorage.getItem('menupi_user')

// Should return JSON with token
// If null, user needs to login again
```

**Solution:**
- Make sure you're logged in
- Check browser localStorage has `menupi_user` with valid token
- If missing, login again

### 2. **Frontend Using Wrong API URL**

**Check Network Tab:**
- Open DevTools → Network tab
- Look at the request URL
- Should be: `https://api.menupi.com/storage/usage` ✅
- NOT: `https://api.menupi.com/api/storage/usage` ❌

**If still using `/api/` prefix:**
- Vercel deployment might not be complete yet
- Wait 1-3 minutes for deployment
- Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`

### 3. **Hostinger Stripping Authorization Header**

**Test:**
- The API should handle this with `X-Authorization` fallback
- Check if both headers are being sent in Network tab

---

## ✅ Quick Fixes

### Fix 1: Clear Browser Cache & Relogin

1. **Clear localStorage:**
   ```javascript
   localStorage.clear()
   ```

2. **Reload page and login again**

3. **Check token is saved:**
   ```javascript
   JSON.parse(localStorage.getItem('menupi_user')).token
   ```

### Fix 2: Wait for Vercel Deployment

1. **Check deployment status:**
   - https://vercel.com/fakharu6036s-projects/menupi-signage
   - Wait for latest deployment to show "Ready"

2. **Hard refresh browser:**
   - `Ctrl+Shift+R` (Windows)
   - `Cmd+Shift+R` (Mac)

### Fix 3: Check Network Tab

1. **Open DevTools → Network tab**
2. **Try to access dashboard**
3. **Click on `/storage/usage` request**
4. **Check:**
   - **Request URL:** Should be `https://api.menupi.com/storage/usage`
   - **Request Headers:** Should have `Authorization: Bearer ...`
   - **Response:** Check error message

---

## 🧪 Test Commands

```bash
# Test login (get token)
curl -X POST https://api.menupi.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hello@gmail.com","password":"hello123"}'

# Test storage with token (replace TOKEN)
curl -X GET https://api.menupi.com/storage/usage \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Authorization: Bearer TOKEN"

# Should return: {"usedMB":1.01}
```

---

## 📝 Expected Behavior

**After login:**
1. Token is saved in `localStorage.getItem('menupi_user')`
2. All API calls include `Authorization: Bearer [TOKEN]` header
3. API returns data successfully

**If token missing:**
1. Check localStorage
2. Relogin if needed
3. Verify token is being sent in Network tab

---

**Status:** API works correctly. Issue is likely frontend not sending token or using wrong URL. Check browser console and Network tab.

